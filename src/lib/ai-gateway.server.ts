import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createGoogleAiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "google",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    headers: {
      "x-goog-api-key": apiKey,
    },
  });
}
