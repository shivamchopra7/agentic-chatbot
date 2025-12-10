"use server";

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Provider } from "@/lib/api-keys/types";
import { decrypt, encrypt, hashApiKey } from "@/lib/crypto";
import { ChatSDKError } from "@/lib/errors";
import { apiKey, type ApiKey } from "../schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export interface CreateApiKeyInput {
  userId: string;
  provider: Provider;
  label: string;
  rawApiKey: string;
}

export interface UpdateApiKeyInput {
  id: string;
  userId: string;
  label?: string;
  rawApiKey?: string;
  isValid?: boolean;
}

/**
 * Creates a new API key with encryption
 */
export async function createApiKey(
  input: CreateApiKeyInput
): Promise<ApiKey> {
  try {
    const encryptedKey = encrypt(input.rawApiKey);
    const keyHash = hashApiKey(input.rawApiKey);

    const [newKey] = await db
      .insert(apiKey)
      .values({
        userId: input.userId,
        provider: input.provider,
        label: input.label,
        encryptedKey,
        keyHash,
        isValid: true,
        lastValidatedAt: new Date(),
      })
      .returning();

    return newKey;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to create API key");
  }
}

/**
 * Gets all API keys for a user (without decrypted values)
 */
export async function getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
  try {
    return await db
      .select()
      .from(apiKey)
      .where(eq(apiKey.userId, userId))
      .orderBy(apiKey.createdAt);
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get API keys");
  }
}

/**
 * Gets a decrypted API key by ID (for making API calls)
 */
export async function getDecryptedApiKey(
  keyId: string,
  userId: string
): Promise<{ provider: Provider; apiKey: string } | null> {
  try {
    const [key] = await db
      .select()
      .from(apiKey)
      .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, userId)));

    if (!key) return null;

    const decryptedKey = decrypt(key.encryptedKey);
    return { provider: key.provider, apiKey: decryptedKey };
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get decrypted API key"
    );
  }
}

/**
 * Gets a decrypted API key by provider (for making API calls)
 */
export async function getDecryptedApiKeyByProvider(
  userId: string,
  provider: Provider
): Promise<string | null> {
  try {
    const [key] = await db
      .select()
      .from(apiKey)
      .where(
        and(
          eq(apiKey.userId, userId),
          eq(apiKey.provider, provider),
          eq(apiKey.isValid, true)
        )
      )
      .limit(1);

    if (!key) return null;

    return decrypt(key.encryptedKey);
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get API key by provider"
    );
  }
}

/**
 * Updates an API key
 */
export async function updateApiKey(input: UpdateApiKeyInput): Promise<ApiKey> {
  try {
    const updateData: Partial<ApiKey> = {
      updatedAt: new Date(),
    };

    if (input.label) updateData.label = input.label;
    if (input.isValid !== undefined) updateData.isValid = input.isValid;
    if (input.rawApiKey) {
      updateData.encryptedKey = encrypt(input.rawApiKey);
      updateData.keyHash = hashApiKey(input.rawApiKey);
      updateData.lastValidatedAt = new Date();
    }

    const [updated] = await db
      .update(apiKey)
      .set(updateData)
      .where(and(eq(apiKey.id, input.id), eq(apiKey.userId, input.userId)))
      .returning();

    return updated;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to update API key");
  }
}

/**
 * Deletes an API key
 */
export async function deleteApiKey(
  keyId: string,
  userId: string
): Promise<void> {
  try {
    await db
      .delete(apiKey)
      .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, userId)));
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to delete API key");
  }
}

