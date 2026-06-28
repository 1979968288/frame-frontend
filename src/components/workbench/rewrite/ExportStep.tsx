import { useState } from "react";
import { Button } from "../FormControls";
import { exportRewriteMarkdown, exportRewriteFdx, exportScriptPDF } from "../../../lib/export";

type ExportFormat = "pdf" | "markdown" | "fdx";

interface FormatOption {
  key: ExportFormat;
  label: string;
  description: string;
  icon: string;
}

const FORMATS: FormatOption[] = [
  { key: "pdf", label: "PDF", description: "印刷级排版，含对比标注与修订摘要", icon: "PDF" },
  { key: "markdown", label: "Markdown", description: "纯文本格式，适合版本管理与协作", icon: "MD" },
  { key: "fdx", label: "Final Draft", description: "行业标准剧本格式，可直接导入编辑", icon: "FDX" },
];

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

export default function ExportStep({ onComplete, data }: Props) {
  const [selected, setSelected] = useState<ExportFormat>("pdf");

  const scenes = (data.optimizedScenes as { number: number; title: string; original: string; rewritten: string }[]) || [];
  const stats = {
    originalWords: scenes.reduce((s, sc) => s + sc.original.length, 0) || 0,
    rewrittenWords: scenes.reduce((s, sc) => s + sc.rewritten.length, 0) || 0,
    scenesChanged: scenes.filter((sc) => sc.rewritten).length,
    totalScenes: scenes.length || 0,
  };

  const handleExport = () => {
    if (scenes.length === 0) return;
    switch (selected) {
      case "pdf":
        exportScriptPDF();
        break;
      case "markdown":
        exportRewriteMarkdown(scenes, "改写对比");
        break;
      case "fdx":
        exportRewriteFdx(scenes);
        break;
    }
  };

  return (
    <div className="flex justify-center" style={{ gap: "80px", alignItems: "flex-start" }}>
      {/* Left: format selection */}
      <div style={{ flex: "0 1 620px", minWidth: 0 }}>
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
          对比导出
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
          选择导出格式，将原文与改写版本一并导出，标注所有修改。
        </p>

        <div className="flex flex-col" style={{ gap: "12px" }}>
          {FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              type="button"
              onClick={() => setSelected(fmt.key)}
              className="text-left cursor-pointer transition-all duration-150"
              style={{
                padding: "20px 24px",
                borderRadius: "var(--radius-md)",
                background: selected === fmt.key ? "var(--color-accent-whisper)" : "var(--color-paper)",
                border: selected === fmt.key ? "1px solid var(--color-accent)" : "1px solid var(--color-mist)",
              }}
            >
              <div className="flex items-center" style={{ gap: "16px" }}>
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "var(--radius-sm)",
                    background: selected === fmt.key ? "var(--color-accent)" : "var(--color-warm-cream)",
                    color: selected === fmt.key ? "var(--color-paper)" : "var(--color-charcoal)",
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    transition: "all 180ms",
                  }}
                >
                  {fmt.icon}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: selected === fmt.key ? "var(--color-accent-deep)" : "var(--color-ink)",
                    }}
                  >
                    {fmt.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "var(--color-mid)",
                      marginTop: "2px",
                    }}
                  >
                    {fmt.description}
                  </div>
                </div>
                {selected === fmt.key && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ marginLeft: "auto" }}
                  >
                    <circle cx="8" cy="8" r="7" stroke="var(--color-accent)" strokeWidth="1.5" />
                    <circle cx="8" cy="8" r="4" fill="var(--color-accent)" />
                  </svg>
                )}
              </div>
            </button>
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
          <Button onClick={onComplete}>完成</Button>
          <Button variant="secondary" disabled={scenes.length === 0} onClick={handleExport}>导出 {selected.toUpperCase()}</Button>
        </div>
      </div>

      {/* Right: stats panel */}
      <aside
        className="shrink-0"
        style={{ width: "340px", position: "sticky", top: "0" }}
      >
        <div
          style={{
            padding: "28px",
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
              marginBottom: "24px",
            }}
          >
            改写摘要
          </h3>

          <div className="flex flex-col" style={{ gap: "20px" }}>
            <StatRow label="原文字数" value={stats.originalWords.toLocaleString()} />
            <StatRow label="改写后字数" value={stats.rewrittenWords.toLocaleString()} accent />
            <StatRow
              label="修改场次"
              value={`${stats.scenesChanged} / ${stats.totalScenes}`}
            />
            <StatRow
              label="变动比例"
              value={`${Math.round((stats.scenesChanged / stats.totalScenes) * 100)}%`}
            />
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "14px",
              background: "var(--color-accent-whisper)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-accent-deep)",
              lineHeight: 1.6,
            }}
          >
            导出文件将包含原文与改写版本的逐场对比，以及修订摘要与统计信息。
          </div>
        </div>
      </aside>
    </div>
  );
}

function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-mid)" }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "15px",
          fontWeight: 500,
          color: accent ? "var(--color-accent-deep)" : "var(--color-ink)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}
