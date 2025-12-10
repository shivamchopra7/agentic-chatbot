import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { AVAILABLE_MODELS } from "@/lib/ai/dynamic-provider";
import { getApiKeysByUserId } from "@/lib/db/queries/api-keys";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Get user's API keys
    const apiKeys = await getApiKeysByUserId(session.user.id);

    // Get unique providers with valid keys
    const validProviders = new Set(
      apiKeys.filter((k) => k.isValid).map((k) => k.provider)
    );

    // Build available models list based on user's providers
    const models: {
      id: string;
      name: string;
      provider: string;
      providerLabel: string;
    }[] = [];

    const providerLabels: Record<string, string> = {
      openai: "OpenAI",
      google: "Google",
      anthropic: "Anthropic",
      xai: "xAI",
    };

    for (const provider of validProviders) {
      const providerModels = AVAILABLE_MODELS[provider] || [];
      for (const model of providerModels) {
        models.push({
          id: model.id,
          name: model.name,
          provider,
          providerLabel: providerLabels[provider] || provider,
        });
      }
    }

    return NextResponse.json({
      models,
      hasKeys: apiKeys.length > 0,
      providers: Array.from(validProviders),
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

