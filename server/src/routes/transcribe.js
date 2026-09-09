import { Router, raw } from "express";
import { transcribeAudio } from "../lib/openai.js";

const router = Router();

router.post("/", raw({ type: "audio/*", limit: "20mb" }), async (req, res) => {
  try {
    const mimeType = (req.headers["content-type"] || "audio/webm").split(";")[0].trim();
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: "No audio received" });
    }
    const text = await transcribeAudio(req.body, mimeType);
    res.json({ text });
  } catch (err) {
    console.error("[/api/transcribe]", err);
    res.status(502).json({ error: err.message });
  }
});

export default router;
