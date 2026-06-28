import { useState } from "react";
import { Button } from "../FormControls";
import { streamGenerate } from "../../../lib/api";

interface Dimension {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  weight: number; // 1-5
}

const DIMENSIONS: Omit<Dimension, "enabled" | "weight">[] = [
  { key: "structure", label: "结构完整性", description: "起承转合、场次衔接、叙事逻辑" },
  { key: "character", label: "人物弧光", description: "人物成长、动机清晰度、区分度" },
  { key: "dialogue", label: "对白质量", description: "台词自然度、潜台词、人物腔调" },
  { key: "pacing", label: "节奏控制", description: "信息密度、张弛有度、观众呼吸感" },
  { key: "conflict", label: "冲突设计", description: "戏剧张力、反转密度、悬念设置" },
  { key: "market", label: "市场潜力", description: "类型匹配度、受众规模、话题性" },
  { key: "compliance", label: "合规性", description: "行业审查、内容红线、价值观" },
  { key: "originality", label: "原创性", description: "设定新颖度、叙事手法、差异化" },
];

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

export default function DimensionStep({ onComplete, data, updateData }: Props) {
  const saved = data.evalDimensions as Dimension[] | undefined;
  const [dimensions, setDimensions] = useState<Dimension[]>(
    saved && saved.length > 0
      ? saved.map((d) => ({ ...d }))
      : DIMENSIONS.map((d) => ({ ...d, enabled: true, weight: 3 }))
  );

  const toggle = (key: string) => {
    setDimensions((prev) =>
      prev.map((d) => (d.key === key ? { ...d, enabled: !d.enabled } : d))
    );
  };

  const setWeight = (key: string, w: number) => {
    setDimensions((prev) =>
      prev.map((d) => (d.key === key ? { ...d, weight: w } : d))
    );
  };

  const [aiRecommending, setAiRecommending] = useState(false);
  const uploadedScript = (data.uploadedScript as string) || "";

  const enabledCount = dimensions.filter((d) => d.enabled).length;

  const handleAiRecommend = async () => {
    if (!uploadedScript) return;
    setAiRecommending(true);
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("evaluate", "recommend_dimensions", {
        scriptText: uploadedScript,
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
              return rec ? { ...d, enabled: rec.enabled, weight: rec.weight || 3 } : d;
            })
          );
        }
      }
    } catch (err) {
      console.error("AI recommend failed:", err);
    } finally {
      setAiRecommending(false);
    }
  };

  return (
    <div className="flex justify-center" style={{ gap: "80px", alignItems: "flex-start" }}>
      <div style={{ flex: "0 1 760px", minWidth: 0 }}>
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
          维度选择
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
          选择评估维度并设定权重（1-5）。AI 将按权重综合打分，生成雷达图与文字分析。
        </p>

        <div className="flex flex-col" style={{ gap: "12px" }}>
          {dimensions.map((dim) => (
            <div
              key={dim.key}
              style={{
                padding: "18px 20px",
                background: dim.enabled ? "var(--color-paper)" : "var(--color-warm-cream)",
                border: dim.enabled ? "1px solid var(--color-mist)" : "1px solid var(--color-mist)",
                borderRadius: "var(--radius-md)",
                opacity: dim.enabled ? 1 : 0.5,
                transition: "all 180ms var(--ease-out)",
              }}
            >
              <div className="flex items-center" style={{ gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => toggle(dim.key)}
                  className="flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150"
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "var(--radius-sm)",
                    background: dim.enabled ? "var(--color-accent)" : "var(--color-paper)",
                    border: dim.enabled ? "1px solid var(--color-accent)" : "1px solid var(--color-mid)",
                  }}
                >
                  {dim.enabled && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="var(--color-paper)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: dim.enabled ? "var(--color-ink)" : "var(--color-mid)",
                    }}
                  >
                    {dim.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-mid)",
                      marginTop: "2px",
                    }}
                  >
                    {dim.description}
                  </div>
                </div>

                {dim.enabled && (
                  <div className="flex items-center" style={{ gap: "2px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        color: "var(--color-mid)",
                        letterSpacing: "0.06em",
                        marginRight: "4px",
                      }}
                    >
                      权重
                    </span>
                    {[1, 2, 3, 4, 5].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWeight(dim.key, w)}
                        className="cursor-pointer transition-all duration-150"
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "var(--radius-sm)",
                          background: dim.weight >= w ? "var(--color-accent)" : "var(--color-warm-cream)",
                          border: "none",
                          color: dim.weight >= w ? "var(--color-paper)" : "var(--color-charcoal)",
                          fontFamily: "var(--font-body)",
                          fontSize: "10px",
                          fontWeight: 500,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                )}
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
          <Button onClick={() => { updateData({ evalDimensions: dimensions }); onComplete(); }} disabled={enabledCount === 0}>
            保存并继续
          </Button>
          <Button variant="secondary" disabled={aiRecommending || !uploadedScript} onClick={handleAiRecommend}>
            {aiRecommending ? "分析中…" : "AI 推荐维度"}
          </Button>
          <span
            className="ml-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
            }}
          >
            已选 {enabledCount} 个维度 · 下一步：AI 分析 →
          </span>
        </div>
      </div>

      {/* Right: weight summary */}
      <aside
        className="shrink-0 hidden lg:block"
        style={{ width: "260px", position: "sticky", top: "0" }}
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
            权重分布
          </h3>
          <div className="flex flex-col" style={{ gap: "10px" }}>
            {dimensions
              .filter((d) => d.enabled)
              .map((dim) => (
                <div key={dim.key} className="flex items-center" style={{ gap: "8px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-charcoal)",
                      width: "72px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dim.label}
                  </span>
                  <div
                    className="flex flex-1"
                    style={{ gap: "2px", height: "6px" }}
                  >
                    {[1, 2, 3, 4, 5].map((w) => (
                      <div
                        key={w}
                        className="flex-1"
                        style={{
                          borderRadius: "2px",
                          background: dim.weight >= w ? "var(--color-accent)" : "var(--color-mist)",
                          transition: "background 200ms",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--color-mid)",
                      fontVariantNumeric: "tabular-nums",
                      width: "14px",
                      textAlign: "right",
                    }}
                  >
                    {dim.weight}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
