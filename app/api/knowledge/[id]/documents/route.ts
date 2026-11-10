import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  addDocument,
  deleteDocument,
  getDocumentsForKnowledgeBase,
  getKnowledgeBaseById,
} from "@/lib/db/queries/knowledge-base";
import { ChatSDKError } from "@/lib/errors";

const addDocumentSchema = z.object({
  title: z.string().min(1).max(256),
  content: z.string().min(1),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const { id } = await params;

    // Verify user owns this knowledge base
    const kb = await getKnowledgeBaseById(id, session.user.id);
    if (!kb) {
      return NextResponse.json(
        { error: "Knowledge base not found" },
        { status: 404 }
      );
    }

    const documents = await getDocumentsForKnowledgeBase(id);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: "Failed to get documents" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const { id } = await params;

    // Verify user owns this knowledge base
    const kb = await getKnowledgeBaseById(id, session.user.id);
    if (!kb) {
      return NextResponse.json(
        { error: "Knowledge base not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = addDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const document = await addDocument({
      knowledgeBaseId: id,
      title: parsed.data.title,
      content: parsed.data.content,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Add document error:", error);
    return NextResponse.json(
      { error: "Failed to add document" },
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
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // Verify user owns this knowledge base
    const kb = await getKnowledgeBaseById(id, session.user.id);
    if (!kb) {
      return NextResponse.json(
        { error: "Knowledge base not found" },
        { status: 404 }
      );
    }

    const deleted = await deleteDocument(documentId, id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
