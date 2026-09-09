import { buildSystemPrompt } from "./prompts.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export async function getReply({ history, level, topic, correctionsEnabled }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set on the server");
  }

  const model = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";
  const system = buildSystemPrompt({ level, topic, correctionsEnabled });

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system,
      max_tokens: 400,
      temperature: 0.8,
      messages: history,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("Anthropic API returned no text content");
  }
  return textBlock.text.trim();
}
