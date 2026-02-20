import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { GAME_CONFIG } from "@/data/game-config";

// POST - Advance a day and apply effects of choice
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

    const { sessionId, eventType, eventTitle, choiceMade, diceResult, effects } =
      await request.json();

    if (!sessionId || !eventType || !eventTitle || !choiceMade) {
      return NextResponse.json(
        { error: "Dados do evento incompletos" },
        { status: 400 }
      );
    }

    // Get current session
    const sessions = await sql`
      SELECT * FROM game_sessions
      WHERE id = ${sessionId} AND user_id = ${payload.id} AND status = 'ACTIVE'
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: "Sessao nao encontrada" },
        { status: 404 }
      );
    }

    const session = sessions[0];
    const currentDay = Number(session.current_day);

    // Check if game is over
    if (currentDay >= GAME_CONFIG.TOTAL_DAYS) {
      await sql`
        UPDATE game_sessions SET status = 'COMPLETED' WHERE id = ${sessionId}
      `;
      return NextResponse.json({
        session: { ...session, status: "COMPLETED" },
        gameOver: true,
      });
    }

    // Apply effects to stats
    const efx = effects || {};
    const newMoney = Math.max(0, Number(session.money) + (efx.money || 0));
    const newKnowledge = Math.min(
      100,
      Math.max(0, Number(session.knowledge) + (efx.knowledge || 0))
    );
    const newHappiness = Math.min(
      100,
      Math.max(0, Number(session.happiness) + (efx.happiness || 0))
    );
    const newEnergy = Math.min(
      100,
      Math.max(0, Number(session.energy) + (efx.energy || 0))
    );
    const newHealth = Math.min(
      100,
      Math.max(0, Number(session.health) + (efx.health || 0))
    );

    const nextDay = currentDay + 1;

    // Log the day event
    await sql`
      INSERT INTO game_day_logs (game_session_id, day, event_type, event_title, choice_made, dice_result, effects_applied)
      VALUES (${sessionId}, ${currentDay}, ${eventType}, ${eventTitle}, ${choiceMade}, ${diceResult || null}, ${JSON.stringify(efx)})
    `;

    // Check if game ends now
    const isCompleted = nextDay > GAME_CONFIG.TOTAL_DAYS;
    const newStatus = isCompleted ? "COMPLETED" : "ACTIVE";

    // Update session
    const updated = await sql`
      UPDATE game_sessions
      SET current_day = ${nextDay},
          money = ${newMoney},
          knowledge = ${newKnowledge},
          happiness = ${newHappiness},
          energy = ${newEnergy},
          health = ${newHealth},
          status = ${newStatus},
          updated_at = NOW()
      WHERE id = ${sessionId}
      RETURNING *
    `;

    return NextResponse.json({
      session: updated[0],
      gameOver: isCompleted,
    });
  } catch (error) {
    console.error("Advance day error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
