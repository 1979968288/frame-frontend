import { useState, useEffect } from "react";
import { Button } from "./FormControls";
import { streamGenerate } from "../../lib/api";
import { useUndoRedo } from "../../lib/useUndoRedo";
import { exportScriptWord, exportScriptMarkdown, exportScriptFdx, exportScriptPDF } from "../../lib/export";

interface Episode {
  id: string;
  number: number;
  title: string;
  content: string;
}

interface Props {
  onComplete: () => void;
  data?: Record<string, unknown>;
  updateData?: (patch: Record<string, unknown>) => void;
}

export default function ScriptStep({ onComplete, data, updateData }: Props) {
  const savedEpisodes = (data?.scriptEpisodes as Episode[]) || [];
  const [episodes, setEpisodes] = useState<Episode[]>(savedEpisodes);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);

  const synopsis = (data?.synopsis as string) || "";
  const characters = (data?.characters as { name: string; position: string; personality: string }[]) || [];
  const outlineEpisodes = (data?.outlineEpisodes as { number: number; title: string; summary: string }[]) || [];

  const handleSave = () => {
    updateData?.({ scriptEpisodes: episodes });
    onComplete();
  };

  // Handle search navigation jump
  useEffect(() => {
    const jumpId = data?._jumpToItem as string | undefined;
    if (jumpId && episodes.length > 0) {
      const ep = episodes.find((e) => e.id === jumpId);
      if (ep) setExpandedId(jumpId);
      updateData?.({ _jumpToItem: undefined });
    }
  }, [data?._jumpToItem]);

  const updateContent = (id: string, content: string) => {
    setEpisodes((prev) => prev.map((e) => (e.id === id ? { ...e, content } : e)));
  };

  const addEpisode = () => {
    setEpisodes((prev) => {
      const nextNumber = (prev[prev.length - 1]?.number ?? 0) + 1;
      return [
        ...prev,
        { id: `e${Date.now()}`, number: nextNumber, title: "", content: "" },
      ];
    });
  };

  const handleGenerateScript = async (id: string) => {
    if (generatingId || batchGenerating) return;
    // Snapshot before AI overwrites content
    const ep = episodes.find((e) => e.id === id);
    if (ep && id === expandedId) undo.pushSnapshot(ep.content);
    setGeneratingId(id);
    if (!ep) return;
    try {
      let fullText = "";
      const outlineForEp = outlineEpisodes.find((o) => o.number === ep.number);
      for await (const chunk of streamGenerate("original", "script", {
        episodeTitle: ep.title,
        episodeNumber: ep.number,
        synopsis,
        characters: characters.map((c) => ({ name: c.name, position: c.position, personality: c.personality })),
        episodeOutline: outlineForEp ? { title: outlineForEp.title, summary: outlineForEp.summary } : null,
      })) {
        fullText += chunk;
        setEpisodes((prev) => prev.map((e) => (e.id === id ? { ...e, content: fullText } : e)));
      }
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePolish = async (id: string) => {
    if (generatingId || batchGenerating) return;
    const ep = episodes.find((e) => e.id === id);
    if (ep && id === expandedId) undo.pushSnapshot(ep.content);
    setGeneratingId(id);
    if (!ep) return;
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("original", "polish", {
        content: ep.content,
      })) {
        fullText += chunk;
        setEpisodes((prev) => prev.map((e) => (e.id === id ? { ...e, content: fullText } : e)));
      }
    } catch (err) {
      console.error("Polish failed:", err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleBatchGenerate = async () => {
    if (generatingId || batchGenerating) return;
    setBatchGenerating(true);
    try {
      for (const ep of episodes) {
        let fullText = "";
        const outlineForEp = outlineEpisodes.find((o) => o.number === ep.number);
        for await (const chunk of streamGenerate("original", "script", {
          episodeTitle: ep.title,
          episodeNumber: ep.number,
          synopsis,
          characters: characters.map((c) => ({ name: c.name, position: c.position, personality: c.personality })),
          episodeOutline: outlineForEp ? { title: outlineForEp.title, summary: outlineForEp.summary } : null,
        })) {
          fullText += chunk;
          setEpisodes((prev) => prev.map((e) => (e.id === ep.id ? { ...e, content: fullText } : e)));
        }
      }
    } catch (err) {
      console.error("Batch generate failed:", err);
    } finally {
      setBatchGenerating(false);
    }
  };

  const totalWords = episodes.reduce((s, e) => s + e.content.length, 0);

  const expandedEpisode = expandedId
    ? episodes.find((e) => e.id === expandedId)
    : null;

  // Undo/redo for expanded editor
  const undo = useUndoRedo(expandedEpisode?.content || "");

  useEffect(() => {
    if (expandedEpisode) undo.reset(expandedEpisode.content);
  }, [expandedId]);

  const handleEditorChange = (content: string) => {
    undo.setValue(content);
    if (expandedId) updateContent(expandedId, content);
  };

  const handleEditorUndo = () => {
    const val = undo.undo();
    if (val !== null && expandedId) updateContent(expandedId, val);
  };

  const handleEditorRedo = () => {
    const val = undo.redo();
    if (val !== null && expandedId) updateContent(expandedId, val);
  };

  return (
    <div className="flex justify-center" style={{ gap: "40px", alignItems: "flex-start" }}>
      {/* Main: episode grid OR expanded view */}
      <div style={{ flex: "0 1 1200px", minWidth: 0, paddingRight: "44px" }}>
        <h2
          className="m-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "24px",
            fontWeight: 500,
            color: "var(--color-ink)",
            letterSpacing: "-0.01em",
            marginBottom: "24px",
          }}
        >
          剧本正文
        </h2>

        {expandedEpisode ? (
          <ExpandedCard
            episode={expandedEpisode}
            editorContent={undo.value}
            generating={generatingId === expandedEpisode.id}
            onChange={handleEditorChange}
            onCollapse={() => setExpandedId(null)}
            onGenerate={() => handleGenerateScript(expandedEpisode.id)}
            onPolish={() => handlePolish(expandedEpisode.id)}
            onUndo={handleEditorUndo}
            onRedo={handleEditorRedo}
            canUndo={undo.canUndo}
            canRedo={undo.canRedo}
          />
        ) : episodes.length === 0 ? (
          <EmptyState onAdd={addEpisode} />
        ) : (
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}
          >
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="group cursor-pointer"
                onClick={() => setExpandedId(ep.id)}
                style={{
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-paper)",
                  border: "1px solid var(--color-mist)",
                  padding: "24px",
                  minHeight: "180px",
                  transition: "box-shadow 200ms var(--ease-out)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <div className="flex items-baseline" style={{ marginBottom: "12px", gap: "12px" }}>
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-accent-whisper)",
                      border: "1px solid var(--color-accent-veil)",
                      color: "var(--color-accent-deep)",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {String(ep.number).padStart(2, "0")}
                  </span>
                  <h3
                    className="m-0 truncate"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "17px",
                      fontWeight: 500,
                      color: "var(--color-ink)",
                    }}
                  >
                    {ep.title || `第${ep.number}集`}
                  </h3>
                </div>
                <p
                  className="m-0"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12.5px",
                    color: "var(--color-charcoal)",
                    lineHeight: 1.75,
                    whiteSpace: "pre-wrap",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {ep.content || "点击展开编辑 — 或使用 AI 生成正文"}
                </p>
              </div>
            ))}
          </div>
        )}

        <div
          className="flex items-center"
          style={{
            marginTop: "32px",
            paddingTop: "20px",
            borderTop: "1px solid var(--color-mist)",
            gap: "12px",
          }}
        >
          <Button onClick={handleSave}>完成创作</Button>
          <Button variant="secondary" onClick={addEpisode}>新增集</Button>
          <Button variant="secondary" disabled={batchGenerating} onClick={handleBatchGenerate}>
            {batchGenerating ? "批量生成中…" : "AI 批量生成"}
          </Button>
          <span
            className="ml-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
            }}
          >
            共 {episodes.length} 集 · 约 {totalWords} 字
          </span>
        </div>
      </div>

      {/* Right: ruler */}
      <aside
        className="shrink-0 hidden lg:block"
        style={{ width: "80px", position: "sticky", top: "0" }}
      >
        <ExportMenu
          onWord={() => exportScriptWord(episodes, "剧本")}
          onMarkdown={() => exportScriptMarkdown(episodes, "剧本")}
          onFdx={() => exportScriptFdx(episodes, "剧本")}
          onPdf={exportScriptPDF}
        />

        {episodes.length > 0 && (
          <Ruler episodes={episodes} onJump={setExpandedId} />
        )}
      </aside>
    </div>
  );
}

