import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const saveWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(250, "Workspace name is too long"),
  data: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ success: true, workspaces }, { status: 200 });
  } catch (error) {
    console.error("[/api/workspace/save GET] Error fetching workspaces:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve workspaces" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const parsed = saveWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join("; "),
        },
        { status: 400 }
      );
    }

    const { name, data } = parsed.data;

    const workspace = await prisma.workspace.create({
      data: {
        name,
        data: data ? JSON.parse(JSON.stringify(data)) : {},
      },
    });

    return NextResponse.json({ success: true, workspace }, { status: 201 });
  } catch (error) {
    console.error("[/api/workspace/save POST] Error saving workspace:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save workspace" },
      { status: 500 }
    );
  }
}
