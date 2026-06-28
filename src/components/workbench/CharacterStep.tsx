import { useState } from "react";
import { Field, TextInput, Select, TextArea, Button } from "./FormControls";
import { streamGenerate } from "../../lib/api";

interface Character {
  id: string;
  name: string;
  position: string;
  age: number;
  personality: string;
  background: string;
}

const POSITIONS = [
  "主角", "第二主角", "反派", "重要配角", "次要配角",
  "线索人物", "导师/智者", "盟友/伙伴", "爱人/恋人", "喜剧担当",
  "悲剧人物", "幕后黑手", "反英雄", "叙述者", "催化剂人物", "路人/龙套",
];

const INITIAL: Character[] = [];

interface Props {
  onComplete: () => void;
  data?: Record<string, unknown>;
  updateData?: (patch: Record<string, unknown>) => void;
}

export default function CharacterStep({ onComplete, data, updateData }: Props) {
  const saved = (data?.characters as Character[]) || [];
  const [characters, setCharacters] = useState<Character[]>(saved.length > 0 ? saved : INITIAL);
  const [selectedId, setSelectedId] = useState<string | null>(saved[0]?.id ?? INITIAL[0]?.id ?? null);
  const [aiGenerating, setAiGenerating] = useState(false);

  const selected = characters.find((c) => c.id === selectedId) ?? characters[0];

  const update = (patch: Partial<Character>) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, ...patch } : c))
    );
  };

  const addNew = () => {
    const id = `c${Date.now()}`;
    const newChar: Character = {
      id,
      name: "",
      position: "",
      age: 24,
      personality: "",
      background: "",
    };
    setCharacters((prev) => [...prev, newChar]);
    setSelectedId(id);
  };

  const remove = (id: string) => {
    setCharacters((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === selectedId && next.length > 0) {
        setSelectedId(next[0].id);
      }
      return next;
    });
  };

  const synopsis = (data?.synopsis as string) || "";

  const handleSave = () => {
    updateData?.({ characters });
    onComplete();
  };

  const handleAiGenerate = async () => {
    if (!selected) return;
    setAiGenerating(true);
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("original", "generate_character", {
        name: selected.name,
        position: selected.position,
        age: selected.age,
        personality: selected.personality,
        background: selected.background,
        synopsis,
      })) {
        fullText += chunk;
      }
      const personalityMatch = fullText.match(/性格[：:]\s*([\s\S]*?)(?=背景[：:]|$)/);
      const backgroundMatch = fullText.match(/背景[：:]\s*([\s\S]*?)$/);
      const patch: Partial<Character> = {};
      if (personalityMatch?.[1]) patch.personality = personalityMatch[1].trim();
      if (backgroundMatch?.[1]) patch.background = backgroundMatch[1].trim();
      if (patch.personality || patch.background) update(patch);
    } catch (err) {
      console.error("AI gen failed:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="flex justify-center" style={{ gap: "80px", alignItems: "flex-start" }}>
      {/* Left: editor */}
      <div style={{ flex: "0 1 620px", minWidth: 0, maxWidth: "620px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h2
            className="m-0"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "22px",
              fontWeight: 500,
              color: "var(--color-ink)",
              letterSpacing: "-0.01em",
            }}
          >
            人物小传
          </h2>
          <p
            className="m-0"
            style={{
              marginTop: "6px",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--color-mid)",
              lineHeight: 1.6,
            }}
          >
            从右侧选择人物编辑，或新增人物。每个角色将贯穿分集大纲与剧本正文。
          </p>
        </div>

        {selected ? (
          <>
            <Field label="姓名" required>
              <TextInput
                value={selected.name}
                onChange={(v) => update({ name: v })}
                placeholder="输入人物姓名"
              />
            </Field>

            <Field label="定位" required>
              <Select
                value={selected.position}
                onChange={(v) => update({ position: v })}
                options={POSITIONS}
                placeholder="选择人物在故事中的角色"
              />
            </Field>

            <Field label="年龄">
              <Stepper
                value={selected.age}
                onChange={(v) => update({ age: v })}
                min={0}
                max={200}
              />
            </Field>

            <Field label="性格">
              <TextArea
                value={selected.personality}
                onChange={(v) => update({ personality: v })}
                placeholder="外冷内热、多疑、重情义…"
                height={80}
              />
            </Field>

            <Field label="背景">
              <TextArea
                value={selected.background}
                onChange={(v) => update({ background: v })}
                placeholder="出身、经历、关键事件、与其他人物的关系…"
                height={120}
              />
            </Field>

            <div
              className="flex items-center"
              style={{
                marginTop: "24px",
                paddingTop: "20px",
                borderTop: "1px solid var(--color-mist)",
                gap: "12px",
              }}
            >
              <Button onClick={handleSave}>保存并继续</Button>
              <Button variant="secondary" disabled={aiGenerating || !selected?.name} onClick={handleAiGenerate}>
                {aiGenerating ? "生成中…" : "AI 生成本人物"}
              </Button>
              <button
                type="button"
                onClick={() => remove(selected.id)}
                className="ml-auto cursor-pointer bg-transparent border-none"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  color: "var(--color-mid)",
                  letterSpacing: "0.04em",
                  transition: "color 150ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-accent-deep)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-mid)"; }}
              >
                删除此人物
              </button>
            </div>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              padding: "64px 32px",
              background: "var(--color-paper)",
              border: "1px dashed var(--color-mist)",
              borderRadius: "var(--radius-md)",
              textAlign: "center",
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
                marginBottom: "20px",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3
              className="m-0"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "16px",
                fontWeight: 500,
                color: "var(--color-ink)",
                marginBottom: "8px",
              }}
            >
              添加第一位人物
            </h3>
            <p
              className="m-0"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--color-mid)",
                lineHeight: 1.6,
                maxWidth: "320px",
              }}
            >
              在右侧方阵点击「新增人物」开始建立角色档案。
            </p>
          </div>
        )}
      </div>

      {/* Right: character grid */}
      <aside
        className="shrink-0"
        style={{ width: "560px", position: "sticky", top: "0" }}
      >
        <div
          className="flex items-baseline"
          style={{ marginBottom: "16px" }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-ink)",
            }}
          >
            人物方阵
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
            共 {characters.length} 位
          </span>
          <button
            type="button"
            onClick={addNew}
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
            新增人物
          </button>
        </div>

        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          {characters.map((c) => {
            const isActive = c.id === selectedId;
            const initial = c.name ? c.name.charAt(0) : "？";
            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="relative cursor-pointer border text-left group"
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: "var(--radius-md)",
                  background: isActive
                    ? "var(--color-accent-whisper)"
                    : "var(--color-paper)",
                  borderColor: isActive
                    ? "var(--color-accent)"
                    : "var(--color-mist)",
                  padding: "16px",
                  transition: "all 180ms var(--ease-out)",
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--color-accent-veil)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--color-mist)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: isActive
                      ? "var(--color-accent)"
                      : "var(--color-warm-cream)",
                    color: isActive
                      ? "var(--color-paper)"
                      : "var(--color-charcoal)",
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "16px",
                    marginBottom: "10px",
                    transition: "all 180ms var(--ease-out)",
                  }}
                >
                  {initial}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: isActive ? "var(--color-accent-deep)" : "var(--color-ink)",
                    marginBottom: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.name || "未命名"}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--color-mid)",
                    letterSpacing: "0.02em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.position || "待设定"}
                </div>

                {/* Hover delete (bottom-right) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(c.id);
                  }}
                  aria-label="删除此人物"
                  className="absolute flex items-center justify-center cursor-pointer border-none opacity-0 group-hover:opacity-100"
                  style={{
                    bottom: "8px",
                    right: "8px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-paper)",
                    color: "var(--color-mid)",
                    transition: "all 180ms var(--ease-out)",
                    boxShadow: "0 2px 8px -2px rgba(0,0,0,0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-accent-deep)";
                    e.currentTarget.style.background = "var(--color-accent-whisper)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-mid)";
                    e.currentTarget.style.background = "var(--color-paper)";
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            );
          })}

          {/* Add block */}
          <button
            type="button"
            onClick={addNew}
            className="flex flex-col items-center justify-center cursor-pointer border"
            style={{
              aspectRatio: "1 / 1",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              borderColor: "var(--color-mist)",
              borderStyle: "dashed",
              color: "var(--color-mid)",
              transition: "all 180ms var(--ease-out)",
              fontFamily: "var(--font-body)",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
              e.currentTarget.style.color = "var(--color-accent-deep)";
              e.currentTarget.style.background = "var(--color-accent-whisper)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-mist)";
              e.currentTarget.style.color = "var(--color-mid)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: "11px", letterSpacing: "0.04em" }}>新增人物</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center" style={{ gap: "8px" }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex items-center justify-center cursor-pointer border"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-paper)",
          borderColor: "var(--color-mist)",
          color: "var(--color-charcoal)",
          fontSize: "16px",
          transition: "all 150ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-accent)";
          e.currentTarget.style.color = "var(--color-accent-deep)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-mist)";
          e.currentTarget.style.color = "var(--color-charcoal)";
        }}
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        className="text-center"
        style={{
          width: "56px",
          height: "32px",
          background: "var(--color-paper)",
          border: "1px solid var(--color-mist)",
          borderRadius: "var(--radius-sm)",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          color: "var(--color-ink)",
          outline: "none",
          fontVariantNumeric: "tabular-nums",
        }}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex items-center justify-center cursor-pointer border"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-paper)",
          borderColor: "var(--color-mist)",
          color: "var(--color-charcoal)",
          fontSize: "16px",
          transition: "all 150ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-accent)";
          e.currentTarget.style.color = "var(--color-accent-deep)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-mist)";
          e.currentTarget.style.color = "var(--color-charcoal)";
        }}
      >
        +
      </button>
      <span
        style={{
          marginLeft: "8px",
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: "var(--color-mid)",
        }}
      >
        岁
      </span>
    </div>
  );
}
