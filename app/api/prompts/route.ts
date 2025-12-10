import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createSystemPrompt,
  deleteSystemPrompt,
  getSystemPromptsByUserId,
  updateSystemPrompt,
} from "@/lib/db/queries/system-prompts";
import { ChatSDKError } from "@/lib/errors";

const createPromptSchema = z.object({
  name: z.string().min(1, "Name is required").max(128),
  content: z.string().min(1, "Content is required"),
  isDefault: z.boolean().optional(),
});

const updatePromptSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128).optional(),
  content: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
});

const deletePromptSchema = z.object({
  id: z.string().uuid(),
});

// GET /api/prompts - List all user's system prompts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const prompts = await getSystemPromptsByUserId(session.user.id);
    return NextResponse.json({ prompts });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

// POST /api/prompts - Create a new system prompt
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = createPromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const newPrompt = await createSystemPrompt({
      userId: session.user.id,
      ...parsed.data,
    });

    return NextResponse.json({ prompt: newPrompt });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}

// PATCH /api/prompts - Update a system prompt
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = updatePromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateSystemPrompt({
      ...parsed.data,
      userId: session.user.id,
    });

    return NextResponse.json({ prompt: updated });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to update prompt" },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts - Delete a system prompt
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = deletePromptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await deleteSystemPrompt(parsed.data.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to delete prompt" },
      { status: 500 }
    );
  }
}

