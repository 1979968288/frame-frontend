import { useState, useRef } from "react";
import { Field, TextArea, Button } from "../FormControls";
import mammoth from "mammoth";
import { streamGenerate } from "../../../lib/api";

interface Chapter {
  id: string;
  number: number;
  title: string;
  wordCount: number;
}

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

export default function ImportStep({ onComplete, data, updateData }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(
    (data.fileName as string) || (data.importedNovel ? "(已上传)" : null)
  );
  const [text, setText] = useState((data.importedNovel as string) || "");
  const [chapters, setChapters] = useState<Chapter[]>((data.novelChapters as Chapter[]) || []);
  const [importMode, setImportMode] = useState<"file" | "paste">((data.importMode as "file" | "paste") || "file");
  const fileRef = useRef<HTMLInputElement>(null);

  const [aiParsing, setAiParsing] = useState(false);

  const handleAiParse = async () => {
    if (!text) return;
    setAiParsing(true);
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("adapt", "detect_chapters", { novelText: text })) {
        fullText += chunk;
      }
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.chapters?.length) {
          setChapters(
            parsed.chapters.map((c: { id?: string; number: number; title: string; wordCount?: number }, i: number) => ({
              id: c.id || `ch${i + 1}`,
              number: c.number || i + 1,
              title: c.title || `第${c.number || i + 1}章`,
              wordCount: c.wordCount || 500,
            }))
          );
        }
      }
    } catch (err) {
      console.error("AI parse failed:", err);
    } finally {
      setAiParsing(false);
    }
  };

  const parseChapters = (raw: string) => {
    const lines = raw.split(/\n/);
    const found: Chapter[] = [];
    let num = 0;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(第[一二三四五六七八九十百千\d]+[章节回])[:：\s]*(.*)/);
      if (m) {
        num++;
        // Count words until next chapter header or end
        let wordCount = 0;
        for (let j = i + 1; j < lines.length; j++) {
          if (/^(第[一二三四五六七八九十百千\d]+[章节回])/.test(lines[j])) break;
          wordCount += lines[j].replace(/\s/g, "").length;
        }
        found.push({
          id: `ch${num}`,
          number: num,
          title: m[2] || m[1],
          wordCount: Math.max(wordCount, 100),
        });
      }
    }
    if (found.length === 0 && raw.trim()) {
      found.push({ id: "ch1", number: 1, title: "全文导入", wordCount: raw.replace(/\s/g, "").length });
    }
    setChapters(found);
  };

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
      setText(content);
      parseChapters(content);
    } catch {
      setFileName(null);
      setText("");
      setChapters([]);
    }
  };

  const totalWords = chapters.reduce((s, c) => s + c.wordCount, 0);
  const canProceed = chapters.length > 0;

  return (
    <div className="flex justify-center" style={{ gap: "80px", alignItems: "flex-start" }}>
      {/* Left: import area */}
      <div style={{ flex: "0 1 720px", minWidth: 0 }}>
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
          网文导入
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
          上传网文文件或直接粘贴正文。AI 将自动识别章节结构、统计字数。
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
              {mode === "file" ? "上传文件" : "粘贴正文"}
            </button>
          ))}
        </div>

        {importMode === "file" ? (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.docx"
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
              <span style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 500, color: "var(--color-ink)", marginBottom: "6px" }}>
                {fileName ? fileName : "拖拽网文文件到此处，或点击选择"}
              </span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--color-mid)" }}>
                支持 TXT / Markdown / DOCX，最大 20MB
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
                  onClick={() => { setFileName(null); setText(""); setChapters([]); }}
                  className="ml-auto cursor-pointer bg-transparent border-none"
                  style={{ color: "var(--color-mid)", fontSize: "12px" }}
                >
                  移除
                </button>
              </div>
            )}
          </>
        ) : (
          <Field label="网文正文" required counter={`${text.length} 字`}>
            <TextArea
              value={text}
              onChange={(v) => { setText(v); parseChapters(v); }}
              placeholder="粘贴网文全文… AI 将自动识别章节标题（如：第一章 xxx、第1章 xxx）"
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
          <Button onClick={() => { updateData({ importedNovel: text, novelChapters: chapters, fileName, importMode }); onComplete(); }} disabled={!canProceed}>
            保存并继续
          </Button>
          <Button variant="secondary" disabled={aiParsing || !text} onClick={handleAiParse}>
            {aiParsing ? "解析中…" : "AI 解析章节"}
          </Button>
          <span
            className="ml-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
            }}
          >
            下一步：人物梳理 →
          </span>
        </div>
      </div>

      {/* Right: chapter detection panel */}
      <aside
        className="shrink-0 hidden lg:block"
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
              marginBottom: "20px",
            }}
          >
            {chapters.length > 0 ? `识别到 ${chapters.length} 章` : "章节识别"}
          </h3>

          {chapters.length === 0 ? (
            <p
              className="m-0"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--color-mid)",
                lineHeight: 1.6,
              }}
            >
              导入文本后，AI 将自动识别以"第X章"开头的章节标题，提取章节名称与字数统计。
            </p>
          ) : (
            <>
              <div
                className="flex items-baseline justify-between"
                style={{ marginBottom: "12px" }}
              >
                <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-mid)" }}>
                  总字数
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--color-accent-deep)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {totalWords.toLocaleString()}
                </span>
              </div>

              <div
                style={{
                  height: "1px",
                  background: "var(--color-mist)",
                  marginBottom: "12px",
                }}
              />

              <div className="flex flex-col" style={{ gap: "6px", maxHeight: "360px", overflowY: "auto" }}>
                {chapters.slice(0, 20).map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center"
                    style={{ gap: "10px" }}
                  >
                    <span
                      className="shrink-0 flex items-center justify-center"
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-warm-cream)",
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        fontWeight: 500,
                        color: "var(--color-charcoal)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {ch.number}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        color: "var(--color-charcoal)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ch.title}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "10px",
                        color: "var(--color-mid)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {ch.wordCount.toLocaleString()}字
                    </span>
                  </div>
                ))}
                {chapters.length > 20 && (
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--color-mid)", textAlign: "center", paddingTop: "4px" }}>
                    … 还有 {chapters.length - 20} 章未显示
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
