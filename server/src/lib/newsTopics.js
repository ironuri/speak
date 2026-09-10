const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const CATEGORY_QUERY_HINTS = {
  sports: "sport",
  politics: "politics and world affairs",
  finance: "money, business, and the economy",
  culture: "culture, entertainment, and the arts",
  technology: "technology",
  environment: "the environment and climate",
  travel: "travel",
  work: "work and careers",
};

export async function suggestNewsTopics(categoryId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set on the server");
  }
  const hint = CATEGORY_QUERY_HINTS[categoryId];
  if (!hint) {
    throw new Error(`Unknown category: ${categoryId}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
      messages: [
        {
          role: "user",
          content:
            `Today is ${today}. Search for 3 current, genuinely debatable news stories or ` +
            `developments related to ${hint} that a Spanish person following the news would ` +
            `recognize. Prefer stories with real controversy or differing public opinion, not ` +
            `plain uncontroversial facts.\n\n` +
            "Then respond with ONLY a JSON array (no markdown fences, no extra text before or " +
            "after), where each item has exactly these fields:\n" +
            '- "title": a short punchy title in Spanish, max 8 words\n' +
            '- "summary": one sentence in Spanish describing what\'s happening\n' +
            '- "briefing": 3-4 sentences IN ENGLISH summarizing the key facts, context, and the ' +
            "main opposing viewpoints on this story — written so an English conversation partner " +
            "could use it to discuss the topic knowledgeably and take a genuine, specific side.",
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textBlock = [...(data.content || [])].reverse().find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("No text content returned for topic suggestions");
  }

  const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not find a JSON array in the topic suggestions response");
  }

  const items = JSON.parse(jsonMatch[0]);
  return items.map((item, i) => ({
    id: `${categoryId}-${i}`,
    title: item.title,
    summary: item.summary,
    briefing: item.briefing,
  }));
}
