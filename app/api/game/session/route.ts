import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

const PROFESSION_ID = "escritorio";
const INITIAL_MONEY = 500;

// GET - Retrieve active game session for the current user
export async function GET() {
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

		const sessions = await sql`
      SELECT * FROM game_sessions
      WHERE user_id = ${payload.id} AND status = 'ACTIVE'
      ORDER BY started_at DESC
      LIMIT 1
    `;

		if (sessions.length === 0) {
			return NextResponse.json({ session: null });
		}

		const session = sessions[0];

		const logs = await sql`
      SELECT * FROM game_day_logs
      WHERE game_session_id = ${session.id}
      ORDER BY day ASC
    `;

		return NextResponse.json({ session, logs });
	} catch (error) {
		console.error("Get session error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// POST - Create a new game session
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
			characterName?: string;
			avatarHair?: string;
			avatarSkin?: string;
			avatarOutfit?: string;
		};

		const characterName = body.characterName?.trim();
		if (!characterName) {
			return NextResponse.json(
				{ error: "Nome do personagem e obrigatorio" },
				{ status: 400 },
			);
		}

		const avatarHair = body.avatarHair ?? "curto";
		const avatarSkin = body.avatarSkin ?? "medio";
		const avatarOutfit = body.avatarOutfit ?? "casual";

		// Mark existing active sessions as completed
		await sql`
      UPDATE game_sessions SET status = 'COMPLETED'
      WHERE user_id = ${payload.id} AND status = 'ACTIVE'
    `;

		const result = await sql`
      INSERT INTO game_sessions (
        user_id, character_name, profession_id,
        money, knowledge, happiness, energy, health,
        avatar_hair, avatar_skin, avatar_outfit,
        credit_score, impulse_score, lifestyle_level
      )
      VALUES (
        ${payload.id}, ${characterName}, ${PROFESSION_ID},
        ${INITIAL_MONEY}, 20, 70, 100, 100,
        ${avatarHair}, ${avatarSkin}, ${avatarOutfit},
        600, 0, 3
      )
      RETURNING *
    `;

		return NextResponse.json({ session: result[0] });
	} catch (error) {
		console.error("Create session error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// PATCH - Update session settings (lifestyle level, budget, tutorial shown)
export async function PATCH(request: Request) {
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
			lifestyleLevel?: number;
			budgetIncomeExpected?: number;
			budgetFixedExpenses?: number;
			budgetEmergencyReserve?: number;
			budgetSavingsGoal?: number;
			tutorialShown?: boolean;
			monthlyChoices?: Record<string, string>;
		};

		const { sessionId } = body;
		if (!sessionId) {
			return NextResponse.json(
				{ error: "sessionId obrigatorio" },
				{ status: 400 },
			);
		}

		// Verify ownership
		const sessions = await sql`
      SELECT id FROM game_sessions WHERE id = ${sessionId} AND user_id = ${payload.id} AND status = 'ACTIVE'
    `;
		if (sessions.length === 0) {
			return NextResponse.json(
				{ error: "Sessao nao encontrada" },
				{ status: 404 },
			);
		}

		const monthlyChoicesJson =
			body.monthlyChoices !== undefined
				? JSON.stringify(body.monthlyChoices)
				: null;

		const updated = await sql`
      UPDATE game_sessions SET
        lifestyle_level           = COALESCE(${body.lifestyleLevel ?? null}, lifestyle_level),
        budget_income_expected    = COALESCE(${body.budgetIncomeExpected ?? null}, budget_income_expected),
        budget_fixed_expenses     = COALESCE(${body.budgetFixedExpenses ?? null}, budget_fixed_expenses),
        budget_emergency_reserve  = COALESCE(${body.budgetEmergencyReserve ?? null}, budget_emergency_reserve),
        budget_savings_goal       = COALESCE(${body.budgetSavingsGoal ?? null}, budget_savings_goal),
        tutorial_shown            = COALESCE(${body.tutorialShown ?? null}, tutorial_shown),
        monthly_choices           = COALESCE(${monthlyChoicesJson}::jsonb, monthly_choices),
        updated_at                = NOW()
      WHERE id = ${sessionId}
      RETURNING *
    `;

		return NextResponse.json({ session: updated[0] });
	} catch (error) {
		console.error("Patch session error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
