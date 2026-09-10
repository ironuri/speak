import { Router, json } from "express";
import { synthesizeSpeech } from "../lib/googletts.js";

const router = Router();

router.post("/", json({ limit: "200kb" }), async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }

    const audioBuffer = await synthesizeSpeech(text.trim());
    res.set("content-type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (err) {
    console.error("[/api/speak]", err);
    res.status(502).json({ error: err.message });
  }
});

export default router;
