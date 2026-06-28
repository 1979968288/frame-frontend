import { useState, useEffect } from "react";
import { Button } from "../FormControls";
import { streamGenerate } from "../../../lib/api";
import { useUndoRedo } from "../../../lib/useUndoRedo";

interface AdaptedChapter {
  id: string;
  number: number;
  title: string;
  content: string;
}

interface BreakdownChapter {
  id: string;
  number: number;
  sourceChapters: string;
  title: string;
  plotPoints: string;
}

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

function buildGenerateChapters(breakdownChapters: BreakdownChapter[]): AdaptedChapter[] {
  if (!breakdownChapters || breakdownChapters.length === 0) {
    return [
      { id: "a1", number: 1, title: "", content: "" },
      { id: "a2", number: 2, title: "", content: "" },
    ];
  }
  return breakdownChapters.map((bc) => ({
    id: bc.id,
    number: bc.number,
    title: bc.title || `第${bc.number}章`,
    content: "",
  }));
}

export default function GenerateStep({ onComplete, data, updateData }: Props) {
  const breakdownChapters = (data.adaptedChapters as BreakdownChapter[]) || [];
  const characters = (data.characters as { name: string; role: string; traits: string; relationship: string }[]) || [];
  const [chapters, setChapters] = useState<AdaptedChapter[]>(buildGenerateChapters(breakdownChapters));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);

  // Handle search navigation jump
  useEffect(() => {
    const jumpId = data._jumpToItem as string | undefined;
    if (jumpId && chapters.length > 0) {
      const ch = chapters.find((c) => c.id === jumpId);
      if (ch) setExpandedId(jumpId);
      updateData({ _jumpToItem: undefined });
    }
  }, [data._jumpToItem]);

  const updateContent = (id: string, content: string) => {
    setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, content } : c)));
  };

  const addChapter = () => {
    setChapters((prev) => {
      const nextNumber = (prev[prev.length - 1]?.number ?? 0) + 1;
      return [...prev, { id: `a${Date.now()}`, number: nextNumber, title: "", content: "" }];
    });
  };

  const handleGenerateChapter = async (id: string) => {
    if (generatingId || batchGenerating) return;
    const ch = chapters.find((c) => c.id === id);
    if (ch && id === expandedId) undo.pushSnapshot(ch.content);
    setGeneratingId(id);
    const bc = breakdownChapters.find((b) => b.id === id);
    if (!ch) return;
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("adapt", "adapt_chapter", {
        chapterTitle: ch.title,
        chapterNumber: ch.number,
        plotPoints: bc?.plotPoints || "",
        sourceChapters: bc?.sourceChapters || "",
        characters: characters.map((c) => ({ name: c.name, role: c.role, traits: c.traits })),
      })) {
        fullText += chunk;
        updateContent(id, fullText);
      }
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePolish = async (id: string) => {
    if (generatingId || batchGenerating) return;
    const ch = chapters.find((c) => c.id === id);
    if (ch && id === expandedId) undo.pushSnapshot(ch.content);
    setGeneratingId(id);
    if (!ch) return;
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("adapt", "polish", {
        content: ch.content,
      })) {
        fullText += chunk;
        updateContent(id, fullText);
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
      for (const ch of chapters) {
        let fullText = "";
        const bc = breakdownChapters.find((b) => b.id === ch.id);
        for await (const chunk of streamGenerate("adapt", "adapt_chapter", {
          chapterTitle: ch.title,
          chapterNumber: ch.number,
          plotPoints: bc?.plotPoints || "",
          sourceChapters: bc?.sourceChapters || "",
          characters: characters.map((c) => ({ name: c.name, role: c.role, traits: c.traits })),
        })) {
          fullText += chunk;
          updateContent(ch.id, fullText);
        }
      }
    } catch (err) {
      console.error("Batch generate failed:", err);
    } finally {
      setBatchGenerating(false);
    }
  };

  const expanded = expandedId ? chapters.find((c) => c.id === expandedId) : null;
  const totalWords = chapters.reduce((s, c) => s + c.content.length, 0);

  // Undo/redo for expanded editor
  const undo = useUndoRedo(expanded?.content || "");

  useEffect(() => {
    if (expanded) undo.reset(expanded.content);
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
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h2
        className="m-0"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "24px",
          fontWeight: 500,
          color: "var(--color-ink)",
          letterSpacing: "-0.01em",
          marginBottom: "8px",
        }}
      >
        剧本生成
      </h2>
      <p
        className="m-0"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "13px",
          color: "var(--color-mid)",
          lineHeight: 1.6,
          marginBottom: "32px",
        }}
      >
        AI 将根据章节拆解结果，保留原作的叙事风格与对白特色，逐章生成改编剧本。
      </p>

      {expanded ? (
        /* Expanded editor */
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
              {String(expanded.number).padStart(2, "0")}
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
              {expanded.title || `第${expanded.number}章`}
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
              编辑模式 · {undo.value.length} 字
            </span>
          </div>

          <textarea
            value={undo.value}
            onChange={(e) => handleEditorChange(e.target.value)}
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
            placeholder="在此撰写或编辑改编后的剧本正文…"
          />

          <div className="flex" style={{ marginTop: "20px", gap: "8px" }}>
            <Button variant="secondary" onClick={() => setExpandedId(null)}>← 返回列表</Button>
            <Button variant="secondary" disabled={generatingId === expanded.id} onClick={() => handleGenerateChapter(expanded.id)}>
              {generatingId === expanded.id ? "生成中…" : "AI 生成本章"}
            </Button>
            <Button variant="secondary" disabled={generatingId === expanded.id} onClick={() => handlePolish(expanded.id)}>
              {generatingId === expanded.id ? "润色中…" : "AI 润色"}
            </Button>
            <span style={{ flex: 1 }} />
            <button
              type="button"
              onClick={handleEditorUndo}
              disabled={!undo.canUndo}
              title="撤回"
              className="flex items-center justify-center cursor-pointer bg-transparent border-none"
              style={{
                width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
                color: undo.canUndo ? "var(--color-charcoal)" : "var(--color-mist)",
                opacity: undo.canUndo ? 1 : 0.4, transition: "all 150ms",
              }}
              onMouseEnter={(e) => { if (undo.canUndo) { e.currentTarget.style.background = "var(--color-accent-whisper)"; e.currentTarget.style.color = "var(--color-accent-deep)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = undo.canUndo ? "var(--color-charcoal)" : "var(--color-mist)"; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleEditorRedo}
              disabled={!undo.canRedo}
              title="恢复"
              className="flex items-center justify-center cursor-pointer bg-transparent border-none"
              style={{
                width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
                color: undo.canRedo ? "var(--color-charcoal)" : "var(--color-mist)",
                opacity: undo.canRedo ? 1 : 0.4, transition: "all 150ms",
              }}
              onMouseEnter={(e) => { if (undo.canRedo) { e.currentTarget.style.background = "var(--color-accent-whisper)"; e.currentTarget.style.color = "var(--color-accent-deep)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = undo.canRedo ? "var(--color-charcoal)" : "var(--color-mist)"; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
        </div>
      ) : chapters.length === 0 ? (
        /* Empty state */
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
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-mid)", marginBottom: "20px" }}>
            尚未拆解章节。请返回上一步完成章节拆解。
          </p>
          <Button onClick={addChapter}>新增第 1 章</Button>
        </div>
      ) : (
        /* Chapter card grid */
        <>
          <div
            className="grid"
            style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}
          >
            {chapters.map((ch) => (
              <div
                key={ch.id}
                className="group cursor-pointer"
                onClick={() => setExpandedId(ch.id)}
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
                    {String(ch.number).padStart(2, "0")}
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
                    {ch.title || `第${ch.number}章`}
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
                  {ch.content || "点击展开编辑 — 或使用 AI 生成正文"}
                </p>
              </div>
            ))}
          </div>
        </>
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
        <Button onClick={() => { updateData({ generatedChapters: chapters }); onComplete(); }}>完成创作</Button>
        <Button variant="secondary" onClick={addChapter}>新增章</Button>
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
          共 {chapters.length} 章 · 约 {totalWords} 字
        </span>
      </div>
    </div>
  );
}
