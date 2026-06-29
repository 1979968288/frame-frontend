import { useState } from "react";
import { TextArea, Button } from "./FormControls";
import { streamGenerate } from "../../lib/api";

interface Episode {
  id: string;
  number: number;
  title: string;
  summary: string;
  duration: number;
}

interface Act {
  key: string;
  name: string;
}

const ACTS: Act[] = [
  { key: "qi", name: "起" },
  { key: "cheng", name: "承" },
  { key: "zhuan", name: "转" },
  { key: "he", name: "合" },
];

const INITIAL_EPISODES: Episode[] = [];

interface Props {
  onComplete: () => void;
  data?: Record<string, unknown>;
  updateData?: (patch: Record<string, unknown>) => void;
}

export default function OutlineStep({ onComplete, data, updateData }: Props) {
  const savedEpisodes = (data?.outlineEpisodes as Episode[]) || [];
  const [rough, setRough] = useState((data?.roughOutline as string) || "");
  const [roughOpen, setRoughOpen] = useState(true);
  const [episodes, setEpisodes] = useState<Episode[]>(savedEpisodes.length > 0 ? savedEpisodes : INITIAL_EPISODES);
  const [activeAct, setActiveAct] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [parseError, setParseError] = useState("");

  const synopsis = (data?.synopsis as string) || "";
  const characters = (data?.characters as { name: string; position: string; personality: string; background: string }[]) || [];

  const handleSave = () => {
    updateData?.({ roughOutline: rough, outlineEpisodes: episodes });
    onComplete();
  };

  const updateEpisode = (id: string, patch: Partial<Episode>) => {
    setEpisodes((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const addEpisode = () => {
    const nextNumber = (episodes[episodes.length - 1]?.number ?? 0) + 1;
    setEpisodes((prev) => [
      ...prev,
      {
        id: `e${Date.now()}`,
        number: nextNumber,
        title: "",
        summary: "",
        duration: 15,
      },
    ]);
  };

  const removeEpisode = (id: string) => {
    setEpisodes((prev) => {
      const next = prev.filter((e) => e.id !== id);
      return next.map((e, i) => ({ ...e, number: i + 1 }));
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("original", "outline", {
        roughOutline: rough,
        existingEpisodes: episodes,
        synopsis,
        characters: characters.map((c) => ({ name: c.name, position: c.position, personality: c.personality })),
        episodeDuration: episodes[0]?.duration ?? 15,
      })) {
        fullText += chunk;
      }
      const parsed = parseEpisodes(fullText);
      if (parsed.length > 0) {
        setEpisodes(parsed);
        setParseError("");
      } else {
        setParseError("AI 返回内容无法解析为分集大纲，请重新生成或检查粗纲描述。AI 原始输出已保留在集纲列表中。");
      }
    } catch (err) {
      console.error("Generate failed:", err);
      setParseError("生成失败，请检查网络连接后重试。");
    } finally {
      setGenerating(false);
    }
  };

  const acts = distributeEpisodes(episodes, ACTS);

  return (
    <div className="flex justify-center" style={{ gap: "80px", alignItems: "flex-start" }}>
      {/* Left: rough outline + episode list */}
      <div style={{ flex: "1 1 0", minWidth: 0, maxWidth: "760px" }}>
        <h2
          className="m-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "22px",
            fontWeight: 500,
            color: "var(--color-ink)",
            letterSpacing: "-0.01em",
            marginBottom: "24px",
          }}
        >
          分集大纲
        </h2>

        {/* Rough outline */}
        <div style={{ marginBottom: "32px" }}>
          <div
            className="flex items-center"
            style={{ marginBottom: "8px", gap: "6px" }}
          >
            <label
              className="m-0"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--color-ink)",
              }}
            >
              粗纲
            </label>
            <span style={{ color: "var(--color-accent)", fontSize: "12px" }}>*</span>
            <button
              type="button"
              onClick={() => setRoughOpen(!roughOpen)}
              aria-label="折叠粗纲"
              className="ml-auto cursor-pointer bg-transparent border-none flex items-center justify-center"
              style={{
                width: "20px",
                height: "20px",
                color: "var(--color-mid)",
                transform: roughOpen ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 200ms var(--ease-out)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {roughOpen && (
            <TextArea
              value={rough}
              onChange={setRough}
              placeholder="用 1-3 段描述整体故事弧光：开端、中段转折、高潮、结局…"
              height={140}
            />
          )}
        </div>

        {/* Episode list */}
        <div>
          <div
            className="flex items-baseline"
            style={{ marginBottom: "16px" }}
          >
            <label
              className="m-0"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--color-ink)",
              }}
            >
              集纲
            </label>
            <span style={{ color: "var(--color-accent)", fontSize: "12px" }}>*</span>
            <span
              style={{
                marginLeft: "8px",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--color-mid)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              共 {episodes.length} 集
            </span>
            <button
              type="button"
              onClick={addEpisode}
              className="ml-auto flex items-center cursor-pointer bg-transparent border-none"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--color-accent-deep)",
                letterSpacing: "0.04em",
                gap: "4px",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              新增集
            </button>
          </div>

          <div className="flex flex-col" style={{ gap: "8px" }}>
            {episodes.length === 0 && (
              <div
                className="flex items-center justify-center"
                style={{
                  padding: "40px 24px",
                  background: "var(--color-paper)",
                  border: "1px dashed var(--color-mist)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--color-mid)",
                }}
              >
                还没有任何集 — 点击右上「新增集」开始拆解剧情
              </div>
            )}
            {episodes.map((ep) => {
              const actIndex = Math.min(
                ACTS.length - 1,
                Math.floor((ep.number - 1) / Math.max(1, Math.ceil(episodes.length / ACTS.length)))
              );
              const act = ACTS[actIndex];
              const dimmed = activeAct !== null && activeAct !== act.key;
              return (
                <div
                  key={ep.id}
                  style={{
                    padding: "14px 16px",
                    background: "var(--color-paper)",
                    border: "1px solid var(--color-mist)",
                    borderRadius: "var(--radius-md)",
                    opacity: dimmed ? 0.4 : 1,
                    transition: "opacity 200ms var(--ease-out)",
                  }}
                >
                  <div className="flex items-center" style={{ gap: "12px", marginBottom: "8px" }}>
                    <span
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-warm-cream)",
                        border: "1px solid var(--color-mist)",
                        color: "var(--color-ink)",
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        fontWeight: 500,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {String(ep.number).padStart(2, "0")}
                    </span>
                    <input
                      type="text"
                      value={ep.title}
                      onChange={(e) => updateEpisode(ep.id, { title: e.target.value })}
                      placeholder={`第${ep.number}集标题`}
                      className="flex-1 bg-transparent border-none outline-none"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--color-ink)",
                        padding: 0,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeEpisode(ep.id)}
                      aria-label="删除此集"
                      className="cursor-pointer bg-transparent border-none flex items-center justify-center shrink-0"
                      style={{
                        width: "20px",
                        height: "20px",
                        color: "var(--color-mid)",
                        transition: "color 150ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-accent-deep)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-mid)"; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center" style={{ gap: "8px", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--color-mid)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      单集时长
                    </span>
                    <input
                      type="number"
                      value={ep.duration}
                      onChange={(e) => updateEpisode(ep.id, { duration: Math.max(1, Number(e.target.value)) })}
                      min={1}
                      max={120}
                      className="bg-transparent outline-none"
                      style={{
                        width: "48px",
                        height: "24px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-mist)",
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--color-ink)",
                        textAlign: "center",
                        padding: "0 4px",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--color-mist)",
                      }}
                    >
                      分钟
                    </span>
                  </div>
                  <textarea
                    value={ep.summary}
                    onChange={(e) => updateEpisode(ep.id, { summary: e.target.value })}
                    placeholder="本集剧情梗概…"
                    className="w-full bg-transparent border-none outline-none resize-none"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "var(--color-charcoal)",
                      lineHeight: 1.6,
                      padding: 0,
                      height: "auto",
                      minHeight: "20px",
                    }}
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="flex items-center"
          style={{
            marginTop: "32px",
            paddingTop: "20px",
            borderTop: "1px solid var(--color-mist)",
            gap: "12px",
          }}
        >
          <Button onClick={handleSave}>保存并继续</Button>
          <Button variant="secondary" disabled={generating} onClick={handleGenerate}>
            {generating ? "生成中…" : "AI 生成集纲"}
          </Button>
          {parseError && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--color-accent-deep)",
                flex: 1,
              }}
            >
              {parseError}
            </span>
          )}
          <span
            className="ml-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
            }}
          >
            下一步：剧本正文 →
          </span>
        </div>
      </div>

      {/* Right: 4-act structure */}
      <aside
        className="shrink-0 hidden lg:block"
        style={{ width: "220px", position: "sticky", top: "0" }}
      >
        <div className="flex flex-col" style={{ gap: "12px" }}>
          {acts.map((act) => {
            const isActive = activeAct === act.key;
            const episodeCount = act.episodes.length;
            return (
              <button
                key={act.key}
                type="button"
                onClick={() => setActiveAct(isActive ? null : act.key)}
                className="text-left cursor-pointer border"
                style={{
                  height: "120px",
                  padding: "20px 22px",
                  borderRadius: "var(--radius-md)",
                  background: isActive
                    ? "var(--color-accent-whisper)"
                    : "var(--color-paper)",
                  borderColor: isActive
                    ? "var(--color-accent)"
                    : "var(--color-mist)",
                  transition: "all 180ms var(--ease-out)",
                  fontFamily: "var(--font-body)",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--color-accent-veil)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--color-mist)";
                  }
                }}
              >
                <div className="flex items-baseline" style={{ gap: "14px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: "44px",
                      fontWeight: 400,
                      color: isActive ? "var(--color-accent)" : "var(--color-ink)",
                      lineHeight: 1,
                      transition: "color 180ms",
                    }}
                  >
                    {act.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-mid)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {episodeCount === 0
                      ? "—"
                      : act.episodes.length === 1
                      ? `第${act.episodes[0].number}集`
                      : `第${act.episodes[0].number}-${act.episodes[act.episodes.length - 1].number}集`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function parseEpisodes(text: string): Episode[] {
  const lines = text.split("\n");
  const episodes: Episode[] = [];
  let current: Partial<Episode> | null = null;

  for (const line of lines) {
    const match = line.match(/^(?:第\s*)?(\d+)\s*[集话章回][：:]\s*(.*)/);
    if (match) {
      if (current && current.title) {
        episodes.push({
          id: `e${Date.now()}_${episodes.length}`,
          number: episodes.length + 1,
          title: current.title,
          summary: current.summary || "",
          duration: 15,
        });
      }
      current = { title: match[2].trim(), summary: "" };
    } else if (current && line.trim()) {
      current.summary = (current.summary || "") + line.trim() + "\n";
    }
  }
  if (current && current.title) {
    episodes.push({
      id: `e${Date.now()}_${episodes.length}`,
      number: episodes.length + 1,
      title: current.title,
      summary: (current.summary || "").trim(),
      duration: 15,
    });
  }
  return episodes;
}

function distributeEpisodes(episodes: Episode[], acts: Act[]) {
  const n = episodes.length;
  if (n === 0) return acts.map((a) => ({ ...a, episodes: [] as Episode[] }));

  const perAct = Math.ceil(n / acts.length);
  return acts.map((act, i) => {
    const start = i * perAct;
    const end = Math.min(start + perAct, n);
    return { ...act, episodes: episodes.slice(start, end) };
  });
}
