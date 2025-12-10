import { google } from "@ai-sdk/google";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const { artifactModel, chatModel, titleModel, reasoningModel } = require("./models.test");
      return customProvider({
        languageModels: {
          "gemini-2.5-pro": chatModel,
          "gemini-2.5-flash": chatModel,
          "gemini-2.5-flash-lite": chatModel,
          "gemini-2.0-flash": chatModel,
          "gemini-2.0-flash-lite": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        // Chat models - user selectable
        "gemini-2.5-pro": google("gemini-2.5-pro"),
        "gemini-2.5-flash": google("gemini-2.5-flash"),
        "gemini-2.5-flash-lite": google("gemini-2.5-flash-lite"),
        "gemini-2.0-flash": google("gemini-2.0-flash"),
        "gemini-2.0-flash-lite": google("gemini-2.0-flash-lite"),
        // Utility models - internal use
        "title-model": google("gemini-2.5-flash"),
        "artifact-model": google("gemini-2.5-pro"),
      },
    });
