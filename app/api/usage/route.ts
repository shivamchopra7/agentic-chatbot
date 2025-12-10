import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getDailyUsage,
  getUsageLogsByUserId,
  getUsageSummary,
} from "@/lib/db/queries/usage";
import { ChatSDKError } from "@/lib/errors";

// GET /api/usage - Get usage analytics
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "summary";
    const days = Number.parseInt(searchParams.get("days") || "30", 10);
    const limit = Number.parseInt(searchParams.get("limit") || "100", 10);

    switch (type) {
      case "summary": {
        const summary = await getUsageSummary(session.user.id);
        return NextResponse.json(summary);
      }
      case "daily": {
        const daily = await getDailyUsage(session.user.id, days);
        return NextResponse.json({ daily });
      }
      case "logs": {
        const logs = await getUsageLogsByUserId(session.user.id, limit);
        return NextResponse.json({ logs });
      }
      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}

