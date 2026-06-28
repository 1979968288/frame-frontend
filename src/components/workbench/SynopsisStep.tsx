import { useState } from "react";
import { Field, RadioGroup, Select, TextArea, Button } from "./FormControls";
import { streamGenerate } from "../../lib/api";

const GENRES = [
  "古装悬疑", "都市情感", "武侠江湖", "科幻未来",
  "现实主义", "奇幻玄幻", "历史传奇", "青春校园",
  "谍战特工", "犯罪刑侦", "家庭伦理", "职场商战",
  "末日生存", "赛博朋克", "东方仙侠", "西方魔幻",
  "悬疑惊悚", "轻松喜剧", "战争军事", "体育竞技",
  "医疗行业", "律政法庭", "美食生活", "音乐歌舞",
];

const STYLES = [
  "冷峻写实", "诗意浪漫", "黑色幽默", "热血激昂",
  "细腻治愈", "荒诞讽刺", "史诗厚重",
  "轻快诙谐", "压抑暗黑", "温情催泪", "凌厉快节奏",
  "意识流碎片", "纪录片式", "多线叙事", "环形结构",
  "非线性跳跃", "独白自述", "章节回目", "书信日记体",
];

const SETTINGS = [
  "宫廷权谋", "江湖恩怨", "末世废土", "星际拓荒",
  "校园青春", "商战风云", "家族兴衰", "跨界穿越",
  "修仙宗门", "神魔大战", "地下黑道", "乡野田园",
  "现代都会", "民国乱世", "古代王朝", "异界大陆",
  "虚拟游戏", "深海秘境", "雪域高原", "沙漠荒城",
  "战时后方", "豪门恩怨", "娱乐圈层", "市井街巷",
];

interface Props {
  onComplete: () => void;
  data?: Record<string, unknown>;
  updateData?: (patch: Record<string, unknown>) => void;
}

export default function SynopsisStep({ onComplete, data, updateData }: Props) {
  const [audience, setAudience] = useState<string>((data?.audience as string) || "男频");
  const [genre, setGenre] = useState<string>((data?.genre as string) || "");
  const [style, setStyle] = useState<string>((data?.style as string) || "");
  const [setting, setSetting] = useState<string>((data?.setting as string) || "");
  const [worldview, setWorldview] = useState<string>((data?.worldview as string) || "");
  const [highlight, setHighlight] = useState<string>((data?.highlight as string) || "");
  const [synopsis, setSynopsis] = useState<string>((data?.synopsis as string) || "");
  const [aiGenerating, setAiGenerating] = useState(false);

  const canProceed = genre && style && setting && synopsis.trim().length >= 20;

  const handleSave = () => {
    updateData?.({ synopsis, audience, genre, style, setting, worldview, highlight });
    onComplete();
  };

  const handleAiComplete = async () => {
    setAiGenerating(true);
    try {
      let fullText = "";
      for await (const chunk of streamGenerate("original", "synopsis", {
        audience,
        genre,
        style,
        setting,
        worldview,
        highlight,
      })) {
        fullText += chunk;
        setSynopsis(fullText);
      }
    } catch (err) {
      console.error("AI gen failed:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: "100%" }}
    >
      <div style={{ width: "100%", maxWidth: "880px" }}>
        <h2
          className="m-0"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "24px",
            fontWeight: 500,
            color: "var(--color-ink)",
            letterSpacing: "-0.01em",
            marginBottom: "32px",
          }}
        >
          故事梗概
        </h2>

        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}
        >
          <Field label="目标受众" required>
            <RadioGroup options={["男频", "女频"]} value={audience} onChange={setAudience} />
          </Field>
          <Field label="类型题材" required>
            <Select value={genre} onChange={setGenre} options={GENRES} placeholder="选择题材方向" />
          </Field>

          <Field label="风格元素" required>
            <Select value={style} onChange={setStyle} options={STYLES} placeholder="选择叙事基调" />
          </Field>
          <Field label="核心设定" required>
            <Select value={setting} onChange={setSetting} options={SETTINGS} placeholder="选择故事舞台" />
          </Field>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <Field label="世界观" hint="可选">
            <TextArea
              value={worldview}
              onChange={setWorldview}
              placeholder="描述故事发生的世界规则、时代背景、特殊设定…"
              height={96}
            />
          </Field>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <Field label="核心亮点" hint="可选">
            <TextArea
              value={highlight}
              onChange={setHighlight}
              placeholder="这个故事最吸引人的 1-3 个亮点：反转、人物、世界观奇观…"
              height={96}
            />
          </Field>
        </div>

        <div style={{ marginBottom: "32px" }}>
          <Field label="核心梗概" required counter={`${synopsis.length} / 500`}>
            <TextArea
              value={synopsis}
              onChange={setSynopsis}
              placeholder="用 200-500 字描述故事的开端、发展、转折与结局…"
              height={180}
              maxLength={500}
            />
          </Field>
        </div>

        <div
          className="flex items-center"
          style={{
            paddingTop: "20px",
            borderTop: "1px solid var(--color-mist)",
            gap: "12px",
          }}
        >
          <Button onClick={handleSave} disabled={!canProceed}>
            保存并继续
          </Button>
          <Button variant="secondary" disabled={aiGenerating || !genre || !style || !setting} onClick={handleAiComplete}>
            {aiGenerating ? "生成中…" : "AI 补全"}
          </Button>
          <span
            className="ml-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              color: "var(--color-mid)",
            }}
          >
            下一步：人物小传 →
          </span>
        </div>
      </div>
    </div>
  );
}
