import { useState } from "react";
import { Button } from "../FormControls";
import { exportEvalMarkdown, exportEvalPDF } from "../../../lib/export";

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

export default function ReportStep({ onComplete, data }: Props) {
  const [includeRadar, setIncludeRadar] = useState(true);
  const [includeBenchmark, setIncludeBenchmark] = useState(true);
  const [includeTextAnalysis, setIncludeTextAnalysis] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "markdown">("pdf");

  const scores = (data.analysisScores as { key: string; label: string; score: number; benchmark: number }[]) || [];
  const summary = (data.analysisSummary as string) || "";
  const overall = scores.length > 0 ? Math.round(scores.reduce((s, d) => s + d.score, 0) / scores.length) : 0;
  const aboveBenchmark = scores.filter((d) => d.score >= d.benchmark).length;
  const scriptWordCount = ((data.uploadedScript as string) || "").length;

  const handleExport = () => {
    if (scores.length === 0) return;
    if (exportFormat === "pdf") {
      exportEvalPDF();
    } else {
      exportEvalMarkdown(scores, summary, scriptWordCount);
    }
  };

  return (
    <div className="flex justify-center" style={{ gap: "80px", alignItems: "flex-start" }}>
      {/* Left: report config */}
      <div style={{ flex: "0 1 640px", minWidth: 0 }}>
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
          报告导出
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
          自定义报告内容与格式，导出完整的剧本评估报告。
        </p>

        {/* Format selection */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-ink)",
              marginBottom: "12px",
            }}
          >
            导出格式
          </div>
          <div className="flex" style={{ gap: "8px" }}>
            {(["pdf", "markdown"] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className="cursor-pointer transition-all duration-150"
                style={{
                  height: "40px",
                  padding: "0 24px",
                  borderRadius: "var(--radius-sm)",
                  background: exportFormat === fmt ? "var(--color-accent-whisper)" : "var(--color-paper)",
                  border: exportFormat === fmt ? "1px solid var(--color-accent)" : "1px solid var(--color-mist)",
                  color: exportFormat === fmt ? "var(--color-accent-deep)" : "var(--color-charcoal)",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  letterSpacing: "0.02em",
                }}
              >
                {fmt === "pdf" ? "PDF 报告" : "Markdown"}
              </button>
            ))}
          </div>
        </div>

        {/* Content options */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-ink)",
              marginBottom: "12px",
            }}
          >
            报告内容
          </div>
          <div className="flex flex-col" style={{ gap: "8px" }}>
            {[
              { key: "radar", label: "雷达图与维度评分", value: includeRadar, set: setIncludeRadar },
              { key: "benchmark", label: "同类基准对比", value: includeBenchmark, set: setIncludeBenchmark },
              { key: "text", label: "AI 综合评语", value: includeTextAnalysis, set: setIncludeTextAnalysis },
              { key: "raw", label: "原始分析数据（JSON）", value: includeRawData, set: setIncludeRawData },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => item.set(!item.value)}
                className="flex items-center cursor-pointer bg-transparent border-none text-left"
                style={{
                  padding: "10px 0",
                  gap: "10px",
                }}
              >
                <span
                  className="flex items-center justify-center shrink-0 transition-all duration-150"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "var(--radius-sm)",
                    background: item.value ? "var(--color-accent)" : "var(--color-paper)",
                    border: item.value ? "1px solid var(--color-accent)" : "1px solid var(--color-mid)",
                  }}
                >
                  {item.value && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="var(--color-paper)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: item.value ? "var(--color-ink)" : "var(--color-mid)",
                  }}
                >
                  {item.label}
                </span>
              </button>
            ))}
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
          <Button onClick={onComplete}>完成</Button>
          <Button variant="secondary" disabled={scores.length === 0} onClick={handleExport}>
            导出 {exportFormat.toUpperCase()}
          </Button>
        </div>
      </div>

      {/* Right: report preview */}
      <aside
        className="shrink-0 hidden lg:block"
        style={{ width: "420px", position: "sticky", top: "0" }}
      >
        <div
          style={{
            padding: "36px",
            background: "var(--color-paper)",
            border: "1px solid var(--color-mist)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-hover)",
          }}
        >
          {/* Mock report preview */}
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "28px",
              fontWeight: 400,
              color: "var(--color-ink)",
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            剧本评估报告
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-mid)",
              textAlign: "center",
              letterSpacing: "0.06em",
              marginBottom: "32px",
            }}
          >
            FRAME · 2026年6月
          </div>

          <div
            style={{
              height: "1px",
              background: "var(--color-mist)",
              marginBottom: "24px",
            }}
          />

          {/* Summary stats */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {[
              { label: "综合评分", value: String(overall) },
              { label: "评估维度", value: String(scores.length) },
              { label: "超过基准", value: `${aboveBenchmark}/${scores.length}` },
              { label: "总字数", value: scriptWordCount.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "var(--color-accent-deep)",
                    marginBottom: "2px",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "10px",
                    color: "var(--color-mid)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              height: "1px",
              background: "var(--color-mist)",
              marginBottom: "24px",
            }}
          />

          {/* Content preview areas */}
          {includeRadar && (
            <div
              className="flex items-center justify-center"
              style={{
                height: "100px",
                background: "var(--color-warm-cream)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "12px",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--color-mid)",
                letterSpacing: "0.04em",
              }}
            >
              雷达图预览
            </div>
          )}
          {includeBenchmark && (
            <div
              className="flex items-center justify-center"
              style={{
                height: "60px",
                background: "var(--color-warm-cream)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "12px",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "var(--color-mid)",
                letterSpacing: "0.04em",
              }}
            >
              基准对比预览
            </div>
          )}
          {includeTextAnalysis && (
            <div
              style={{
                padding: "14px",
                background: "var(--color-warm-cream)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "12px",
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                color: "var(--color-charcoal)",
                lineHeight: 1.6,
              }}
            >
              本剧本在<strong>对白质量</strong>和<strong>合规性</strong>方面表现优异...
            </div>
          )}
          {includeRawData && (
            <div
              style={{
                padding: "14px",
                background: "var(--color-warm-cream)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                color: "var(--color-mid)",
                lineHeight: 1.6,
              }}
            >
{'{ "scores": [{...}], "benchmark": {...} }'}
            </div>
          )}

          {!includeRadar && !includeBenchmark && !includeTextAnalysis && !includeRawData && (
            <div
              className="flex items-center justify-center"
              style={{
                height: "120px",
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--color-mid)",
              }}
            >
              请选择至少一项报告内容
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
