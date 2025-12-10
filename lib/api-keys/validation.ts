import type { ApiKeyValidationResult, Provider } from "./types";

/**
 * Validates an API key by making a test request to the provider
 */
export async function validateApiKey(
  apiKey: string,
  provider?: Provider
): Promise<ApiKeyValidationResult> {
  // Auto-detect provider if not specified
  const detectedProvider = provider || detectProvider(apiKey);

  if (!detectedProvider) {
    return {
      isValid: false,
      error: "Could not detect provider. Please specify the provider.",
    };
  }

  try {
    switch (detectedProvider) {
      case "openai":
        return await validateOpenAIKey(apiKey);
      case "google":
        return await validateGoogleKey(apiKey);
      case "anthropic":
        return await validateAnthropicKey(apiKey);
      case "xai":
        return await validateXAIKey(apiKey);
      case "custom":
        return { isValid: true, provider: "custom" };
      default:
        return { isValid: false, error: "Unknown provider" };
    }
  } catch (error) {
    return {
      isValid: false,
      provider: detectedProvider,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/**
 * Detects the provider based on API key format
 */
export function detectProvider(apiKey: string): Provider | null {
  if (apiKey.startsWith("sk-") && apiKey.length > 40) {
    return "openai";
  }
  if (apiKey.startsWith("AIza")) {
    return "google";
  }
  if (apiKey.startsWith("sk-ant-")) {
    return "anthropic";
  }
  if (apiKey.startsWith("xai-")) {
    return "xai";
  }
  return null;
}

async function validateOpenAIKey(
  apiKey: string
): Promise<ApiKeyValidationResult> {
  const response = await fetch("https://api.openai.com/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    const models = data.data?.map((m: { id: string }) => m.id) || [];
    return { isValid: true, provider: "openai", models };
  }

  const error = await response.json().catch(() => ({}));
  return {
    isValid: false,
    provider: "openai",
    error: error.error?.message || `Invalid API key (${response.status})`,
  };
}

async function validateGoogleKey(
  apiKey: string
): Promise<ApiKeyValidationResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { method: "GET" }
  );

  if (response.ok) {
    const data = await response.json();
    const models =
      data.models?.map((m: { name: string }) => m.name.split("/").pop()) || [];
    return { isValid: true, provider: "google", models };
  }

  const error = await response.json().catch(() => ({}));
  return {
    isValid: false,
    provider: "google",
    error: error.error?.message || `Invalid API key (${response.status})`,
  };
}

async function validateAnthropicKey(
  apiKey: string
): Promise<ApiKeyValidationResult> {
  // Anthropic doesn't have a models endpoint, so we make a minimal completion request
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1,
      messages: [{ role: "user", content: "Hi" }],
    }),
  });

  // 200 or 400 (bad request but valid key) means the key is valid
  if (response.ok || response.status === 400) {
    return {
      isValid: true,
      provider: "anthropic",
      models: [
        "claude-sonnet-4-20250514",
        "claude-opus-4-20250514",
        "claude-3-5-haiku-latest",
      ],
    };
  }

  if (response.status === 401) {
    return { isValid: false, provider: "anthropic", error: "Invalid API key" };
  }

  return {
    isValid: true,
    provider: "anthropic",
    models: [
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
      "claude-3-5-haiku-latest",
    ],
  };
}

async function validateXAIKey(
  apiKey: string
): Promise<ApiKeyValidationResult> {
  const response = await fetch("https://api.x.ai/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    const models = data.data?.map((m: { id: string }) => m.id) || [];
    return { isValid: true, provider: "xai", models };
  }

  return {
    isValid: false,
    provider: "xai",
    error: `Invalid API key (${response.status})`,
  };
}

