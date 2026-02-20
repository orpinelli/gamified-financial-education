import { NextResponse } from "next/server";

interface StoryPayload {
	prompt: string;
	context?: string;
	preferredProvider?: "auto" | "gemini" | "ollama";
}

async function callGemini(
	apiKey: string,
	payload: StoryPayload,
): Promise<string | null> {
	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{
								text: `Gere uma micro-historia em portugues com 2 a 4 frases para jogo de educacao financeira.\nContexto: ${payload.context ?? ""}\nPedido: ${payload.prompt}`,
							},
						],
					},
				],
				generationConfig: {
					temperature: 0.8,
					maxOutputTokens: 120,
				},
			}),
		},
	);

	if (!response.ok) {
		return null;
	}

	const json = (await response.json()) as {
		candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
	};

	return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

async function callOllama(
	baseUrl: string,
	payload: StoryPayload,
): Promise<string | null> {
	const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: process.env.OLLAMA_MODEL || "llama3.1:8b",
			prompt: `Escreva uma micro-historia em portugues com 2 a 4 frases para um RPG de educacao financeira. Contexto: ${payload.context ?? ""}. Pedido: ${payload.prompt}`,
			stream: false,
		}),
	});

	if (!response.ok) {
		return null;
	}

	const json = (await response.json()) as { response?: string };
	return json.response?.trim() ?? null;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as StoryPayload;
		if (!body?.prompt) {
			return NextResponse.json(
				{ error: "Prompt obrigatorio" },
				{ status: 400 },
			);
		}

		const preferredProvider = body.preferredProvider ?? "auto";
		const geminiKey = process.env.GEMINI_API_KEY;
		const ollamaUrl = process.env.OLLAMA_BASE_URL;

		const order: Array<"gemini" | "ollama"> =
			preferredProvider === "gemini"
				? ["gemini", "ollama"]
				: preferredProvider === "ollama"
					? ["ollama", "gemini"]
					: ["gemini", "ollama"];

		for (const provider of order) {
			if (provider === "gemini" && geminiKey) {
				const story = await callGemini(geminiKey, body);
				if (story) {
					return NextResponse.json({ provider: "gemini", story });
				}
			}

			if (provider === "ollama" && ollamaUrl) {
				const story = await callOllama(ollamaUrl, body);
				if (story) {
					return NextResponse.json({ provider: "ollama", story });
				}
			}
		}

		return NextResponse.json({
			provider: "fallback",
			story:
				"O dia trouxe escolhas difíceis, mas cada decisão aproximou você de um equilíbrio financeiro mais sólido.",
		});
	} catch (error) {
		console.error("AI story error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
