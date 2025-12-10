import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createKnowledgeBase,
  getKnowledgeBasesForUser,
} from "@/lib/db/queries/knowledge-base";
import { ChatSDKError } from "@/lib/errors";

const createKBSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().optional(),
  workspaceId: z.string().uuid().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const knowledgeBases = await getKnowledgeBasesForUser(session.user.id);
    return NextResponse.json({ knowledgeBases });
  } catch (error) {
    console.error("Get knowledge bases error:", error);
    return NextResponse.json(
      { error: "Failed to get knowledge bases" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = createKBSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const kb = await createKnowledgeBase({
      userId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      workspaceId: parsed.data.workspaceId ?? null,
    });

    return NextResponse.json({ knowledgeBase: kb }, { status: 201 });
  } catch (error) {
    console.error("Create knowledge base error:", error);
    return NextResponse.json(
      { error: "Failed to create knowledge base" },
      { status: 500 }
    );
  }
}

