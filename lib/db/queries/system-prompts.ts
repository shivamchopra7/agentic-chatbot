"use server";

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "@/lib/errors";
import { systemPrompt, type SystemPrompt } from "../schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export interface CreateSystemPromptInput {
  userId: string;
  name: string;
  content: string;
  isDefault?: boolean;
}

export interface UpdateSystemPromptInput {
  id: string;
  userId: string;
  name?: string;
  content?: string;
  isDefault?: boolean;
}

/**
 * Creates a new system prompt
 */
export async function createSystemPrompt(
  input: CreateSystemPromptInput
): Promise<SystemPrompt> {
  try {
    // If this is set as default, unset all other defaults first
    if (input.isDefault) {
      await db
        .update(systemPrompt)
        .set({ isDefault: false })
        .where(eq(systemPrompt.userId, input.userId));
    }

    const [newPrompt] = await db
      .insert(systemPrompt)
      .values({
        userId: input.userId,
        name: input.name,
        content: input.content,
        isDefault: input.isDefault ?? false,
      })
      .returning();

    return newPrompt;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create system prompt"
    );
  }
}

/**
 * Gets all system prompts for a user
 */
export async function getSystemPromptsByUserId(
  userId: string
): Promise<SystemPrompt[]> {
  try {
    return await db
      .select()
      .from(systemPrompt)
      .where(eq(systemPrompt.userId, userId))
      .orderBy(systemPrompt.createdAt);
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get system prompts"
    );
  }
}

/**
 * Gets the default system prompt for a user
 */
export async function getDefaultSystemPrompt(
  userId: string
): Promise<SystemPrompt | null> {
  try {
    const [prompt] = await db
      .select()
      .from(systemPrompt)
      .where(
        and(eq(systemPrompt.userId, userId), eq(systemPrompt.isDefault, true))
      )
      .limit(1);

    return prompt || null;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get default system prompt"
    );
  }
}

/**
 * Gets a system prompt by ID
 */
export async function getSystemPromptById(
  id: string,
  userId: string
): Promise<SystemPrompt | null> {
  try {
    const [prompt] = await db
      .select()
      .from(systemPrompt)
      .where(and(eq(systemPrompt.id, id), eq(systemPrompt.userId, userId)));

    return prompt || null;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get system prompt"
    );
  }
}

/**
 * Updates a system prompt
 */
export async function updateSystemPrompt(
  input: UpdateSystemPromptInput
): Promise<SystemPrompt> {
  try {
    // If setting as default, unset all other defaults first
    if (input.isDefault) {
      await db
        .update(systemPrompt)
        .set({ isDefault: false })
        .where(eq(systemPrompt.userId, input.userId));
    }

    const updateData: Partial<SystemPrompt> = {
      updatedAt: new Date(),
    };

    if (input.name) updateData.name = input.name;
    if (input.content) updateData.content = input.content;
    if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

    const [updated] = await db
      .update(systemPrompt)
      .set(updateData)
      .where(
        and(eq(systemPrompt.id, input.id), eq(systemPrompt.userId, input.userId))
      )
      .returning();

    return updated;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update system prompt"
    );
  }
}

/**
 * Deletes a system prompt
 */
export async function deleteSystemPrompt(
  id: string,
  userId: string
): Promise<void> {
  try {
    await db
      .delete(systemPrompt)
      .where(and(eq(systemPrompt.id, id), eq(systemPrompt.userId, userId)));
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete system prompt"
    );
  }
}

