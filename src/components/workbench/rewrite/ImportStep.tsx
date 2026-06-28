import { useState, useRef, useMemo } from "react";
import { Field, TextArea, Button } from "../FormControls";
import mammoth from "mammoth";

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

interface DetectedScene {
  id: string;
  number: number;
  preview: string;
}

const ACCEPTED = ".pdf,.fdx,.md,.txt,.docx";

function parseScenes(text: string): DetectedScene[] {
  if (!text.trim()) return [];
  // Try splitting on scene markers
  const markerSplit = text.split(/(?=(?:第\s*\d+\s*场|场景\s*\d+|【场景))/);
  const parts = markerSplit.length > 1 ? markerSplit : [text];

  // If only 1 part, try double-newline split
  if (parts.length === 1) {
    const blankSplit = text.split(/\n\s*\n/);
    if (blankSplit.length > 1) {
      return blankSplit
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => ({
          id: `s${i + 1}`,
          number: i + 1,
          preview: p.replace(/\n/g, " ").slice(0, 28) + (p.length > 28 ? "…" : ""),
        }));
    }
  }

  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => ({
      id: `s${i + 1}`,
      number: i + 1,
      preview: p.replace(/\n/g, " ").slice(0, 28) + (p.length > 28 ? "…" : ""),
    }));
}

export default function ImportStep({ onComplete, data, updateData }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(
    data.importedScript ? ("fileName" in data ? (data.fileName as string) : null) : null
  );
  const [pastedText, setPastedText] = useState((data.importedScript as string) || "");
  const [importMode, setImportMode] = useState<"file" | "paste">((data.importMode as "file" | "paste") || "file");
  const fileRef = useRef<HTMLInputElement>(null);

  const scenes = useMemo(() => (importMode === "file" && fileName ? parseScenes(pastedText) : []), [pastedText, fileName, importMode]);

  const handleFile = async (f: File) => {
    setFileName(f.name);
    try {
      if (f.name.endsWith(".docx")) {
        const arrayBuffer = await f.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setPastedText(result.value);
      } else {
        const text = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(f);
        });
        setPastedText(text);
      }
    } catch {
      setPastedText("");
    }
  };

  const handleRemove = () => {
    setFileName(null);
    setPastedText("");
    updateData({ importedScript: "", fileName: null });
  };

  const canProceed = importMode === "file" ? fileName !== null : pastedText.trim().length > 0;

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
          剧本导入
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
          上传或粘贴已有剧本，AI 将自动识别场次划分。
        </p>

        {/* Mode toggle */}
        <div className="flex" style={{ gap: "8px", marginBottom: "24px" }}>
          {(["file", "paste"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setImportMode(mode)}
              className="cursor-pointer transition-all duration-150"
              style={{
                height: "36px",
                padding: "0 18px",
                borderRadius: "var(--radius-sm)",
                background: importMode === mode ? "var(--color-accent-whisper)" : "var(--color-paper)",
                border: importMode === mode ? "1px solid var(--color-accent)" : "1px solid var(--color-mist)",
                color: importMode === mode ? "var(--color-accent-deep)" : "var(--color-charcoal)",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                letterSpacing: "0.02em",
              }}
            >
              {mode === "file" ? "上传文件" : "粘贴文本"}
            </button>
          ))}
        </div>

        {importMode === "file" ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              style={{ display: "none" }}
            />
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              className="flex flex-col items-center justify-center cursor-pointer"
              style={{
                padding: "64px 32px",
                background: dragOver ? "var(--color-accent-whisper)" : "var(--color-paper)",
                border: dragOver ? "2px dashed var(--color-accent)" : "2px dashed var(--color-mist)",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
                transition: "all 180ms var(--ease-out)",
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
                  marginBottom: "16px",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "var(--color-ink)",
                  marginBottom: "6px",
                }}
              >
                {fileName ? fileName : "拖拽文件到此处，或点击选择"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  color: "var(--color-mid)",
                }}
              >
                支持 PDF / FDX / Markdown / TXT / DOCX，最大 20MB
              </span>
            </div>

            {fileName && (
              <div
                className="flex items-center"
                style={{
                  marginTop: "16px",
                  padding: "10px 14px",
                  background: "var(--color-accent-whisper)",
                  borderRadius: "var(--radius-sm)",
                  gap: "8px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-deep)" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-accent-deep)", fontWeight: 500 }}>
                  {fileName}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-mid)" }}>
                  {pastedText.length.toLocaleString()} 字
                </span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="ml-auto cursor-pointer bg-transparent border-none"
                  style={{ color: "var(--color-mid)", fontSize: "12px" }}
                >
                  移除
                </button>
              </div>
            )}

            {/* Scene detection panel */}
            {scenes.length > 0 && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px 24px",
                  background: "var(--color-paper)",
                  border: "1px solid var(--color-mist)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="flex items-center" style={{ marginBottom: "12px", gap: "8px" }}>
                  <span
                    className="flex items-center justify-center"
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-accent-whisper)",
                      color: "var(--color-accent-deep)",
                      fontFamily: "var(--font-body)",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 500, color: "var(--color-ink)" }}>
                    已识别 {scenes.length} 个场次
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-mid)", marginLeft: "auto" }}>
                    点击下一步进入优化
                  </span>
                </div>
                <div
                  style={{
                    maxHeight: "340px",
                    overflowY: "auto",
                    paddingRight: "4px",
                  }}
                  className="custom-scrollbar"
                >
                  <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
                    {scenes.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center"
                        style={{
                          padding: "6px 10px",
                          background: "var(--color-warm-cream)",
                          borderRadius: "var(--radius-sm)",
                          gap: "8px",
                          minWidth: 0,
                        }}
                      >
                        <span
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--color-accent)",
                            color: "var(--color-paper)",
                            fontFamily: "var(--font-body)",
                            fontSize: "10px",
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {String(s.number).padStart(2, "0")}
                        </span>
                        <span
                          className="truncate"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "var(--color-charcoal)",
                            minWidth: 0,
                          }}
                        >
                          {s.preview}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-mid)", display: "block", marginTop: "8px" }}>
                  共 {scenes.length} 个场次 — 拖拽滚动查看全部
                </span>
              </div>
            )}
          </>
        ) : (
          <Field label="剧本正文" required counter={`${pastedText.length} 字`}>
            <TextArea
              value={pastedText}
              onChange={setPastedText}
              placeholder="粘贴完整的剧本文本…"
              height={320}
            />
          </Field>
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
          <Button onClick={() => { updateData({ importedScript: pastedText, fileName, importMode, detectedScenes: scenes }); onComplete(); }} disabled={!canProceed}>
            保存并继续
          </Button>
          <span
            className="ml-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
            }}
          >
            下一步：改写方向 →
          </span>
        </div>
      </div>
    </div>
  );
}
