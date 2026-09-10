const OPENAI_API_BASE = "https://api.openai.com/v1";

function requireApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set on the server");
  }
  return apiKey;
}

export async function transcribeAudio(buffer, mimeType) {
  const apiKey = requireApiKey();
  const model = process.env.OPENAI_STT_MODEL || "whisper-1";

  const extension = mimeType.includes("mp4") ? "mp4" : mimeType.includes("wav") ? "wav" : "webm";
  const form = new FormData();
  form.append("model", model);
  form.append("file", new Blob([buffer], { type: mimeType }), `audio.${extension}`);

  const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI transcription error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return (data.text || "").trim();
}
