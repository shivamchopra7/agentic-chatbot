import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getMemberRole,
} from "@/lib/db/queries/workspaces";
import { ChatSDKError } from "@/lib/errors";

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().optional(),
});

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
    const workspace = await getWorkspaceById(id);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if user is a member
    const role = await getMemberRole(id, session.user.id);
    if (!role) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ workspace, role });
  } catch (error) {
    console.error("Get workspace error:", error);
    return NextResponse.json(
      { error: "Failed to get workspace" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const { id } = await params;

    // Check permissions (owner or admin only)
    const role = await getMemberRole(id, session.user.id);
    if (!role || !["owner", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const workspace = await updateWorkspace(id, parsed.data);
    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Update workspace error:", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
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

    // Only owner can delete
    const role = await getMemberRole(id, session.user.id);
    if (role !== "owner") {
      return NextResponse.json(
        { error: "Only the owner can delete the workspace" },
        { status: 403 }
      );
    }

    await deleteWorkspace(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete workspace error:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}

