import { NextRequest } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateSqlForPrompt } from "@/lib/mock-data";

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().min(1, "prompt is required").max(4000, "prompt is too long"),
  /** Table names currently visible to the user, so the model can ground its answer in the real schema. */
  schemaContext: z.array(z.string().max(200)).max(50).optional(),
});

const SYSTEM_PROMPT = [
  "You are the AI assistant embedded in QueryPro AI's SQL Studio.",
  "You write correct, efficient SQL for the user's connected database and briefly explain your reasoning.",
  "Prefer explicit column lists over SELECT *, always qualify columns when more than one table is involved,",
  "and call out any assumptions you had to make about the schema.",
].join(" ");

/**
 * Secure AI generation endpoint. The client only ever sends a prompt here —
 * this route is the sole place that reads the provider API key and appends
 * the system prompt, so no secret or prompt-engineering detail ever ships
 * to the browser.
 *
 * If no provider key is configured (e.g. local/demo environments), this
 * falls back to the app's built-in mock generator, streamed through the
 * exact same response shape — so the client's streaming UI code has
 * nothing provider-specific to branch on.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues.map((issue) => issue.message).join("; ") }, { status: 400 });
  }
  const { prompt, schemaContext } = parsed.data;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return streamMockResponse(prompt, req.signal);
  }

  try {
    const system = schemaContext?.length ? `${SYSTEM_PROMPT}\n\nTables currently in scope: ${schemaContext.join(", ")}.` : SYSTEM_PROMPT;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system,
      prompt,
      abortSignal: req.signal,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[/api/generate] provider request failed", err);
    return Response.json({ error: "The AI provider request failed. Check server logs." }, { status: 502 });
  }
}

/** Streams the app's existing mock SQL generator word-by-word, so the UI works before an API key is configured. */
function streamMockResponse(prompt: string, signal: AbortSignal) {
  const { explanation, sql } = generateSqlForPrompt(prompt);
  const text = `${explanation}\n\n${sql}`;
  const words = text.split(/(\s+)/);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (const word of words) {
        // The client disconnected (navigated away, aborted the fetch) —
        // stop working and don't touch a controller nothing is reading from.
        if (signal.aborted) return;
        controller.enqueue(encoder.encode(word));
        await new Promise((resolve) => setTimeout(resolve, 12));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Lets the client (or a developer in devtools) tell a demo response apart from a live model call.
      "X-Generation-Source": "mock",
    },
  });
}
