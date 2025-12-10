import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  getWorkspaceMembers,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
  getMemberRole,
} from "@/lib/db/queries/workspaces";
import { ChatSDKError } from "@/lib/errors";

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "contributor", "viewer"]),
});

const updateMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "contributor", "viewer"]),
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

    // Check if user is a member
    const role = await getMemberRole(id, session.user.id);
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const members = await getWorkspaceMembers(id);
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Failed to get members" },
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

    // Only owner or admin can add members
    const role = await getMemberRole(id, session.user.id);
    if (!role || !["owner", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = addMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const member = await addWorkspaceMember(id, parsed.data.userId, parsed.data.role);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
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

    // Only owner or admin can update roles
    const role = await getMemberRole(id, session.user.id);
    if (!role || !["owner", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const member = await updateMemberRole(id, parsed.data.userId, parsed.data.role);
    return NextResponse.json({ member });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
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
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Only owner or admin can remove members
    const role = await getMemberRole(id, session.user.id);
    if (!role || !["owner", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    await removeWorkspaceMember(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

