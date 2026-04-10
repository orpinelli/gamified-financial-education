import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { computeMonthlyChoiceEffects } from "@/lib/monthly-choices";

const TOTAL_DAYS = 365;
const SALARY = 2000;

type CardOption = {
	label: string;
	money_now: number;
	happiness_now: number;
	knowledge_now: number;
	money_later: number;
	happiness_later: number;
	is_deferred: boolean;
};

type Card = {
	id: number;
	category: "BOM" | "RUIM" | "DECISAO" | "COMPRA_IMPULSIVA";
	money_effect: number;
	happiness_effect: number;
	knowledge_effect: number;
	score_effect: number;
	options: CardOption[] | null;
	deferred_money_effect: number;
	deferred_happiness_effect: number;
};

type Session = {
	id: number;
	current_day: number;
	money: string;
	knowledge: number;
	happiness: number;
	energy: number;
	health: number;
	credit_score: number;
	impulse_score: number;
	lifestyle_level: number;
	monthly_choices: Record<string, string> | null;
	pending_deferred_card_id: number | null;
	status: string;
};

function clamp(v: number, min = 0, max = 100) {
	return Math.min(max, Math.max(min, v));
}

function dayToMonth(day: number) {
	// Month 1 = days 1-30, month 2 = days 31-60, etc. (30-day months)
	return Math.ceil(day / 30);
}

// POST - Advance the game with roulette result + optional card
export async function POST(request: Request) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("token")?.value;
		if (!token) {
			return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
		}
		const payload = await verifyToken(token);
		if (!payload) {
			return NextResponse.json({ error: "Token invalido" }, { status: 401 });
		}

		const body = (await request.json()) as {
			sessionId: number;
			rouletteResult: number; // 1-6
			cardId?: number | null;
			choiceIndex?: number | null;
		};

		const { sessionId, rouletteResult, cardId, choiceIndex } = body;

		if (
			!sessionId ||
			!rouletteResult ||
			rouletteResult < 1 ||
			rouletteResult > 6
		) {
			return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
		}

		// Load current session
		const sessions = await sql`
      SELECT * FROM game_sessions
      WHERE id = ${sessionId} AND user_id = ${payload.id} AND status = 'ACTIVE'
    `;
		if (sessions.length === 0) {
			return NextResponse.json(
				{ error: "Sessao nao encontrada" },
				{ status: 404 },
			);
		}
		const session = sessions[0] as Session;

		// Load card if provided
		let card: Card | null = null;
		if (cardId) {
			const cardRows =
				await sql`SELECT * FROM game_cards WHERE id = ${cardId} AND active = true`;
			card = (cardRows[0] as Card) ?? null;
		}

		// Load pending deferred card
		let deferredCard: Card | null = null;
		if (session.pending_deferred_card_id) {
			const defRows =
				await sql`SELECT * FROM game_cards WHERE id = ${session.pending_deferred_card_id}`;
			deferredCard = (defRows[0] as Card) ?? null;
		}

		const prevDay = Number(session.current_day);
		const nextDay = Math.min(prevDay + rouletteResult, TOTAL_DAYS);
		const prevMonth = dayToMonth(prevDay);
		const nextMonth = dayToMonth(nextDay);
		const crossedMonthStart = nextMonth > prevMonth;

		let money = Number(session.money);
		let knowledge = Number(session.knowledge);
		let happiness = Number(session.happiness);
		let creditScore = Number(session.credit_score);
		let impulseScore = Number(session.impulse_score);
		let newPendingDeferredCardId: number | null = null;

		// 1. Apply deferred card from previous turn (compra impulsiva regret)
		if (deferredCard) {
			money = Math.max(0, money + deferredCard.deferred_money_effect);
			happiness = clamp(happiness + deferredCard.deferred_happiness_effect);
		}

		// 2. Apply immediate card effects
		if (card) {
			if (card.category === "BOM" || card.category === "RUIM") {
				money = Math.max(0, money + card.money_effect);
				happiness = clamp(happiness + card.happiness_effect);
				knowledge = clamp(knowledge + card.knowledge_effect);
				creditScore = clamp(creditScore + card.score_effect, 0, 1000);
			} else if (
				(card.category === "DECISAO" || card.category === "COMPRA_IMPULSIVA") &&
				card.options &&
				choiceIndex != null
			) {
				const opt = card.options[choiceIndex];
				if (opt) {
					money = Math.max(0, money + opt.money_now);
					happiness = clamp(happiness + opt.happiness_now);
					knowledge = clamp(knowledge + opt.knowledge_now);

					if (opt.is_deferred) {
						// Store for next turn
						newPendingDeferredCardId = card.id;
						impulseScore += 1;
					}
					if (card.category === "COMPRA_IMPULSIVA") {
						creditScore = clamp(creditScore - 5, 0, 1000);
					}
				}
			}
		}

		// 3. Salary + monthly lifestyle choice costs at start of new month
		if (crossedMonthStart) {
			money += SALARY;
			const choices = session.monthly_choices ?? {};
			const { money: choicesMoney, happiness: choicesHappiness } =
				computeMonthlyChoiceEffects(choices);
			money = Math.max(0, money + choicesMoney); // choicesMoney is negative (expenses)
			happiness = clamp(happiness + choicesHappiness);
		}

		// 4. Log the day event
		await sql`
      INSERT INTO game_day_logs
        (game_session_id, day, event_type, event_title, roulette_result, card_id, choice_index, effects_applied)
      VALUES (
        ${sessionId},
        ${prevDay},
        ${card ? card.category : "ROLETA"},
        ${card ? `card:${card.id}` : "avanco"},
        ${rouletteResult},
        ${cardId ?? null},
        ${choiceIndex ?? null},
        ${JSON.stringify({ money: money - Number(session.money), happiness: happiness - Number(session.happiness) })}
      )
    `;

		// 5. Check game over
		const isCompleted = nextDay >= TOTAL_DAYS;
		const newStatus = isCompleted ? "COMPLETED" : "ACTIVE";

		// 6. Update session
		const updated = await sql`
      UPDATE game_sessions SET
        current_day = ${nextDay},
        money = ${money},
        knowledge = ${knowledge},
        happiness = ${happiness},
        credit_score = ${creditScore},
        impulse_score = ${impulseScore},
        pending_deferred_card_id = ${newPendingDeferredCardId},
        status = ${newStatus},
        updated_at = NOW()
      WHERE id = ${sessionId}
      RETURNING *
    `;

		return NextResponse.json({
			session: updated[0],
			gameOver: isCompleted,
			monthStart: crossedMonthStart,
			newMonth: crossedMonthStart ? nextMonth : null,
		});
	} catch (error) {
		console.error("Advance error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
