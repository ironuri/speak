import "dotenv/config";
import express from "express";
import cors from "cors";

import transcribeRouter from "./routes/transcribe.js";
import chatRouter from "./routes/chat.js";
import speakRouter from "./routes/speak.js";

const app = express();
app.use(cors());

const sharedSecret = process.env.APP_SHARED_SECRET;
if (!sharedSecret) {
  console.warn(
    "[speak-server] WARNING: APP_SHARED_SECRET is not set. Anyone who finds this server's URL " +
      "can use your Anthropic/OpenAI credits. Set APP_SHARED_SECRET before deploying publicly."
  );
}

app.use((req, res, next) => {
  if (req.path === "/api/health") return next();
  if (!sharedSecret) return next();
  if (req.header("x-app-secret") === sharedSecret) return next();
  return res.status(401).json({ error: "Missing or invalid X-App-Secret header" });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/transcribe", transcribeRouter);
app.use("/api/chat", chatRouter);
app.use("/api/speak", speakRouter);

app.use((err, req, res, next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`speak-server listening on port ${port}`);
});
