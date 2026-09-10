import { Router, json } from "express";
import { getReply } from "../lib/anthropic.js";

const router = Router();

router.post("/", json({ limit: "1mb" }), async (req, res) => {
  try {
    const { history, level, topicId, topic, topicBriefing, correctionsEnabled } = req.body || {};
    if (!Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: "history must be a non-empty array" });
    }

    const reply = await getReply({ history, level, topicId, topic, topicBriefing, correctionsEnabled });
    res.json({ reply });
  } catch (err) {
    console.error("[/api/chat]", err);
    res.status(502).json({ error: err.message });
  }
});

export default router;