// ============= Empty state =============
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        padding: "80px 32px",
        background: "var(--color-paper)",
        border: "1px dashed var(--color-mist)",
        borderRadius: "var(--radius-md)",
        textAlign: "center",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "var(--color-accent-whisper)",
          color: "var(--color-accent)",
          marginBottom: "20px",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="13" x2="12" y2="17" />
          <line x1="10" y1="15" x2="14" y2="15" />
        </svg>
      </div>
      <h3
        className="m-0"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "16px",
          fontWeight: 500,
          color: "var(--color-ink)",
          marginBottom: "8px",
        }}
      >
        开始撰写第一集
      </h3>
      <p
        className="m-0"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          color: "var(--color-mid)",
          lineHeight: 1.6,
          marginBottom: "24px",
          maxWidth: "360px",
        }}
      >
        还没有任何集。新增一集后，可使用 AI 生成正文或展开编辑。
      </p>
      <Button onClick={onAdd}>新增第 1 集</Button>
    </div>
  );
}



// ============= Expanded card =============
interface ExpandedProps {
  episode: Episode;
  editorContent: string;
  generating?: boolean;
  onChange: (content: string) => void;
  onCollapse: () => void;
  onGenerate: () => void;
  onPolish: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function ExpandedCard({ episode, editorContent, generating, onChange, onCollapse, onGenerate, onPolish, onUndo, onRedo, canUndo, canRedo }: ExpandedProps) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-md)",
        background: "var(--color-paper)",
        border: "1px solid var(--color-mist)",
        padding: "32px 40px",
        minHeight: "600px",
      }}
    >
      <div className="flex items-baseline" style={{ marginBottom: "24px", gap: "16px" }}>
        <span
          className="flex items-center justify-center shrink-0"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-accent)",
            border: "1px solid var(--color-accent)",
            color: "var(--color-paper)",
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(episode.number).padStart(2, "0")}
        </span>
        <h3
          className="m-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "24px",
            fontWeight: 500,
            color: "var(--color-ink)",
          }}
        >
          {episode.title || `第${episode.number}集`}
        </h3>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            color: "var(--color-mid)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginLeft: "auto",
          }}
        >
          编辑模式 · {editorContent.length} 字
        </span>
      </div>

      <textarea
        value={editorContent}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
        style={{
          minHeight: "480px",
          padding: "24px 28px",
          background: "var(--color-warm-cream)",
          border: "1px solid var(--color-mist)",
          borderRadius: "var(--radius-sm)",
          fontFamily: "var(--font-mono)",
          fontSize: "14px",
          color: "var(--color-ink)",
          outline: "none",
          resize: "vertical",
          lineHeight: 1.8,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-mist)"; }}
      />

      <div className="flex" style={{ marginTop: "20px", gap: "8px" }}>
        <Button variant="secondary" onClick={onCollapse}>← 返回列表</Button>
        <Button variant="secondary" disabled={generating} onClick={onGenerate}>
          {generating ? "生成中…" : "AI 生成本集"}
        </Button>
        <Button variant="secondary" disabled={generating} onClick={onPolish}>
          {generating ? "润色中…" : "AI 润色"}
        </Button>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="撤回"
          className="flex items-center justify-center cursor-pointer bg-transparent border-none"
          style={{
            width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
            color: canUndo ? "var(--color-charcoal)" : "var(--color-mist)",
            opacity: canUndo ? 1 : 0.4, transition: "all 150ms",
          }}
          onMouseEnter={(e) => { if (canUndo) { e.currentTarget.style.background = "var(--color-accent-whisper)"; e.currentTarget.style.color = "var(--color-accent-deep)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = canUndo ? "var(--color-charcoal)" : "var(--color-mist)"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="恢复"
          className="flex items-center justify-center cursor-pointer bg-transparent border-none"
          style={{
            width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
            color: canRedo ? "var(--color-charcoal)" : "var(--color-mist)",
            opacity: canRedo ? 1 : 0.4, transition: "all 150ms",
          }}
          onMouseEnter={(e) => { if (canRedo) { e.currentTarget.style.background = "var(--color-accent-whisper)"; e.currentTarget.style.color = "var(--color-accent-deep)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = canRedo ? "var(--color-charcoal)" : "var(--color-mist)"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============= Ruler (centimeter style) =============
function ExportMenu({
  onWord,
  onMarkdown,
  onFdx,
  onPdf,
}: {
  onWord: () => void;
  onMarkdown: () => void;
  onFdx: () => void;
  onPdf: () => void;
}) {
  const [open, setOpen] = useState(false);

  const items = [
    { label: "Word", onClick: onWord },
    { label: "Markdown", onClick: onMarkdown },
    { label: "FDX", onClick: onFdx },
    { label: "PDF", onClick: onPdf },
  ];

  return (
    <div style={{ position: "relative", marginBottom: "20px" }}>
      <button
        type="button"
        className="cursor-pointer border w-full"
        onClick={() => setOpen(!open)}
        style={{
          height: "36px",
          borderRadius: "var(--radius-sm)",
          background: open ? "var(--color-accent-whisper)" : "var(--color-paper)",
          borderColor: open ? "var(--color-accent)" : "var(--color-mist)",
          color: open ? "var(--color-accent-deep)" : "var(--color-charcoal)",
          fontFamily: "var(--font-body)",
          fontSize: "11px",
          letterSpacing: "0.06em",
          transition: "all 150ms",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = "var(--color-accent)";
            e.currentTarget.style.color = "var(--color-accent-deep)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = "var(--color-mist)";
            e.currentTarget.style.color = "var(--color-charcoal)";
          }
        }}
      >
        导出 ▾
      </button>
      {open && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9,
            }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "40px",
              left: "0",
              width: "110px",
              background: "var(--color-paper)",
              border: "1px solid var(--color-mist)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-hover)",
              zIndex: 10,
              padding: "4px",
            }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className="flex items-center cursor-pointer bg-transparent border-none w-full text-left"
                style={{
                  height: "32px",
                  padding: "0 10px",
                  borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  color: "var(--color-charcoal)",
                  letterSpacing: "0.04em",
                  transition: "background 100ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-accent-whisper)";
                  e.currentTarget.style.color = "var(--color-accent-deep)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--color-charcoal)";
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Ruler({
  episodes,
  onJump,
}: {
  episodes: Episode[];
  onJump: (id: string) => void;
}) {
  return (
    <div
      className="relative"
      style={{
        padding: "16px 0 16px 12px",
        background: "var(--color-paper)",
        border: "1px solid var(--color-mist)",
        borderRadius: "var(--radius-md)",
      }}
    >
      {/* Vertical line */}
      <div
        style={{
          position: "absolute",
          left: "12px",
          top: "16px",
          bottom: "16px",
          width: "1.5px",
          background: "var(--color-mist)",
        }}
      />
      {/* Ticks */}
      <div className="flex flex-col">
        {episodes.map((ep) => {
          const isLong = ep.number % 5 === 1 || ep.number === 1;
          return (
            <button
              key={ep.id}
              type="button"
              onClick={() => onJump(ep.id)}
              aria-label={`第${ep.number}集`}
              title={`第${ep.number}集${ep.title ? " · " + ep.title : ""}`}
              className="group relative flex items-center cursor-pointer bg-transparent border-none"
              style={{
                height: "24px",
                padding: "0",
              }}
            >
              <span
                style={{
                  width: isLong ? "20px" : "10px",
                  height: "1.5px",
                  background: "var(--color-mid)",
                  transition: "all 150ms",
                  display: "block",
                }}
              />
              <span
                className="absolute opacity-0 group-hover:opacity-100"
                style={{
                  left: "26px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  color: "var(--color-accent-deep)",
                  background: "var(--color-paper)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-mist)",
                  whiteSpace: "nowrap",
                  transition: "opacity 150ms",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                第{ep.number}集
              </span>
              <span
                className="absolute"
                style={{
                  left: "0",
                  top: "0",
                  width: "12px",
                  height: "100%",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.parentElement!.style.background = "transparent";
                  const tick = e.currentTarget.parentElement!.querySelector("span:first-child") as HTMLElement;
                  if (tick) {
                    tick.style.background = "var(--color-accent)";
                    tick.style.height = "2px";
                  }
                }}
                onMouseLeave={(e) => {
                  const tick = e.currentTarget.parentElement!.querySelector("span:first-child") as HTMLElement;
                  if (tick) {
                    tick.style.background = "var(--color-mid)";
                    tick.style.height = "1.5px";
                  }
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
