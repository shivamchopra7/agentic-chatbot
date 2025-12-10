import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createPromptTemplate,
  deletePromptTemplate,
  getTemplatesByUserId,
  updatePromptTemplate,
  type TemplateCategory,
} from "@/lib/db/queries/templates";
import { ChatSDKError } from "@/lib/errors";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(128),
  description: z.string().max(500).optional(),
  content: z.string().min(1, "Content is required"),
  category: z.enum(["coding", "writing", "marketing", "analysis", "general", "custom"]),
});

const updateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  category: z.enum(["coding", "writing", "marketing", "analysis", "general", "custom"]).optional(),
});

const deleteTemplateSchema = z.object({
  id: z.string().uuid(),
});

// GET /api/templates - List all templates
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const templates = await getTemplatesByUserId(session.user.id);
    return NextResponse.json({ templates });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create a new template
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const template = await createPromptTemplate({
      userId: session.user.id,
      ...parsed.data,
      category: parsed.data.category as TemplateCategory,
    });

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// PATCH /api/templates - Update a template
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = updateTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const template = await updatePromptTemplate({
      ...parsed.data,
      userId: session.user.id,
      category: parsed.data.category as TemplateCategory | undefined,
    });

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/templates - Delete a template
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = deleteTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await deletePromptTemplate(parsed.data.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

