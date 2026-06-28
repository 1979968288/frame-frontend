import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export async function* streamText(params: {
  system: string;
  user: string;
  apiKey: string;
  model?: string;
  maxTokens?: number;
}): AsyncGenerator<string, void, undefined> {
  const { system, user, apiKey, model, maxTokens = 4096 } = params;

  if (apiKey.startsWith("sk-ant-")) {
    // Anthropic provider
    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model: model || "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  } else {
    // OpenAI-compatible provider
    const baseURL =
      process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const client = new OpenAI({ apiKey, baseURL });
    const stream = await client.chat.completions.create({
      model: model || process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: true,
      max_tokens: maxTokens,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }
}
