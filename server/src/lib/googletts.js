const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

export async function synthesizeSpeech(text) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_TTS_API_KEY is not set on the server");
  }
  const voiceName = process.env.GOOGLE_TTS_VOICE || "en-GB-Neural2-B";
  const languageCode = process.env.GOOGLE_TTS_LANGUAGE_CODE || "en-GB";

  const response = await fetch(`${GOOGLE_TTS_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google TTS error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return Buffer.from(data.audioContent, "base64");
}
