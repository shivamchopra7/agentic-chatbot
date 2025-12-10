import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { createXai } from "@ai-sdk/xai";
import type { Provider } from "@/lib/api-keys/types";

/**
 * Creates a language model instance using the user's API key
 */
export function createDynamicModel(
  provider: Provider,
  modelId: string,
  apiKey: string
): LanguageModel {
  switch (provider) {
    case "openai":
      return createOpenAIModel(modelId, apiKey);
    case "google":
      return createGoogleModel(modelId, apiKey);
    case "anthropic":
      return createAnthropicModel(modelId, apiKey);
    case "xai":
      return createXAIModel(modelId, apiKey);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

function createOpenAIModel(modelId: string, apiKey: string): LanguageModel {
  const openai = createOpenAI({ apiKey });
  return openai(modelId);
}

function createGoogleModel(modelId: string, apiKey: string): LanguageModel {
  const google = createGoogleGenerativeAI({ apiKey });
  return google(modelId);
}

function createAnthropicModel(
  modelId: string,
  apiKey: string
): LanguageModel {
  const anthropic = createAnthropic({ apiKey });
  return anthropic(modelId);
}

function createXAIModel(modelId: string, apiKey: string): LanguageModel {
  const xai = createXai({ apiKey });
  return xai(modelId);
}

/**
 * Determines the provider from a model ID
 */
export function getProviderFromModelId(modelId: string): Provider | null {
  if (modelId.startsWith("gpt-") || modelId.startsWith("o1")) {
    return "openai";
  }
  if (modelId.startsWith("gemini-")) {
    return "google";
  }
  if (modelId.startsWith("claude-")) {
    return "anthropic";
  }
  if (modelId.startsWith("grok-")) {
    return "xai";
  }
  return null;
}

/**
 * Available models per provider
 */
export const AVAILABLE_MODELS: Record<Provider, { id: string; name: string }[]> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    { id: "o1-preview", name: "o1 Preview" },
    { id: "o1-mini", name: "o1 Mini" },
  ],
  google: [
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
    { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
    { id: "claude-3-5-haiku-latest", name: "Claude 3.5 Haiku" },
  ],
  xai: [
    { id: "grok-3", name: "Grok 3" },
    { id: "grok-3-mini", name: "Grok 3 Mini" },
  ],
  custom: [],
};

