"use server";

import { and, eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  knowledgeBase,
  knowledgeDocument,
  type KnowledgeBase,
  type KnowledgeDocument,
} from "../schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Knowledge Base CRUD
export async function createKnowledgeBase(
  data: Pick<KnowledgeBase, "userId" | "name" | "description" | "workspaceId">
): Promise<KnowledgeBase> {
  const [kb] = await db
    .insert(knowledgeBase)
    .values({
      userId: data.userId,
      name: data.name,
      description: data.description,
      workspaceId: data.workspaceId,
    })
    .returning();
  return kb;
}

export async function getKnowledgeBasesForUser(
  userId: string
): Promise<KnowledgeBase[]> {
  return db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.userId, userId))
    .orderBy(desc(knowledgeBase.createdAt));
}

export async function getKnowledgeBaseById(
  id: string,
  userId: string
): Promise<KnowledgeBase | null> {
  const [kb] = await db
    .select()
    .from(knowledgeBase)
    .where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.userId, userId)))
    .limit(1);
  return kb ?? null;
}

export async function deleteKnowledgeBase(
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(knowledgeBase)
    .where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.userId, userId)))
    .returning();
  return result.length > 0;
}

// Document CRUD
export async function addDocument(
  data: Pick<KnowledgeDocument, "knowledgeBaseId" | "title" | "content">
): Promise<KnowledgeDocument> {
  const [doc] = await db
    .insert(knowledgeDocument)
    .values({
      knowledgeBaseId: data.knowledgeBaseId,
      title: data.title,
      content: data.content,
    })
    .returning();
  return doc;
}

export async function getDocumentsForKnowledgeBase(
  knowledgeBaseId: string
): Promise<KnowledgeDocument[]> {
  return db
    .select()
    .from(knowledgeDocument)
    .where(eq(knowledgeDocument.knowledgeBaseId, knowledgeBaseId))
    .orderBy(desc(knowledgeDocument.createdAt));
}

export async function getDocumentById(
  id: string
): Promise<KnowledgeDocument | null> {
  const [doc] = await db
    .select()
    .from(knowledgeDocument)
    .where(eq(knowledgeDocument.id, id))
    .limit(1);
  return doc ?? null;
}

export async function deleteDocument(id: string): Promise<boolean> {
  const result = await db
    .delete(knowledgeDocument)
    .where(eq(knowledgeDocument.id, id))
    .returning();
  return result.length > 0;
}

/**
 * Simple text search in knowledge base documents
 * For production, use vector embeddings with pgvector
 */
export async function searchDocuments(
  knowledgeBaseId: string,
  _query: string
): Promise<KnowledgeDocument[]> {
  // For now, return all documents - in production use vector similarity
  return getDocumentsForKnowledgeBase(knowledgeBaseId);
}

