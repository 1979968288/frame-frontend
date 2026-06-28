type Module = "original" | "rewrite" | "adapt" | "evaluate";
type Action =
  | "outline"
  | "script"
  | "polish"
  | "synopsis"
  | "generate_character"
  | "optimize"
  | "analyze_for_rewrite"
  | "adapt_chapter"
  | "breakdown_chapters"
  | "analyze"
  | "recommend_dimensions"
  | "extract_characters"
  | "detect_scenes"
  | "detect_chapters";

const API_KEY_STORAGE = "frame_api_key";
const PROVIDER_STORAGE = "frame_provider";
const MODEL_STORAGE = "frame_model";

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || "";
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function getProvider(): string {
  return localStorage.getItem(PROVIDER_STORAGE) || "";
}

export function setProvider(provider: string): void {
  localStorage.setItem(PROVIDER_STORAGE, provider);
}

export function getModel(): string {
  return localStorage.getItem(MODEL_STORAGE) || "";
}

export function setModel(model: string): void {
  if (model) {
    localStorage.setItem(MODEL_STORAGE, model);
  } else {
    localStorage.removeItem(MODEL_STORAGE);
  }
}

export async function* streamGenerate(
  module: Module,
  action: Action,
  context: Record<string, unknown>,
): AsyncGenerator<string, void, undefined> {
  const apiKey = getApiKey();
  const provider = getProvider();
  const model = getModel();
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module, action, context, apiKey, provider, model }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const { text, error } = JSON.parse(data);
          if (error) throw new Error(error);
          if (text) yield text;
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }
}
