export const DEFAULT_CHAT_MODEL: string = "gemini-2.5-pro";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro ($1.25/1M tokens)",
    description:
      "Most capable model - excels at coding, complex reasoning, and long context tasks",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash ($0.30/1M tokens)",
    description:
      "Fast hybrid reasoning model with thinking budgets and 1M token context",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite ($0.10/1M tokens)",
    description:
      "Most cost-effective 2.5 model - optimized for high-volume, at-scale usage",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash ($0.10/1M tokens)",
    description:
      "Balanced multimodal model with great performance, 1M context, built for agents",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash-Lite ($0.075/1M tokens)",
    description:
      "Smallest and cheapest model - ideal for simple tasks and maximum cost savings",
  },
  {
    id: "chat-model",
    name: "Chat Model (Test)",
    description: "Standard mock model for testing",
  },
  {
    id: "chat-model-reasoning",
    name: "Chat Model (Reasoning)",
    description: "Mock model with reasoning capabilities for testing",
  },
];
