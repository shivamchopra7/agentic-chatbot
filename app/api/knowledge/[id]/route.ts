import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getKnowledgeBaseById,
  deleteKnowledgeBase,
} from "@/lib/db/queries/knowledge-base";
import { ChatSDKError } from "@/lib/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const { id } = await params;
    const kb = await getKnowledgeBaseById(id, session.user.id);

    if (!kb) {
      return NextResponse.json(
        { error: "Knowledge base not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ knowledgeBase: kb });
  } catch (error) {
    console.error("Get knowledge base error:", error);
    return NextResponse.json(
      { error: "Failed to get knowledge base" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const { id } = await params;
    const deleted = await deleteKnowledgeBase(id, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Knowledge base not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete knowledge base error:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge base" },
      { status: 500 }
    );
  }
}

