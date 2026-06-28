import express from "express";
import cors from "cors";
import "dotenv/config";
import { streamText } from "./providers";
import { buildPrompts } from "./prompts";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/api/generate", async (req, res) => {
  const { module, action, context, apiKey } = req.body;

  if (!module || !action || !context || !apiKey) {
    res.status(400).json({
      error: "Missing required fields: module, action, context, apiKey",
    });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const { system, user } = buildPrompts(module, action, context);

    for await (const chunk of streamText({ system, user, apiKey })) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("AI stream error:", message);
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Frame AI server running on http://localhost:${PORT}`);
});
