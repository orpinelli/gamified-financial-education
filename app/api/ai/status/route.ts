import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		providers: {
			gemini: Boolean(process.env.GEMINI_API_KEY),
			ollama: Boolean(process.env.OLLAMA_BASE_URL),
		},
		defaultProvider: (process.env.AI_PROVIDER ?? "auto") as
			| "auto"
			| "gemini"
			| "ollama",
	});
}
