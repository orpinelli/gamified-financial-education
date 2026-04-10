import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";

// GET /api/game/month-summary?sessionId=X&month=Y
export async function GET(request: Request) {
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

		const { searchParams } = new URL(request.url);
		const sessionId = Number(searchParams.get("sessionId"));
		const month = Number(searchParams.get("month"));

		if (!sessionId || !month || month < 1 || month > 12) {
			return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });
		}

		// Verify ownership
		const sessions = await sql`
      SELECT * FROM game_sessions WHERE id = ${sessionId} AND user_id = ${payload.id}
    `;
		if (sessions.length === 0) {
			return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });
		}
		const session = sessions[0] as {
			budget_savings_goal: string | null;
			credit_score: number;
			impulse_score: number;
			lifestyle_level: number;
		};

		// Days in the month (30-day months)
		const dayStart = (month - 1) * 30 + 1;
		const dayEnd = month * 30;

		// Fetch logs for this month
		const logs = await sql`
      SELECT
        gdl.day,
        gdl.card_id,
        gdl.choice_index,
        gdl.effects_applied,
        gc.category,
        gc.money_effect,
        gc.happiness_effect,
        gc.options
      FROM game_day_logs gdl
      LEFT JOIN game_cards gc ON gc.id = gdl.card_id
      WHERE gdl.game_session_id = ${sessionId}
        AND gdl.day >= ${dayStart}
        AND gdl.day <= ${dayEnd}
      ORDER BY gdl.day ASC
    `;

		// Aggregate effects
		let totalMoneyIn = 0;
		let totalMoneyOut = 0;
		let happinessSum = 0;
		let happinessDays = 0;
		let impulsePurchases = 0;

		for (const log of logs as Array<{
			effects_applied: { money?: number; happiness?: number } | null;
			category: string | null;
		}>) {
			const fx = log.effects_applied ?? {};
			const m = fx.money ?? 0;
			if (m > 0) totalMoneyIn += m;
			if (m < 0) totalMoneyOut += Math.abs(m);
			if (fx.happiness != null) {
				happinessSum += fx.happiness;
				happinessDays++;
			}
			if (log.category === "COMPRA_IMPULSIVA") impulsePurchases++;
		}

		// Salary received this month
		const salaryReceived = month >= 1 ? 2000 : 0;
		totalMoneyIn += salaryReceived;

		const avgHappiness = happinessDays > 0 ? Math.round(happinessSum / happinessDays) : 0;

		// Player profile
		const profile =
			impulsePurchases >= 3
				? "Gastador Impulsivo"
				: impulsePurchases === 0
					? "Planejador Emocional"
					: "Equilibrado";

		const savingsGoal = session.budget_savings_goal
			? Number(session.budget_savings_goal)
			: null;
		const actualSavings = Math.max(0, totalMoneyIn - totalMoneyOut);
		const savingsPercent =
			savingsGoal && savingsGoal > 0
				? Math.round((actualSavings / savingsGoal) * 100)
				: null;

		const MONTH_NAMES = [
			"Janeiro",
			"Fevereiro",
			"Março",
			"Abril",
			"Maio",
			"Junho",
			"Julho",
			"Agosto",
			"Setembro",
			"Outubro",
			"Novembro",
			"Dezembro",
		];

		return NextResponse.json({
			summary: {
				monthName: MONTH_NAMES[month - 1],
				month,
				totalMoneyIn,
				totalMoneyOut,
				actualSavings,
				savingsGoal,
				savingsPercent,
				avgHappiness,
				creditScore: Number(session.credit_score),
				impulseScore: Number(session.impulse_score),
				impulsePurchases,
				profile,
				logsCount: logs.length,
			},
		});
	} catch (error) {
		console.error("Month summary error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
