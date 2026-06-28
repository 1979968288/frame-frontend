import { useState } from "react";
import { Button } from "../FormControls";
import { streamGenerate } from "../../../lib/api";

interface Dimension {
  key: string;
  label: string;
  description: string;
  selected: boolean;
  intensity: number; // 1=轻, 2=中, 3=深
}

const DIMENSIONS: Omit<Dimension, "selected" | "intensity">[] = [
  { key: "rhythm", label: "节奏", description: "调整场次长短、信息密度与呼吸感" },
  { key: "dialogue", label: "对白", description: "优化台词风格、潜台词与人物腔调" },
  { key: "character", label: "人物", description: "增强人物弧光、动机逻辑与区分度" },
  { key: "conflict", label: "冲突", description: "提升戏剧张力、反转密度与悬念" },
];

const INTENSITY_LABELS = ["轻度", "中度", "深度"];

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

export default function DirectionStep({ onComplete, data, updateData }: Props) {
  const saved = data.rewriteDimensions as Dimension[] | undefined;
  const [dimensions, setDimensions] = useState<Dimension[]>(
    saved && saved.length > 0
      ? saved.map((d) => ({ ...d }))
      : DIMENSIONS.map((d) => ({ ...d, selected: false, intensity: 2 }))
  );

  const toggle = (key: string) => {
    setDimensions((prev) =>
      prev.map((d) => (d.key === key ? { ...d, selected: !d.selected } : d))
    );
  };

  const setIntensity = (key: string, v: number) => {
    setDimensions((prev) =>
      prev.map((d) => (d.key === key ? { ...d, intensity: v } : d))
    );
  };

  const [analyzing, setAnalyzing] = useState(false);
  const importedScript = (data.importedScript as string) || "";

  const anySelected = dimensions.some((d) => d.selected);

  const handleAiAnalyze = async () => {
    if (!importedScript) return;
    setAnalyzing(true);
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("rewrite", "analyze_for_rewrite", {
        scriptText: importedScript,
      })) {
        fullText += chunk;
      }
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.dimensions) {
          setDimensions((prev) =>
            prev.map((d) => {
              const rec = parsed.dimensions.find((r: { key: string }) => r.key === d.key);
              return rec ? { ...d, selected: rec.selected, intensity: rec.intensity || 2 } : d;
            })
          );
        }
      }
    } catch (err) {
      console.error("Analyze failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center" style={{ width: "100%" }}>
      <div style={{ width: "100%", maxWidth: "880px" }}>
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
          改写方向
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
          选择需要优化的维度并设定改写深度。AI 将根据所选维度逐场改写。
        </p>

        <div className="flex flex-col" style={{ gap: "16px" }}>
          {dimensions.map((dim) => (
            <div
              key={dim.key}
              style={{
                padding: "24px",
                background: dim.selected ? "var(--color-accent-whisper)" : "var(--color-paper)",
                border: dim.selected ? "1px solid var(--color-accent)" : "1px solid var(--color-mist)",
                borderRadius: "var(--radius-md)",
                transition: "all 180ms var(--ease-out)",
              }}
            >
              <div className="flex items-start" style={{ gap: "14px" }}>
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggle(dim.key)}
                  className="flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150"
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "var(--radius-sm)",
                    background: dim.selected ? "var(--color-accent)" : "var(--color-paper)",
                    border: dim.selected ? "1px solid var(--color-accent)" : "1px solid var(--color-mid)",
                    marginTop: "2px",
                  }}
                >
                  {dim.selected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="var(--color-paper)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: dim.selected ? "var(--color-accent-deep)" : "var(--color-ink)",
                      marginBottom: "4px",
                    }}
                  >
                    {dim.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "var(--color-mid)",
                      lineHeight: 1.5,
                      marginBottom: dim.selected ? "16px" : "0",
                    }}
                  >
                    {dim.description}
                  </div>

                  {dim.selected && (
                    <div className="flex items-center" style={{ gap: "4px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                          color: "var(--color-mid)",
                          marginRight: "8px",
                          letterSpacing: "0.04em",
                        }}
                      >
                        深度
                      </span>
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setIntensity(dim.key, level)}
                          className="cursor-pointer transition-all duration-150"
                          style={{
                            height: "28px",
                            padding: "0 12px",
                            borderRadius: "var(--radius-sm)",
                            background: dim.intensity === level ? "var(--color-accent)" : "var(--color-warm-cream)",
                            border: "1px solid transparent",
                            color: dim.intensity === level ? "var(--color-paper)" : "var(--color-charcoal)",
                            fontFamily: "var(--font-body)",
                            fontSize: "11px",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {INTENSITY_LABELS[level - 1]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
          <Button onClick={() => { updateData({ rewriteDimensions: dimensions }); onComplete(); }} disabled={!anySelected}>
            保存并继续
          </Button>
          <Button variant="secondary" disabled={analyzing || !importedScript} onClick={handleAiAnalyze}>
            {analyzing ? "分析中…" : "AI 分析原文"}
          </Button>
          <span
            className="ml-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
            }}
          >
            下一步：深度优化 →
          </span>
        </div>
      </div>
    </div>
  );
}
