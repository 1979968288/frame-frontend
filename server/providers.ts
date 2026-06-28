import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// ─── Provider Registry ────────────────────────────────────

export interface ProviderConfig {
  id: string;
  label: string;
  baseURL: string;
  defaultModel: string;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
  },
  qwen: {
    id: "qwen",
    label: "通义千问 (Alibaba)",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-plus",
  },
  zhipu: {
    id: "zhipu",
    label: "智谱 GLM (Zhipu)",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4",
  },
  moonshot: {
    id: "moonshot",
    label: "Moonshot 月之暗面",
    baseURL: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-8k",
  },
  siliconflow: {
    id: "siliconflow",
    label: "硅基流动 (SiliconFlow)",
    baseURL: "https://api.siliconflow.cn/v1",
    defaultModel: "deepseek-ai/DeepSeek-V3",
  },
  baichuan: {
    id: "baichuan",
    label: "百川 (Baichuan)",
    baseURL: "https://api.baichuan-ai.com/v1",
    defaultModel: "Baichuan4",
  },
  minimax: {
    id: "minimax",
    label: "MiniMax",
    baseURL: "https://api.minimax.chat/v1",
    defaultModel: "abab6.5s-chat",
  },
  yi: {
    id: "yi",
    label: "零一万物 (01.AI)",
    baseURL: "https://api.lingyiwanwu.com/v1",
    defaultModel: "yi-large",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic Claude",
    baseURL: "",
    defaultModel: "claude-sonnet-4-20250514",
  },
  groq: {
    id: "groq",
    label: "Groq",
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-70b-versatile",
  },
  together: {
    id: "together",
    label: "Together AI",
    baseURL: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3-70b-chat-hf",
  },
  mistral: {
    id: "mistral",
    label: "Mistral AI",
    baseURL: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
  },
  xai: {
    id: "xai",
    label: "xAI Grok",
    baseURL: "https://api.x.ai/v1",
    defaultModel: "grok-2",
  },
  custom: {
    id: "custom",
    label: "自定义 (Custom)",
    baseURL: "",
    defaultModel: "",
  },
};

export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDERS[id];
}

// ─── Streaming ────────────────────────────────────────────

export async function* streamText(params: {
  system: string;
  user: string;
  apiKey: string;
  provider?: string;
  model?: string;
  maxTokens?: number;
}): AsyncGenerator<string, void, undefined> {
  const { system, user, apiKey, provider, model, maxTokens = 4096 } = params;

  // Anthropic: native SDK (auto-detected by key prefix or explicit provider)
  const isAnthropic =
    provider === "anthropic" || (!provider && apiKey.startsWith("sk-ant-"));

  if (isAnthropic) {
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
    return;
  }

  // OpenAI-compatible: resolve provider config for baseURL and default model
  const cfg = provider ? getProvider(provider) : undefined;
  const baseURL =
    cfg?.baseURL ||
    process.env.OPENAI_BASE_URL ||
    "https://api.openai.com/v1";
  const resolvedModel =
    model ||
    cfg?.defaultModel ||
    process.env.OPENAI_MODEL ||
    "gpt-4o";

  const client = new OpenAI({ apiKey, baseURL });
  const stream = await client.chat.completions.create({
    model: resolvedModel,
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
