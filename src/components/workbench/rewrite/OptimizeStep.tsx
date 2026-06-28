import { useState, useMemo } from "react";
import { Button } from "../FormControls";
import { streamGenerate } from "../../../lib/api";

interface Scene {
  id: string;
  number: number;
  title: string;
  original: string;
  rewritten: string;
}

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

export default function OptimizeStep({ onComplete, data, updateData }: Props) {
  const importedScript = (data.importedScript as string) || "";
  const rewriteDimensions = (data.rewriteDimensions as { key: string; selected: boolean; intensity: number }[]) || [];

  const initialScenes = useMemo((): Scene[] => {
    if (!importedScript) return [];
    const parts = importedScript
      .split(/(?=(?:第[一二三四五六七八九十百千\d]+场|场景[：:]|\d+\.\s*))/)
      .filter((p) => p.trim());
    return parts.map((text, i) => ({
      id: `s${i + 1}`,
      number: i + 1,
      title: `第${i + 1}场`,
      original: text.trim(),
      rewritten: "",
    }));
  }, [importedScript]);

  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [activeScene, setActiveScene] = useState<string>(initialScenes[0]?.id || "s1");
  const [highlightDiff, setHighlightDiff] = useState(true);
  const [generating, setGenerating] = useState(false);

  const handleOptimizeAll = async () => {
    setGenerating(true);
    try {
      for (const s of scenes) {
        let fullText = "";
        for await (const chunk of streamGenerate("rewrite", "optimize", {
          sceneTitle: s.title,
          sceneNumber: s.number,
          originalContent: s.original,
          dimensions: rewriteDimensions.filter((d) => d.selected),
        })) {
          fullText += chunk;
          updateScene(s.id, { rewritten: fullText });
        }
      }
    } catch (err) {
      console.error("Optimize failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const scene = scenes.find((s) => s.id === activeScene) || scenes[0];

  const updateScene = (id: string, patch: Partial<Scene>) => {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  return (
    <div className="flex flex-col items-center" style={{ width: "100%" }}>
      <div style={{ width: "100%", maxWidth: "1400px" }}>
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
            深度优化
          </h2>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
              marginLeft: "auto",
            }}
          >
            原文与改写逐场对比
          </span>
        </div>

        {/* Scene tabs */}
        {scenes.length > 0 && (
        <div className="flex" style={{ gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>
          {scenes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveScene(s.id)}
              className="cursor-pointer transition-all duration-150"
              style={{
                height: "34px",
                padding: "0 16px",
                borderRadius: "var(--radius-sm)",
                background: activeScene === s.id ? "var(--color-accent-whisper)" : "var(--color-paper)",
                border: activeScene === s.id ? "1px solid var(--color-accent)" : "1px solid var(--color-mist)",
                color: activeScene === s.id ? "var(--color-accent-deep)" : "var(--color-charcoal)",
                fontFamily: "var(--font-body)",
                fontSize: "12px",
              }}
            >
              第{s.number}场 · {s.title}
            </button>
          ))}
        </div>
        )}

        {/* Diff toggle */}
        <div className="flex items-center" style={{ marginBottom: "16px", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setHighlightDiff(!highlightDiff)}
            className="flex items-center cursor-pointer bg-transparent border-none"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "11px",
              color: "var(--color-charcoal)",
              gap: "6px",
              letterSpacing: "0.04em",
            }}
          >
            <span
              className="flex items-center justify-center"
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "3px",
                background: highlightDiff ? "var(--color-accent)" : "var(--color-paper)",
                border: highlightDiff ? "1px solid var(--color-accent)" : "1px solid var(--color-mist)",
                transition: "all 150ms",
              }}
            >
              {highlightDiff && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="var(--color-paper)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            高亮差异
          </button>
        </div>

        {/* Side-by-side */}
        {scenes.length === 0 ? (
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
            <p
              className="m-0"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--color-mid)",
                lineHeight: 1.6,
              }}
            >
              尚未导入剧本或未检测到场次。请返回「剧本导入」步骤上传剧本文件或粘贴文本。
            </p>
          </div>
        ) : (
        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {/* Original */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--color-mid)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              原文
            </div>
            <textarea
              value={scene.original}
              onChange={(e) => updateScene(scene.id, { original: e.target.value })}
              placeholder="原文内容…"
              className="w-full"
              style={{
                height: "400px",
                padding: "20px",
                background: "var(--color-warm-cream)",
                border: "1px solid var(--color-mist)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: "var(--color-charcoal)",
                lineHeight: 1.8,
                outline: "none",
                resize: "vertical",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-mist)"; }}
            />
          </div>

          {/* Rewritten */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--color-accent-deep)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              改写
            </div>
            <textarea
              value={scene.rewritten}
              onChange={(e) => updateScene(scene.id, { rewritten: e.target.value })}
              placeholder="AI 改写后将在此显示…"
              className="w-full"
              style={{
                height: "400px",
                padding: "20px",
                background: "var(--color-accent-whisper)",
                border: "1px solid var(--color-accent-veil)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: "var(--color-ink)",
                lineHeight: 1.8,
                outline: "none",
                resize: "vertical",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-accent-veil)"; }}
            />
          </div>
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
          <Button onClick={() => { updateData({ optimizedScenes: scenes }); onComplete(); }}>保存并继续</Button>
          <Button variant="secondary" disabled={generating} onClick={handleOptimizeAll}>
            {generating ? "生成中…" : "AI 逐场优化"}
          </Button>
          <span
            className="ml-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
            }}
          >
            下一步：对比导出 →
          </span>
        </div>
      </div>
    </div>
  );
}
