import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const saveHistorySchema = z.object({
  query: z.string().min(1, "query is required").max(20000, "query is too long"),
  status: z.enum(["success", "error", "running"]),
  durationMs: z.number().int().nonnegative().nullable().optional(),
});

export async function GET() {
  try {
    const history = await prisma.queryHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        query: true,
        status: true,
        durationMs: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, history }, { status: 200 });
  } catch (error) {
    console.error("[/api/history/save GET] failed to load query history", error);
    return NextResponse.json(
      { success: false, error: "Failed to load query history." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = saveHistorySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 }
    );
  }

  const { query, status, durationMs } = parsed.data;

  try {
    const entry = await prisma.queryHistory.create({
      data: {
        query,
        status,
        durationMs: durationMs ?? null,
      },
    });

    return Response.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    console.error("[/api/history/save] failed to save query history", error);
    return Response.json({ error: "Failed to save query history." }, { status: 500 });
  }
}
