import { useState } from "react";
import { Button } from "../FormControls";
import { streamGenerate } from "../../../lib/api";

interface AdaptedChapter {
  id: string;
  number: number;
  sourceChapters: string;
  title: string;
  plotPoints: string;
}

interface Chapter { id: string; number: number; title: string; wordCount: number; }

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

function buildInitialChapters(novelChapters: Chapter[]): AdaptedChapter[] {
  if (!novelChapters || novelChapters.length === 0) {
    return [
      { id: "a1", number: 1, sourceChapters: "第1-5章", title: "", plotPoints: "" },
      { id: "a2", number: 2, sourceChapters: "第6-10章", title: "", plotPoints: "" },
    ];
  }
  const groupSize = Math.max(1, Math.floor(novelChapters.length / 6));
  const groups: AdaptedChapter[] = [];
  for (let i = 0; i < novelChapters.length; i += groupSize) {
    const group = novelChapters.slice(i, i + groupSize);
    groups.push({
      id: `a${groups.length + 1}`,
      number: groups.length + 1,
      sourceChapters: `第${group[0].number}-${group[group.length - 1].number}章`,
      title: "",
      plotPoints: "",
    });
  }
  return groups;
}

export default function BreakdownStep({ onComplete, data, updateData }: Props) {
  const novelChapters = (data.novelChapters as Chapter[]) || [];
  const savedChapters = data.adaptedChapters as AdaptedChapter[] | undefined;
  const [chapters, setChapters] = useState<AdaptedChapter[]>(
    savedChapters && savedChapters.length > 0 ? savedChapters : buildInitialChapters(novelChapters)
  );

  const updateChapter = (id: string, patch: Partial<AdaptedChapter>) => {
    setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addChapter = () => {
    setChapters((prev) => {
      const nextNumber = (prev[prev.length - 1]?.number ?? 0) + 1;
      return [...prev, { id: `a${Date.now()}`, number: nextNumber, sourceChapters: "", title: "", plotPoints: "" }];
    });
  };

  const removeChapter = (id: string) => {
    setChapters((prev) => {
      const next = prev.filter((c) => c.id !== id);
      return next.map((c, i) => ({ ...c, number: i + 1 }));
    });
  };

  const [aiBreaking, setAiBreaking] = useState(false);
  const characters = (data.characters as { name: string; role: string; traits: string }[]) || [];

  const handleAiBreakdown = async () => {
    if (novelChapters.length === 0) return;
    setAiBreaking(true);
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("adapt", "breakdown_chapters", {
        novelChapters,
        characters,
      })) {
        fullText += chunk;
      }
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.chapters?.length) {
          setChapters(
            parsed.chapters.map(
              (c: { number: number; title: string; sourceChapters: string; plotPoints: string }, i: number) => ({
                id: `a${i + 1}`,
                number: c.number || i + 1,
                sourceChapters: c.sourceChapters || "",
                title: c.title || "",
                plotPoints: c.plotPoints || "",
              })
            )
          );
        }
      }
    } catch (err) {
      console.error("AI breakdown failed:", err);
    } finally {
      setAiBreaking(false);
    }
  };

  return (
    <div className="flex justify-center" style={{ gap: "80px", alignItems: "flex-start" }}>
      {/* Left: adapted chapter list */}
      <div style={{ flex: "1 1 0", minWidth: 0, maxWidth: "900px" }}>
        <h2
          className="m-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "22px",
            fontWeight: 500,
            color: "var(--color-ink)",
            letterSpacing: "-0.01em",
            marginBottom: "8px",
          }}
        >
          章节拆解
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
          将原文章节重新组织为改编章。一章改编章可合并多个原文相邻章节，定义每章的核心情节要点。
        </p>

        <div className="flex items-baseline" style={{ marginBottom: "16px" }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-ink)",
            }}
          >
            改编章节列表
          </span>
          <span
            style={{
              marginLeft: "8px",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-mid)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            共 {chapters.length} 章
          </span>
          <button
            type="button"
            onClick={addChapter}
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
            新增章节
          </button>
        </div>

        <div className="flex flex-col" style={{ gap: "12px" }}>
          {chapters.map((ch) => (
            <div
              key={ch.id}
              style={{
                padding: "20px 24px",
                background: "var(--color-paper)",
                border: "1px solid var(--color-mist)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {/* Row 1: number + title + source */}
              <div className="flex items-center" style={{ gap: "12px", marginBottom: "12px" }}>
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-accent)",
                    border: "1px solid var(--color-accent)",
                    color: "var(--color-paper)",
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(ch.number).padStart(2, "0")}
                </span>
                <input
                  type="text"
                  value={ch.title}
                  onChange={(e) => updateChapter(ch.id, { title: e.target.value })}
                  placeholder={`第${ch.number}改编章标题`}
                  className="flex-1 bg-transparent border-none outline-none"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "var(--color-ink)",
                    padding: 0,
                  }}
                />
                <input
                  type="text"
                  value={ch.sourceChapters}
                  onChange={(e) => updateChapter(ch.id, { sourceChapters: e.target.value })}
                  placeholder="来源：第X-Y章"
                  className="bg-transparent border outline-none text-right"
                  style={{
                    width: "140px",
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    color: "var(--color-mid)",
                    padding: "2px 6px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-warm-cream)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeChapter(ch.id)}
                  aria-label="删除此章"
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

              {/* Row 2: plot points */}
              <textarea
                value={ch.plotPoints}
                onChange={(e) => updateChapter(ch.id, { plotPoints: e.target.value })}
                placeholder="本章核心情节要点：开端、冲突、转折、结局…（每行一条）"
                className="w-full bg-transparent border-none outline-none resize-none"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  color: "var(--color-charcoal)",
                  lineHeight: 1.6,
                  padding: 0,
                  minHeight: "20px",
                }}
                rows={3}
              />
            </div>
          ))}
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
          <Button onClick={() => { updateData({ adaptedChapters: chapters }); onComplete(); }}>保存并继续</Button>
          <Button variant="secondary" disabled={aiBreaking || novelChapters.length === 0} onClick={handleAiBreakdown}>
            {aiBreaking ? "拆解中…" : "AI 拆解章节"}
          </Button>
          <span
            className="ml-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
            }}
          >
            下一步：剧本生成 →
          </span>
        </div>
      </div>

      {/* Right: chapter mapping reference */}
      <aside
        className="shrink-0 hidden lg:block"
        style={{ width: "280px", position: "sticky", top: "0" }}
      >
        <div
          style={{
            padding: "24px",
            background: "var(--color-paper)",
            border: "1px solid var(--color-mist)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <h3
            className="m-0"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-ink)",
              marginBottom: "16px",
            }}
          >
            章节映射
          </h3>
          <div className="flex flex-col" style={{ gap: "10px" }}>
            {chapters.map((ch) => (
              <div key={ch.id} className="flex items-start" style={{ gap: "8px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--color-accent-deep)",
                    fontVariantNumeric: "tabular-nums",
                    minWidth: "28px",
                    textAlign: "right",
                    paddingTop: "1px",
                  }}
                >
                  Ch{String(ch.number).padStart(2, "0")}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    color: "var(--color-mid)",
                    lineHeight: 1.5,
                  }}
                >
                  {ch.sourceChapters || "未映射"}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              background: "var(--color-accent-whisper)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-accent-deep)",
              lineHeight: 1.6,
            }}
          >
            提示：网文通常 5-10 章可合并为 1 章改编章。根据情节密度灵活调整。
          </div>
        </div>
      </aside>
    </div>
  );
}
