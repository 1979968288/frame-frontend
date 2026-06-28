import { useState } from "react";
import { Field, TextInput, TextArea, Select, Button } from "../FormControls";
import { streamGenerate } from "../../../lib/api";

interface Character {
  id: string;
  name: string;
  role: string;
  aliases: string;
  traits: string;
  appearance: string;
  sourceChapters: string;
  relationship: string;
}

const POSITIONS = [
  "主角", "第二主角", "反派", "重要配角", "次要配角",
  "线索人物", "导师/智者", "盟友/伙伴", "爱人/恋人", "喜剧担当",
  "悲剧人物", "幕后黑手", "反英雄", "叙述者", "催化剂人物", "路人/龙套",
];

const INITIAL: Character[] = [];

interface Props {
  onComplete: () => void;
  data: Record<string, unknown>;
  updateData: (patch: Record<string, unknown>) => void;
}

export default function CharacterStep({ onComplete, data, updateData }: Props) {
  const saved = data.characters as Character[] | undefined;
  const [characters, setCharacters] = useState<Character[]>(saved && saved.length > 0 ? saved : INITIAL);
  const firstId = (saved && saved.length > 0) ? saved[0].id : "";
  const [selectedId, setSelectedId] = useState<string>(firstId);
  const selected = characters.find((c) => c.id === selectedId) ?? null;

  const update = (patch: Partial<Character>) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, ...patch } : c))
    );
  };

  const addNew = () => {
    const id = `c${Date.now()}`;
    setCharacters((prev) => [
      ...prev,
      { id, name: "", role: "", aliases: "", traits: "", appearance: "", sourceChapters: "", relationship: "" },
    ]);
    setSelectedId(id);
  };

  const remove = (id: string) => {
    setCharacters((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === selectedId && next.length > 0) setSelectedId(next[0].id);
      return next;
    });
  };

  const [aiExtracting, setAiExtracting] = useState(false);
  const importedNovel = (data.importedNovel as string) || "";
  const novelChapters = (data.novelChapters as { id: string; number: number; title: string; wordCount: number }[]) || [];

  const handleAiExtract = async () => {
    if (!importedNovel) return;
    setAiExtracting(true);
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("adapt", "extract_characters", {
        novelText: importedNovel,
        chapters: novelChapters,
      })) {
        fullText += chunk;
      }
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.characters?.length) {
          const extracted = parsed.characters.map(
            (c: { id?: string; name: string; role: string; aliases?: string; traits?: string; appearance?: string; sourceChapters?: string; relationship?: string }, i: number) => ({
              id: c.id || `c${i + 1}`,
              name: c.name || "",
              role: c.role || "",
              aliases: c.aliases || "",
              traits: c.traits || "",
              appearance: c.appearance || "",
              sourceChapters: c.sourceChapters || "",
              relationship: c.relationship || "",
            })
          );
          setCharacters(extracted);
          setSelectedId(extracted[0]?.id || null);
          updateData({ characters: extracted });
        }
      }
    } catch (err) {
      console.error("AI extract failed:", err);
    } finally {
      setAiExtracting(false);
    }
  };

  return (
    <div className="flex justify-center" style={{ gap: "80px", alignItems: "flex-start" }}>
      {/* Left: editor */}
      <div style={{ flex: "0 1 620px", minWidth: 0, maxWidth: "620px" }}>
        {selected ? (
          <>
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
            人物梳理
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
            AI 已从原文中提取人物信息。确认并完善每位角色的档案，这些信息将用于后续章节拆解与剧本生成。
          </p>
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}
        >
          <Field label="姓名" required>
            <TextInput value={selected.name} onChange={(v) => update({ name: v })} placeholder="人物姓名" />
          </Field>
          <Field label="别称" hint="可选">
            <TextInput value={selected.aliases} onChange={(v) => update({ aliases: v })} placeholder="绰号、尊称、化名…" />
          </Field>
        </div>

        <Field label="角色定位" required>
          <Select
            value={selected.role}
            onChange={(v) => update({ role: v })}
            options={POSITIONS}
            placeholder="选择人物在故事中的角色"
          />
        </Field>

        <Field label="性格特征">
          <TextArea
            value={selected.traits}
            onChange={(v) => update({ traits: v })}
            placeholder="性格标签、行为习惯、口头禅、核心价值观…"
            height={80}
          />
        </Field>

        <Field label="外貌特征" hint="可选">
          <TextInput
            value={selected.appearance}
            onChange={(v) => update({ appearance: v })}
            placeholder="年龄感、标志性外貌、穿着风格…"
          />
        </Field>

        <Field label="出处章节" hint="人物首次出场或关键出场位置">
          <TextInput
            value={selected.sourceChapters}
            onChange={(v) => update({ sourceChapters: v })}
            placeholder="如：第3章、第12-15章"
          />
        </Field>

        <Field label="人物关系">
          <TextArea
            value={selected.relationship}
            onChange={(v) => update({ relationship: v })}
            placeholder="与其他主要人物的关系：师徒、对手、恋人、血亲…"
            height={100}
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
          <Button onClick={() => { updateData({ characters }); onComplete(); }} disabled={characters.length === 0}>
            保存并继续
          </Button>
          <Button variant="secondary" disabled={aiExtracting || !importedNovel} onClick={handleAiExtract}>
            {aiExtracting ? "提取中…" : "AI 提取人物"}
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
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-mid)" }}>
              请新增或选择一位人物
            </p>
          </div>
        )}
      </div>

      {/* Right: character list */}
      <aside
        className="shrink-0"
        style={{ width: "420px", position: "sticky", top: "0" }}
      >
        <div className="flex items-baseline" style={{ marginBottom: "16px" }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-ink)",
            }}
          >
            人物列表
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

        <div className="flex flex-col" style={{ gap: "8px" }}>
          {characters.map((c) => {
            const isActive = c.id === selectedId;
            const initial = c.name ? c.name.charAt(0) : "?";
            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="cursor-pointer border transition-all duration-150"
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  background: isActive ? "var(--color-accent-whisper)" : "var(--color-paper)",
                  borderColor: isActive ? "var(--color-accent)" : "var(--color-mist)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = "var(--color-accent-veil)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = "var(--color-mist)";
                }}
              >
                <div className="flex items-center" style={{ gap: "10px" }}>
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: isActive ? "var(--color-accent)" : "var(--color-warm-cream)",
                      color: isActive ? "var(--color-paper)" : "var(--color-charcoal)",
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: "14px",
                    }}
                  >
                    {initial}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: isActive ? "var(--color-accent-deep)" : "var(--color-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.name || "未命名"}
                      {c.aliases && (
                        <span style={{ fontSize: "11px", color: "var(--color-mid)", fontWeight: 400, marginLeft: "4px" }}>
                          ({c.aliases})
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--color-mid)",
                      }}
                    >
                      {c.role || "待设定"} · 出处 {c.sourceChapters || "未知"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addNew}
          className="flex items-center justify-center w-full cursor-pointer border mt-2"
          style={{
            height: "48px",
            borderRadius: "var(--radius-md)",
            background: "transparent",
            borderColor: "var(--color-mist)",
            borderStyle: "dashed",
            color: "var(--color-mid)",
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            gap: "6px",
            letterSpacing: "0.04em",
            transition: "all 180ms",
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
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          新增人物
        </button>
      </aside>
    </div>
  );
}
