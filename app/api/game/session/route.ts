import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { sql } from "@/lib/db";
import { PROFESSIONS } from "@/data/professions";

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
      { status: 500 }
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

    const { characterName, professionId } = await request.json();

    if (!characterName || !professionId) {
      return NextResponse.json(
        { error: "Nome do personagem e profissao sao obrigatorios" },
        { status: 400 }
      );
    }

    const profession = PROFESSIONS.find((p) => p.id === professionId);
    if (!profession) {
      return NextResponse.json(
        { error: "Profissao invalida" },
        { status: 400 }
      );
    }

    // Mark existing active sessions as completed
    await sql`
      UPDATE game_sessions SET status = 'COMPLETED'
      WHERE user_id = ${payload.id} AND status = 'ACTIVE'
    `;

    const result = await sql`
      INSERT INTO game_sessions (user_id, character_name, profession_id, money, knowledge, happiness, energy, health)
      VALUES (${payload.id}, ${characterName}, ${professionId}, ${profession.baseSalary}, 20, 70, 100, 100)
      RETURNING *
    `;

    return NextResponse.json({ session: result[0] });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
