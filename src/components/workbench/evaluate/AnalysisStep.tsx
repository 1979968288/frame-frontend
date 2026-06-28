import { useState } from "react";
import { Button } from "../FormControls";
import { streamGenerate } from "../../../lib/api";

interface DimensionScore {
  key: string;
  label: string;
  score: number; // 0-100
  benchmark: number;
}

const MOCK_SCORES: DimensionScore[] = [
  { key: "structure", label: "结构完整性", score: 82, benchmark: 70 },
  { key: "character", label: "人物弧光", score: 75, benchmark: 68 },
  { key: "dialogue", label: "对白质量", score: 88, benchmark: 72 },
  { key: "pacing", label: "节奏控制", score: 68, benchmark: 70 },
  { key: "conflict", label: "冲突设计", score: 79, benchmark: 65 },
  { key: "market", label: "市场潜力", score: 85, benchmark: 73 },
  { key: "compliance", label: "合规性", score: 92, benchmark: 80 },
  { key: "originality", label: "原创性", score: 71, benchmark: 68 },
];

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

export default function AnalysisStep({ onComplete, data, updateData }: Props) {
  const [scores, setScores] = useState<DimensionScore[]>(MOCK_SCORES);
  const [summary, setSummary] = useState(
    "本剧本在<strong>对白质量</strong>和<strong>合规性</strong>方面表现优异，对白自然流畅，符合行业审查要求。<strong>节奏控制</strong>略低于同类基准，建议在中段增加冲突密度与反转频次，以维持观众注意力。整体而言，这是一部具有良好市场潜力的类型剧本，在优化节奏后可进一步提升竞争力。"
  );
  const [generating, setGenerating] = useState(false);

  const uploadedScript = (data.uploadedScript as string) || "";
  const evalDimensions = (data.evalDimensions as { key: string; enabled: boolean; weight: number }[]) || [];

  const handleAnalyze = async () => {
    setGenerating(true);
    try {
      let fullText = "";
      const activeDimensions = evalDimensions.length > 0
        ? evalDimensions.filter((d) => d.enabled)
        : MOCK_SCORES;
      for await (const chunk of streamGenerate("evaluate", "analyze", {
        scriptText: uploadedScript,
        dimensions: activeDimensions.map((d) => ({ key: d.key, weight: (d as { weight?: number }).weight || 3 })),
      })) {
        fullText += chunk;
      }
      // Extract JSON from response
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.scores) setScores(data.scores);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const overall = Math.round(scores.reduce((s, d) => s + d.score, 0) / scores.length);

  return (
    <div className="flex justify-center" style={{ gap: "80px", alignItems: "flex-start" }}>
      {/* Left: radar + scores */}
      <div style={{ flex: "0 1 760px", minWidth: 0 }}>
        <div className="flex items-center" style={{ marginBottom: "24px", gap: "16px" }}>
          <h2
            className="m-0"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "24px",
              fontWeight: 500,
              color: "var(--color-ink)",
              letterSpacing: "-0.01em",
            }}
          >
            AI 分析结果
          </h2>
          <span
            className="flex items-center justify-center"
            style={{
              padding: "4px 14px",
              borderRadius: "100px",
              background: "var(--color-accent-whisper)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--color-accent-deep)",
            }}
          >
            综合 {overall} 分
          </span>
        </div>

        {/* Radar chart */}
        <RadarChart scores={scores} />

        {/* Dimension score cards */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          {scores.map((dim) => (
            <div
              key={dim.key}
              style={{
                padding: "16px 20px",
                background: "var(--color-paper)",
                border: "1px solid var(--color-mist)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div className="flex items-baseline justify-between" style={{ marginBottom: "8px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-ink)",
                  }}
                >
                  {dim.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: dim.score >= dim.benchmark ? "var(--color-accent-deep)" : "var(--color-charcoal)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {dim.score}
                </span>
              </div>
              {/* Score bar */}
              <div className="flex items-center" style={{ gap: "8px" }}>
                <div
                  className="flex-1"
                  style={{
                    height: "8px",
                    borderRadius: "4px",
                    background: "var(--color-warm-cream)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${dim.score}%`,
                      borderRadius: "4px",
                      background: "var(--color-accent)",
                      transition: "width 600ms var(--ease-out)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "10px",
                    color: "var(--color-mid)",
                    width: "36px",
                    textAlign: "right",
                  }}
                >
                  基准 {dim.benchmark}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Text analysis */}
        <div
          style={{
            marginTop: "24px",
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
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-ink)",
              marginBottom: "12px",
            }}
          >
            AI 综合评语
          </h3>
          <p
            className="m-0"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--color-charcoal)",
              lineHeight: 1.8,
            }}
          >
            {summary}
          </p>
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
          <Button onClick={() => { updateData({ analysisScores: scores, analysisSummary: summary }); onComplete(); }}>保存并继续</Button>
          <Button variant="secondary" disabled={generating} onClick={handleAnalyze}>
            {generating ? "分析中…" : "重新分析"}
          </Button>
          <span
            className="ml-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
            }}
          >
            下一步：报告导出 →
          </span>
        </div>
      </div>

      {/* Right: benchmark comparison */}
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
            marginBottom: "16px",
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
            同类基准对比
          </h3>
          <div className="flex flex-col" style={{ gap: "12px" }}>
            {scores.map((dim) => {
              const diff = dim.score - dim.benchmark;
              return (
                <div key={dim.key} className="flex items-center" style={{ gap: "8px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      color: "var(--color-charcoal)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dim.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 500,
                      color: diff >= 0 ? "var(--color-accent-deep)" : "var(--color-charcoal)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {diff >= 0 ? `+${diff}` : diff}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            padding: "16px",
            background: "var(--color-accent-whisper)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "var(--color-accent-deep)",
            lineHeight: 1.6,
          }}
        >
          {scores.filter((d) => d.score >= d.benchmark).length}/{scores.length} 维度超过同类基准
        </div>
      </aside>
    </div>
  );
}

// SVG Radar chart
function RadarChart({ scores }: { scores: DimensionScore[] }) {
  const cx = 180;
  const cy = 180;
  const r = 140;
  const n = scores.length;
  const angleSlice = (2 * Math.PI) / n;

  const getPoint = (i: number, value: number) => {
    const angle = angleSlice * i - Math.PI / 2;
    const dist = (value / 100) * r;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    };
  };

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1];

  // Axis lines + labels
  const axes = scores.map((dim, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const labelR = r + 28;
    const lx = cx + labelR * Math.cos(angle);
    const ly = cy + labelR * Math.sin(angle);
    return { ...dim, angle, lx, ly };
  });

  // Score polygon
  const scorePoints = scores.map((dim, i) => {
    const pt = getPoint(i, dim.score);
    return `${pt.x},${pt.y}`;
  }).join(" ");

  // Benchmark polygon
  const benchPoints = scores.map((dim, i) => {
    const pt = getPoint(i, dim.benchmark);
    return `${pt.x},${pt.y}`;
  }).join(" ");

  return (
    <div
      className="flex justify-center"
      style={{
        padding: "24px",
        background: "var(--color-paper)",
        border: "1px solid var(--color-mist)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <svg width="400" height="400" viewBox="0 0 360 360">
        {/* Grid rings */}
        {rings.map((ring) => {
          const pts = scores
            .map((_, i) => {
              const pt = getPoint(i, ring * 100);
              return `${pt.x},${pt.y}`;
            })
            .join(" ");
          return (
            <polygon
              key={ring}
              points={pts}
              fill="none"
              stroke="var(--color-mist)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Axis lines */}
        {axes.map((a, i) => {
          const pt = getPoint(i, 100);
          return (
            <line
              key={a.key}
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke="var(--color-mist)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Benchmark polygon */}
        <polygon
          points={benchPoints}
          fill="oklch(52% 0 0 / 0.06)"
          stroke="var(--color-mid)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* Score polygon */}
        <polygon
          points={scorePoints}
          fill="oklch(62% 0.16 55 / 0.12)"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
        />

        {/* Score dots */}
        {scores.map((dim, i) => {
          const pt = getPoint(i, dim.score);
          return (
            <circle
              key={dim.key}
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill="var(--color-accent)"
              stroke="var(--color-paper)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels */}
        {axes.map((a) => (
          <text
            key={a.key}
            x={a.lx}
            y={a.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              fill: "var(--color-charcoal)",
              letterSpacing: "0.02em",
            }}
          >
            {a.label}
          </text>
        ))}

        {/* Center overall score */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "28px",
            fontWeight: 400,
            fill: "var(--color-accent-deep)",
          }}
        >
          {Math.round(scores.reduce((s, d) => s + d.score, 0) / scores.length)}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fill: "var(--color-mid)",
            letterSpacing: "0.06em",
          }}
        >
          综合
        </text>
      </svg>
    </div>
  );
}
