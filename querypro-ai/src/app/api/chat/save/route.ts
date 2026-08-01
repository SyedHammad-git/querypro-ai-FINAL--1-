import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const saveChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1, "content is required").max(20000, "content is too long"),
  sql: z.string().max(20000).optional(),
});

export async function GET() {
  try {
    const chatMessages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "asc" },
      take: 100,
      select: {
        id: true,
        role: true,
        content: true,
        sql: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, messages: chatMessages }, { status: 200 });
  } catch (error) {
    console.error("[/api/chat/save GET] failed to load chat messages", error);
    return NextResponse.json(
      { success: false, error: "Failed to load chat messages." },
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

  const parsed = saveChatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues.map((issue) => issue.message).join("; ") },
      { status: 400 }
    );
  }

  const { role, content, sql } = parsed.data;

  try {
    const message = await prisma.chatMessage.create({
      data: {
        role,
        content,
        sql: sql ?? null,
      },
    });

    return Response.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("[/api/chat/save] failed to save chat message", error);
    return Response.json({ error: "Failed to save chat message." }, { status: 500 });
  }
}
