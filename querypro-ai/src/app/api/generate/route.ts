import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { z } from "zod";

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
  "Format your reply as a short explanation followed by the SQL statement.",
].join(" ");

/**
 * Secure AI generation endpoint using Groq SDK.
 * Reads GROQ_API_KEY from environment variables and streams completions.
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
    return Response.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 }
    );
  }
  const { prompt, schemaContext } = parsed.data;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GROQ_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const system = schemaContext?.length
      ? `${SYSTEM_PROMPT}\n\nTables currently in scope: ${schemaContext.join(", ")}.`
      : SYSTEM_PROMPT;

    const modelName = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      model: modelName,
      stream: true,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            if (req.signal.aborted) return;
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) controller.enqueue(encoder.encode(content));
          }
          controller.close();
        } catch (streamErr) {
          console.error("[/api/generate] stream failed", streamErr);
          controller.error(streamErr);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Generation-Source": "groq",
      },
    });
  } catch (err) {
    console.error("[/api/generate] provider request failed", err);
    const message =
      err instanceof Error
        ? err.message
        : "The AI provider request failed. Check server logs.";
    return Response.json({ error: message }, { status: 502 });
  }
}
