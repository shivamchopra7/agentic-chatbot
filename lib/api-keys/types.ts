export type Provider = "openai" | "google" | "anthropic" | "xai" | "custom";

export interface ProviderModel {
  id: string;
  name: string;
  provider: Provider;
  description?: string;
  inputPricePerMillion?: number;
  outputPricePerMillion?: number;
  contextWindow?: number;
  supportsImages?: boolean;
  supportsTools?: boolean;
}

export interface ApiKeyValidationResult {
  isValid: boolean;
  provider?: Provider;
  error?: string;
  models?: string[];
}

export interface UserApiKey {
  id: string;
  provider: Provider;
  label: string;
  isValid: boolean;
  lastValidatedAt: Date | null;
  createdAt: Date;
}

export interface DecryptedApiKey {
  id: string;
  provider: Provider;
  label: string;
  apiKey: string;
}

// Provider-specific model listings
export const PROVIDER_MODELS: Record<Provider, ProviderModel[]> = {
  openai: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      provider: "openai",
      description: "Most capable GPT-4 model for complex tasks",
      inputPricePerMillion: 2.5,
      outputPricePerMillion: 10,
      contextWindow: 128000,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      provider: "openai",
      description: "Fast and affordable for simple tasks",
      inputPricePerMillion: 0.15,
      outputPricePerMillion: 0.6,
      contextWindow: 128000,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "openai",
      description: "Previous generation high-capability model",
      inputPricePerMillion: 10,
      outputPricePerMillion: 30,
      contextWindow: 128000,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "o1-preview",
      name: "o1 Preview",
      provider: "openai",
      description: "Advanced reasoning model",
      inputPricePerMillion: 15,
      outputPricePerMillion: 60,
      contextWindow: 128000,
      supportsImages: false,
      supportsTools: false,
    },
  ],
  google: [
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      provider: "google",
      description: "Most capable Gemini model",
      inputPricePerMillion: 1.25,
      outputPricePerMillion: 5,
      contextWindow: 1000000,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "google",
      description: "Fast hybrid reasoning model",
      inputPricePerMillion: 0.3,
      outputPricePerMillion: 1.25,
      contextWindow: 1000000,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "google",
      description: "Balanced multimodal model",
      inputPricePerMillion: 0.1,
      outputPricePerMillion: 0.4,
      contextWindow: 1000000,
      supportsImages: true,
      supportsTools: true,
    },
  ],
  anthropic: [
    {
      id: "claude-sonnet-4-20250514",
      name: "Claude Sonnet 4",
      provider: "anthropic",
      description: "Latest Anthropic model, balanced performance",
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
      contextWindow: 200000,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "claude-opus-4-20250514",
      name: "Claude Opus 4",
      provider: "anthropic",
      description: "Most capable Claude model",
      inputPricePerMillion: 15,
      outputPricePerMillion: 75,
      contextWindow: 200000,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "claude-3-5-haiku-latest",
      name: "Claude 3.5 Haiku",
      provider: "anthropic",
      description: "Fast and affordable",
      inputPricePerMillion: 0.8,
      outputPricePerMillion: 4,
      contextWindow: 200000,
      supportsImages: true,
      supportsTools: true,
    },
  ],
  xai: [
    {
      id: "grok-3",
      name: "Grok 3",
      provider: "xai",
      description: "xAI's most capable model",
      inputPricePerMillion: 3,
      outputPricePerMillion: 15,
      contextWindow: 131072,
      supportsImages: true,
      supportsTools: true,
    },
    {
      id: "grok-3-mini",
      name: "Grok 3 Mini",
      provider: "xai",
      description: "Fast and efficient",
      inputPricePerMillion: 0.3,
      outputPricePerMillion: 0.5,
      contextWindow: 131072,
      supportsImages: false,
      supportsTools: true,
    },
  ],
  custom: [],
};

