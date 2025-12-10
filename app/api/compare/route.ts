import { NextResponse } from "next/server";
import { generateText } from "ai";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { myProvider } from "@/lib/ai/providers";
import { chatModels } from "@/lib/ai/models";
import { ChatSDKError } from "@/lib/errors";

const compareSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  modelId: z.enum([
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ] as const),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const parsed = compareSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, modelId } = parsed.data;

    // Validate model exists
    const model = chatModels.find((m) => m.id === modelId);
    if (!model) {
      return NextResponse.json(
        { error: "Invalid model" },
        { status: 400 }
      );
    }

    // Generate response
    const { text, usage } = await generateText({
      model: myProvider.languageModel(modelId),
      prompt: prompt,
    });

    return NextResponse.json({
      response: text,
      modelId,
      modelName: model.name,
      usage: usage || null,
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("Compare error:", error);

    return NextResponse.json(
      { error: "Failed to generate response", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

