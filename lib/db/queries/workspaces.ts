"use server";

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  workspace,
  workspaceMember,
  type Workspace,
  type WorkspaceMember,
} from "../schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function createWorkspace(
  data: Pick<Workspace, "name" | "description" | "ownerId">
): Promise<Workspace> {
  const [newWorkspace] = await db
    .insert(workspace)
    .values({
      name: data.name,
      description: data.description,
      ownerId: data.ownerId,
    })
    .returning();

  // Add owner as a member with "owner" role
  await db.insert(workspaceMember).values({
    workspaceId: newWorkspace.id,
    userId: data.ownerId,
    role: "owner",
  });

  return newWorkspace;
}

export async function getWorkspaceById(id: string): Promise<Workspace | null> {
  const [result] = await db
    .select()
    .from(workspace)
    .where(eq(workspace.id, id))
    .limit(1);
  return result ?? null;
}

export async function getWorkspacesForUser(userId: string): Promise<
  Array<Workspace & { role: WorkspaceMember["role"] }>
> {
  const results = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      role: workspaceMember.role,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
    .where(eq(workspaceMember.userId, userId));

  return results;
}

export async function updateWorkspace(
  id: string,
  data: Partial<Pick<Workspace, "name" | "description">>
): Promise<Workspace | null> {
  const [updated] = await db
    .update(workspace)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workspace.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const result = await db.delete(workspace).where(eq(workspace.id, id)).returning();
  return result.length > 0;
}

// Member management
export async function getWorkspaceMembers(workspaceId: string) {
  return db
    .select()
    .from(workspaceMember)
    .where(eq(workspaceMember.workspaceId, workspaceId));
}

export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: WorkspaceMember["role"] = "viewer"
): Promise<WorkspaceMember> {
  const [member] = await db
    .insert(workspaceMember)
    .values({ workspaceId, userId, role })
    .returning();
  return member;
}

export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceMember["role"]
): Promise<WorkspaceMember | null> {
  const [updated] = await db
    .update(workspaceMember)
    .set({ role })
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .returning();
  return updated ?? null;
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .returning();
  return result.length > 0;
}

export async function getMemberRole(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMember["role"] | null> {
  const [member] = await db
    .select({ role: workspaceMember.role })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .limit(1);
  return member?.role ?? null;
}

