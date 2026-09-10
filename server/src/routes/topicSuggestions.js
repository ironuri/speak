import { Router } from "express";
import { suggestNewsTopics } from "../lib/newsTopics.js";
import { getTopic } from "../lib/topics.js";

const router = Router();

router.get("/:categoryId", async (req, res) => {
  const { categoryId } = req.params;
  try {
    const items = await suggestNewsTopics(categoryId);
    res.json({ items, live: true });
  } catch (err) {
    console.error("[/api/topic-suggestions] live lookup failed, using fallback:", err.message);
    const curated = getTopic(categoryId);
    if (!curated) {
      return res.status(502).json({ error: err.message });
    }
    const items = curated.starters.slice(0, 3).map((starter, i) => ({
      id: `${categoryId}-fallback-${i}`,
      title: starter,
      summary: "Tema general (no se pudo buscar actualidad ahora mismo)",
      briefing: starter,
    }));
    res.json({ items, live: false });
  }
});

export default router;
