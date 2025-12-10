"use server";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Provider } from "@/lib/api-keys/types";
import { ChatSDKError } from "@/lib/errors";
import { usageLog, type UsageLog } from "../schema";

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export interface LogUsageInput {
  userId: string;
  chatId: string;
  provider: Provider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

/**
 * Logs a usage event
 */
export async function logUsage(input: LogUsageInput): Promise<UsageLog> {
  try {
    const [log] = await db
      .insert(usageLog)
      .values({
        userId: input.userId,
        chatId: input.chatId,
        provider: input.provider,
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        estimatedCost: String(input.estimatedCost),
      })
      .returning();

    return log;
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to log usage");
  }
}

/**
 * Gets usage logs for a user
 */
export async function getUsageLogsByUserId(
  userId: string,
  limit = 100
): Promise<UsageLog[]> {
  try {
    return await db
      .select()
      .from(usageLog)
      .where(eq(usageLog.userId, userId))
      .orderBy(desc(usageLog.createdAt))
      .limit(limit);
  } catch (error) {
    throw new ChatSDKError("bad_request:database", "Failed to get usage logs");
  }
}

/**
 * Gets usage summary for a user (last 30 days)
 */
export async function getUsageSummary(userId: string): Promise<{
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  byProvider: Record<string, { tokens: number; cost: number }>;
  byModel: Record<string, { tokens: number; cost: number }>;
}> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await db
      .select()
      .from(usageLog)
      .where(
        and(
          eq(usageLog.userId, userId),
          gte(usageLog.createdAt, thirtyDaysAgo)
        )
      );

    const summary = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      byProvider: {} as Record<string, { tokens: number; cost: number }>,
      byModel: {} as Record<string, { tokens: number; cost: number }>,
    };

    for (const log of logs) {
      const inputTokens = log.inputTokens ?? 0;
      const outputTokens = log.outputTokens ?? 0;
      const cost = Number.parseFloat(log.estimatedCost ?? "0");

      summary.totalInputTokens += inputTokens;
      summary.totalOutputTokens += outputTokens;
      summary.totalCost += cost;

      // By provider
      if (!summary.byProvider[log.provider]) {
        summary.byProvider[log.provider] = { tokens: 0, cost: 0 };
      }
      summary.byProvider[log.provider].tokens += inputTokens + outputTokens;
      summary.byProvider[log.provider].cost += cost;

      // By model
      if (!summary.byModel[log.model]) {
        summary.byModel[log.model] = { tokens: 0, cost: 0 };
      }
      summary.byModel[log.model].tokens += inputTokens + outputTokens;
      summary.byModel[log.model].cost += cost;
    }

    return summary;
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get usage summary"
    );
  }
}

/**
 * Gets daily usage for the last N days
 */
export async function getDailyUsage(
  userId: string,
  days = 30
): Promise<{ date: string; tokens: number; cost: number }[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db
      .select({
        date: sql<string>`DATE(${usageLog.createdAt})`,
        tokens: sql<number>`SUM(${usageLog.inputTokens} + ${usageLog.outputTokens})`,
        cost: sql<number>`SUM(CAST(${usageLog.estimatedCost} AS DECIMAL))`,
      })
      .from(usageLog)
      .where(
        and(eq(usageLog.userId, userId), gte(usageLog.createdAt, startDate))
      )
      .groupBy(sql`DATE(${usageLog.createdAt})`)
      .orderBy(sql`DATE(${usageLog.createdAt})`);

    return logs.map((l) => ({
      date: l.date,
      tokens: Number(l.tokens) || 0,
      cost: Number(l.cost) || 0,
    }));
  } catch (error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get daily usage"
    );
  }
}

