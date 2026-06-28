import { useState, useRef } from "react";
import { Field, TextArea, Button } from "../FormControls";
import mammoth from "mammoth";

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

export default function UploadStep({ onComplete, data, updateData }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(
    (data.fileName as string) || (data.uploadedScript ? "(已上传)" : null)
  );
  const [pastedText, setPastedText] = useState((data.uploadedScript as string) || "");
  const [importMode, setImportMode] = useState<"file" | "paste">((data.importMode as "file" | "paste") || "file");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    setFileName(f.name);
    try {
      let content: string;
      if (f.name.endsWith(".docx")) {
        const arrayBuffer = await f.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(f);
        });
      }
      setPastedText(content);
    } catch {
      setPastedText("");
    }
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
          剧本上传
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
          上传待评估的剧本文件或直接粘贴正文。支持 PDF / FDX / Markdown / TXT。
        </p>

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
              accept=".pdf,.fdx,.md,.txt,.docx"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 500, color: "var(--color-ink)", marginBottom: "6px" }}>
                {fileName ? fileName : "拖拽剧本文件到此处，或点击选择"}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-mid)" }}>
                支持 PDF / FDX / Markdown / TXT，最大 20MB
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
                <button
                  type="button"
                  onClick={() => { setFileName(null); setPastedText(""); }}
                  className="ml-auto cursor-pointer bg-transparent border-none"
                  style={{ color: "var(--color-mid)", fontSize: "12px" }}
                >
                  移除
                </button>
              </div>
            )}
          </>
        ) : (
          <Field label="剧本正文" required counter={`${pastedText.length} 字`}>
            <TextArea
              value={pastedText}
              onChange={setPastedText}
              placeholder="粘贴剧本正文… AI 将自动分析结构、人物、对白等维度"
              height={360}
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
          <Button onClick={() => { updateData({ uploadedScript: pastedText, fileName, importMode }); onComplete(); }} disabled={!canProceed}>
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
            下一步：维度选择 →
          </span>
        </div>
      </div>
    </div>
  );
}
