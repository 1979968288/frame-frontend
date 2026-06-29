import { useState, useRef, useEffect, useMemo } from "react";
import type { ModuleKey } from "./Workbench";

interface SearchItem {
  module: ModuleKey;
  stepLabel: string;
  itemId: string;
  title: string;
  subtitle: string;
  content: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  workbenchData: Record<string, unknown>;
  onNavigate: (module: ModuleKey, stepIndex: number, itemId: string) => void;
}

const MODULE_STEP: Record<string, { module: ModuleKey; stepIndex: number; label: string }> = {
  synopsis: { module: "original", stepIndex: 0, label: "故事梗概" },
  characters: { module: "original", stepIndex: 1, label: "人物小传" },
  outlineEpisodes: { module: "original", stepIndex: 2, label: "分集大纲" },
  scriptEpisodes: { module: "original", stepIndex: 3, label: "剧本正文" },
  importedScript: { module: "rewrite", stepIndex: 0, label: "剧本导入" },
  rewriteDimensions: { module: "rewrite", stepIndex: 1, label: "改写方向" },
  optimizedScenes: { module: "rewrite", stepIndex: 2, label: "深度优化" },
  importedNovel: { module: "adapt", stepIndex: 0, label: "网文导入" },
  novelCharacters: { module: "adapt", stepIndex: 1, label: "人物梳理" },
  adaptedChapters: { module: "adapt", stepIndex: 2, label: "章节拆解" },
  generatedChapters: { module: "adapt", stepIndex: 3, label: "剧本生成" },
  evalScript: { module: "evaluate", stepIndex: 0, label: "剧本上传" },
  evalDimensions: { module: "evaluate", stepIndex: 1, label: "维度选择" },
  evalScores: { module: "evaluate", stepIndex: 2, label: "AI 分析" },
};

function buildIndex(data: Record<string, unknown>): SearchItem[] {
  const items: SearchItem[] = [];

  // Synopsis
  const synopsis = data.synopsis as string | undefined;
  if (synopsis) {
    items.push({
      module: "original", stepLabel: "故事梗概", itemId: "synopsis",
      title: "故事梗概", subtitle: "原创 · 步骤1", content: synopsis,
    });
  }

  // Characters (original)
  const chars = data.characters as { id: string; name: string; position: string; personality: string; background: string }[] | undefined;
  if (chars) {
    for (const c of chars) {
      items.push({
        module: "original", stepLabel: "人物小传", itemId: c.id,
        title: c.name || "未命名",
        subtitle: `原创 · 人物 · ${c.position || "待定"}`,
        content: [c.personality, c.background].filter(Boolean).join("\n"),
      });
    }
  }

  // Outline episodes
  const outlineEps = data.outlineEpisodes as { id: string; number: number; title: string; summary: string }[] | undefined;
  if (outlineEps) {
    for (const ep of outlineEps) {
      items.push({
        module: "original", stepLabel: "分集大纲", itemId: ep.id,
        title: `第${ep.number}集${ep.title ? " · " + ep.title : ""}`,
        subtitle: "原创 · 分集大纲",
        content: ep.summary,
      });
    }
  }

  // Script episodes
  const scriptEps = data.scriptEpisodes as { id: string; number: number; title: string; content: string }[] | undefined;
  if (scriptEps) {
    for (const ep of scriptEps) {
      items.push({
        module: "original", stepLabel: "剧本正文", itemId: ep.id,
        title: `第${ep.number}集${ep.title ? " · " + ep.title : ""}`,
        subtitle: "原创 · 剧本正文",
        content: ep.content,
      });
    }
  }

  // Adapt: generated chapters
  const genChapters = data.generatedChapters as { id: string; number: number; title: string; content: string }[] | undefined;
  if (genChapters) {
    for (const ch of genChapters) {
      items.push({
        module: "adapt", stepLabel: "剧本生成", itemId: ch.id,
        title: `第${ch.number}章${ch.title ? " · " + ch.title : ""}`,
        subtitle: "改编 · 剧本生成",
        content: ch.content,
      });
    }
  }

  // Adapt: novel characters
  const novelChars = data.characters as { id: string; name: string; role: string; traits: string; relationship: string }[] | undefined;
  // Note: adapt characters are also stored as data.characters — this overlaps with original.
  // In practice, modules are separate. For now, only index if we're in adapt context.
  // We use a heuristic: if generatedChapters exist, we're in adapt context.
  if (!genChapters && novelChars) {
    // Already indexed above as original characters
  }

  // Rewrite: optimized scenes
  const optScenes = data.optimizedScenes as { id: string; number: number; title: string; original: string; rewritten: string }[] | undefined;
  if (optScenes) {
    for (const s of optScenes) {
      items.push({
        module: "rewrite", stepLabel: "深度优化", itemId: s.id,
        title: `第${s.number}场 · ${s.title}`,
        subtitle: "改写 · 深度优化",
        content: [s.original, s.rewritten].filter(Boolean).join("\n"),
      });
    }
  }

  // Evaluate: script text
  const evalScript = data.scriptText as string | undefined;
  if (evalScript) {
    items.push({
      module: "evaluate", stepLabel: "剧本上传", itemId: "eval-script",
      title: "评估剧本原文",
      subtitle: "评估 · 剧本上传",
      content: evalScript,
    });
  }

  return items;
}

