import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { detectProvider, validateApiKey } from "@/lib/api-keys/validation";
import {
  createApiKey,
  deleteApiKey,
  getApiKeysByUserId,
  updateApiKey,
} from "@/lib/db/queries/api-keys";
import { ChatSDKError } from "@/lib/errors";

const createKeySchema = z.object({
  apiKey: z.string().min(10, "API key is too short"),
  label: z.string().min(1, "Label is required").max(128),
  provider: z
    .enum(["openai", "google", "anthropic", "xai", "custom"])
    .optional(),
});

const updateKeySchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(128).optional(),
  apiKey: z.string().min(10).optional(),
});

const deleteKeySchema = z.object({
  id: z.string().uuid(),
});

// GET /api/keys - List all user's API keys
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const keys = await getApiKeysByUserId(session.user.id);

    // Return keys without encrypted values
    const safeKeys = keys.map((key) => ({
      id: key.id,
      provider: key.provider,
      label: key.label,
      isValid: key.isValid,
      lastValidatedAt: key.lastValidatedAt,
      createdAt: key.createdAt,
    }));

    return NextResponse.json({ keys: safeKeys });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

// POST /api/keys - Create a new API key
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = createKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      apiKey: rawApiKey,
      label,
      provider: specifiedProvider,
    } = parsed.data;

    // Detect or use specified provider
    const provider = specifiedProvider || detectProvider(rawApiKey);
    if (!provider) {
      return NextResponse.json(
        { error: "Could not detect provider. Please specify the provider." },
        { status: 400 }
      );
    }

    // Validate the API key
    const validation = await validateApiKey(rawApiKey, provider);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Invalid API key: ${validation.error}` },
        { status: 400 }
      );
    }

    // Create the encrypted key
    const newKey = await createApiKey({
      userId: session.user.id,
      provider,
      label,
      rawApiKey,
    });

    return NextResponse.json({
      key: {
        id: newKey.id,
        provider: newKey.provider,
        label: newKey.label,
        isValid: newKey.isValid,
        createdAt: newKey.createdAt,
      },
      models: validation.models,
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}

// PATCH /api/keys - Update an API key
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = updateKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, label, apiKey: rawApiKey } = parsed.data;

    // If updating the key, validate it first
    if (rawApiKey) {
      const provider = detectProvider(rawApiKey);
      if (provider) {
        const validation = await validateApiKey(rawApiKey, provider);
        if (!validation.isValid) {
          return NextResponse.json(
            { error: `Invalid API key: ${validation.error}` },
            { status: 400 }
          );
        }
      }
    }

    const updated = await updateApiKey({
      id,
      userId: session.user.id,
      label,
      rawApiKey,
    });

    if (!updated) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    return NextResponse.json({
      key: {
        id: updated.id,
        provider: updated.provider,
        label: updated.label,
        isValid: updated.isValid,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    );
  }
}

// DELETE /api/keys - Delete an API key
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = deleteKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await deleteApiKey(parsed.data.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
