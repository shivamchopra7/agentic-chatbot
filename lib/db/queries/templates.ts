"use server";

import { and, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "@/lib/errors";
import { promptTemplate, type PromptTemplate } from "../schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export type TemplateCategory = "coding" | "writing" | "marketing" | "analysis" | "general" | "custom";

export interface CreateTemplateInput {
  userId: string;
  name: string;
  description?: string;
  content: string;
  category: TemplateCategory;
}

export interface UpdateTemplateInput {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  content?: string;
  category?: TemplateCategory;
}

/**
 * Creates a new prompt template
 */
export async function createPromptTemplate(
  input: CreateTemplateInput
): Promise<PromptTemplate> {
  try {
    const [template] = await db
      .insert(promptTemplate)
      .values({
        userId: input.userId,
        name: input.name,
        description: input.description,
        content: input.content,
        category: input.category,
        isPublic: false,
      })
      .returning();

    return template;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create prompt template"
    );
  }
}

/**
 * Gets all templates for a user (including public templates)
 */
export async function getTemplatesByUserId(
  userId: string
): Promise<PromptTemplate[]> {
  try {
    return await db
      .select()
      .from(promptTemplate)
      .where(
        or(
          eq(promptTemplate.userId, userId),
          eq(promptTemplate.isPublic, true)
        )
      )
      .orderBy(promptTemplate.category, promptTemplate.name);
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get prompt templates"
    );
  }
}

/**
 * Gets templates by category
 */
export async function getTemplatesByCategory(
  userId: string,
  category: TemplateCategory
): Promise<PromptTemplate[]> {
  try {
    return await db
      .select()
      .from(promptTemplate)
      .where(
        and(
          eq(promptTemplate.category, category),
          or(
            eq(promptTemplate.userId, userId),
            eq(promptTemplate.isPublic, true)
          )
        )
      )
      .orderBy(promptTemplate.name);
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get templates by category"
    );
  }
}

/**
 * Gets a template by ID
 */
export async function getTemplateById(
  id: string,
  userId: string
): Promise<PromptTemplate | null> {
  try {
    const [template] = await db
      .select()
      .from(promptTemplate)
      .where(
        and(
          eq(promptTemplate.id, id),
          or(
            eq(promptTemplate.userId, userId),
            eq(promptTemplate.isPublic, true)
          )
        )
      );

    return template || null;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get prompt template"
    );
  }
}

/**
 * Updates a prompt template
 */
export async function updatePromptTemplate(
  input: UpdateTemplateInput
): Promise<PromptTemplate> {
  try {
    const updateData: Partial<PromptTemplate> = {
      updatedAt: new Date(),
    };

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.content) updateData.content = input.content;
    if (input.category) updateData.category = input.category;

    const [updated] = await db
      .update(promptTemplate)
      .set(updateData)
      .where(
        and(
          eq(promptTemplate.id, input.id),
          eq(promptTemplate.userId, input.userId)
        )
      )
      .returning();

    return updated;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update prompt template"
    );
  }
}

/**
 * Deletes a prompt template
 */
export async function deletePromptTemplate(
  id: string,
  userId: string
): Promise<void> {
  try {
    await db
      .delete(promptTemplate)
      .where(
        and(eq(promptTemplate.id, id), eq(promptTemplate.userId, userId))
      );
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete prompt template"
    );
  }
}