export default function SearchModal({ open, onClose, workbenchData, onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const allItems = useMemo(() => buildIndex(workbenchData), [workbenchData]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allItems
      .map((item) => {
        const idx = item.content.toLowerCase().indexOf(q);
        if (idx === -1 && !item.title.toLowerCase().includes(q)) return null;
        const contextStart = Math.max(0, idx - 30);
        const contextEnd = Math.min(item.content.length, idx + q.length + 60);
        const matchLine = (contextStart > 0 ? "…" : "") +
          item.content.slice(contextStart, contextEnd) +
          (contextEnd < item.content.length ? "…" : "");
        return { ...item, matchLine, matchIndex: idx };
      })
      .filter(Boolean) as (SearchItem & { matchLine: string; matchIndex: number })[];
  }, [allItems, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[selectedIdx];
      if (item) {
        const meta = MODULE_STEP[
          item.stepLabel === "故事梗概" ? "synopsis" :
          item.stepLabel === "人物小传" ? "characters" :
          item.stepLabel === "分集大纲" ? "outlineEpisodes" :
          item.stepLabel === "剧本正文" ? "scriptEpisodes" :
          item.stepLabel === "深度优化" ? "optimizedScenes" :
          item.stepLabel === "剧本生成" ? "generatedChapters" :
          "scriptEpisodes"
        ];
        if (meta) {
          onNavigate(meta.module, meta.stepIndex, item.itemId);
        }
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  const highlightMatch = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "var(--color-accent-veil)", color: "var(--color-accent-deep)", borderRadius: "2px", padding: "0 1px" }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        paddingTop: "12vh",
        background: "rgba(0,0,0,0.3)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "640px",
          maxHeight: "70vh",
          background: "var(--color-paper)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 20px 60px -12px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-mist)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-mid)" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索剧本内容…"
            className="flex-1 bg-transparent border-none outline-none"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--color-ink)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--color-mid)",
              letterSpacing: "0.04em",
            }}
          >
            ESC
          </span>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "8px" }}>
          {!query.trim() ? (
            <div
              className="flex flex-col items-center justify-center"
              style={{ padding: "40px 0", gap: "8px" }}
            >
              <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-mid)" }}>
                输入关键词搜索所有集/章节/人物
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-mist)" }}>
                支持搜索梗概、人物、大纲、正文
              </span>
            </div>
          ) : results.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center"
              style={{ padding: "40px 0" }}
            >
              <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-mid)" }}>
                未找到匹配内容
              </span>
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: "4px 12px 8px",
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  color: "var(--color-mid)",
                  letterSpacing: "0.04em",
                }}
              >
                {results.length} 个结果
              </div>
              {results.map((item, i) => (
                <button
                  key={`${item.module}-${item.itemId}`}
                  type="button"
                  className="w-full text-left cursor-pointer bg-transparent border-none"
                  onClick={() => {
                    const metaKey =
                      item.stepLabel === "故事梗概" ? "synopsis" :
                      item.stepLabel === "人物小传" ? "characters" :
                      item.stepLabel === "分集大纲" ? "outlineEpisodes" :
                      item.stepLabel === "剧本正文" ? "scriptEpisodes" :
                      item.stepLabel === "深度优化" ? "optimizedScenes" :
                      item.stepLabel === "剧本生成" ? "generatedChapters" :
                      "scriptEpisodes";
                    const meta = MODULE_STEP[metaKey];
                    if (meta) onNavigate(meta.module, meta.stepIndex, item.itemId);
                    onClose();
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    background: i === selectedIdx ? "var(--color-accent-whisper)" : "transparent",
                    transition: "background 100ms",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-accent-whisper)"; }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = i === selectedIdx ? "var(--color-accent-whisper)" : "transparent";
                  }}
                >
                  <div className="flex items-baseline" style={{ gap: "8px", marginBottom: "4px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--color-ink)",
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        color: "var(--color-mist)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                  {item.content && (
                    <p
                      className="m-0"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        color: "var(--color-charcoal)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {highlightMatch(item.matchLine, query)}
                    </p>
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center"
          style={{
            padding: "8px 20px",
            borderTop: "1px solid var(--color-mist)",
            gap: "16px",
          }}
        >
          <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-mist)", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontWeight: 500 }}>↑↓</span> 导航
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-mist)", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontWeight: 500 }}>↵</span> 跳转
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-mist)", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontWeight: 500 }}>ESC</span> 关闭
          </span>
        </div>
      </div>
    </div>
  );
}
