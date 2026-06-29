type Module = "original" | "rewrite" | "adapt" | "evaluate";
type Action =
  | "outline"
  | "script"
  | "polish"
  | "synopsis"
  | "generate_character"
  | "optimize"
  | "analyze_for_rewrite"
  | "adapt_chapter"
  | "breakdown_chapters"
  | "analyze"
  | "recommend_dimensions"
  | "extract_characters"
  | "detect_scenes"
  | "detect_chapters";

function truncateText(text: string, maxChars = 80000): string {
  if (text.length <= maxChars) return text;
  return (
    text.slice(0, maxChars) +
    "\n\n[... 文本过长，已截断，剩余 " +
    (text.length - maxChars).toLocaleString() +
    " 字符 ...]"
  );
}

export function buildPrompts(
  module: Module,
  action: Action,
  context: Record<string, unknown>
): { system: string; user: string } {
  switch (module) {
    // ============ ORIGINAL ============
    case "original":
      return buildOriginalPrompts(action, context);

    // ============ REWRITE ============
    case "rewrite":
      return buildRewritePrompts(action, context);

    // ============ ADAPT ============
    case "adapt":
      return buildAdaptPrompts(action, context);

    // ============ EVALUATE ============
    case "evaluate":
      return buildEvaluatePrompts(action, context);

    default:
      throw new Error(`Unknown module: ${module}`);
  }
}

// ─── ORIGINAL ────────────────────────────────────────────

function buildOriginalPrompts(
  action: Action,
  ctx: Record<string, unknown>
): { system: string; user: string } {
  switch (action) {
    case "outline": {
      const roughOutline = (ctx.roughOutline as string) || "";
      const synopsis = (ctx.synopsis as string) || "";
      const characters = (ctx.characters as { name: string; position: string; personality: string }[]) || [];
      const episodeDuration = (ctx.episodeDuration as number) || 15;
      const existingEpisodes = ctx.existingEpisodes as
        | { title: string; number: number }[]
        | undefined;
      const existingText = existingEpisodes?.length
        ? "\n已有集纲：\n" +
          existingEpisodes
            .map((e) => `第${e.number}集${e.title ? " · " + e.title : ""}`)
            .join("\n")
        : "";
      const charText = characters.length
        ? "\n人物档案：\n" +
          characters
            .map((c) => `- ${c.name}（${c.position}）：${c.personality || ""}`)
            .join("\n")
        : "";

      return {
        system: `你是一个专业的影视编剧。根据给出的故事梗概、人物设定和粗纲，生成详细的分集大纲。
每一集格式为：
第N集 · 标题
剧情梗概：2-3句话描述本集核心情节。

每集时长为${episodeDuration}分钟，请确保每集的情节量适配该时长。
集与集之间用空行分隔。只返回大纲内容，不要任何解释或前言。
${existingText ? "在已有集纲基础上继续编排，不要重复已有内容。" : "生成适合一季12集的完整分集大纲。"}`,
        user: [
          synopsis ? `故事梗概：${synopsis}` : "",
          charText,
          roughOutline ? `故事粗纲：${roughOutline}` : "请根据故事梗概和人物设定生成分集大纲",
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }

    case "script": {
      const episodeTitle = (ctx.episodeTitle as string) || "";
      const episodeNumber = (ctx.episodeNumber as number) || 1;
      const synopsis = (ctx.synopsis as string) || "";
      const characters = (ctx.characters as { name: string; position: string; personality: string }[]) || [];
      const episodeOutline = ctx.episodeOutline as { title: string; summary: string } | null | undefined;

      const charText = characters.length
        ? "人物档案：\n" +
          characters
            .map((c) => `- ${c.name}（${c.position}）：${c.personality || ""}`)
            .join("\n")
        : "";

      const outlineText = episodeOutline
        ? `本集大纲：${episodeOutline.title}\n${episodeOutline.summary}`
        : "";

      return {
        system: `你是一个专业的剧本作家。根据故事梗概、人物设定和本集大纲，撰写完整的剧本正文。
格式要求：
- 标准剧本格式：场次标题 + 场景描述 + 人物对白
- 对白格式：人物名：对白内容
- 场景描述使用【】或独立的叙述段落
- 每集长度约3000-5000字
- 确保人物性格与人物档案一致，不要偏离设定
只返回剧本正文，不要解释或说明。`,
        user: [
          synopsis ? `故事梗概：${synopsis}` : "",
          charText,
          outlineText,
          `请撰写第${episodeNumber}集${episodeTitle ? "《" + episodeTitle + "》" : ""}的完整剧本正文。`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      };
    }

    case "polish": {
      const content = (ctx.content as string) || "";
      return {
        system: `你是一个专业的文字编辑。请润色以下剧本文本，提升以下方面：
1. 语言流畅度和文学质感
2. 对白的自然度与人物腔调
3. 节奏与呼吸感（段落长短交替）
4. 保留原意、叙事风格和人物性格

只返回润色后的完整文本，不要包含任何解释或格式标记。`,
        user: content,
      };
    }

    case "synopsis": {
      const audience = (ctx.audience as string) || "";
      const genre = (ctx.genre as string) || "";
      const style = (ctx.style as string) || "";
      const setting = (ctx.setting as string) || "";
      const worldview = (ctx.worldview as string) || "";
      const highlight = (ctx.highlight as string) || "";
      return {
        system: `你是一个专业的影视编剧。根据给定的故事设定参数，撰写一段200-500字的核心故事梗概。
梗概要包含：开端背景、核心冲突、高潮转折、结局走向。语言要精炼、有画面感、有情感张力。
只返回梗概正文，不要任何前缀、解释或格式标记。`,
        user: [
          `目标受众：${audience}`,
          `类型题材：${genre}`,
          `风格元素：${style}`,
          `核心设定：${setting}`,
          worldview ? `世界观：${worldview}` : "",
          highlight ? `核心亮点：${highlight}` : "",
          "请根据以上设定撰写核心故事梗概。",
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }

    case "generate_character": {
      const name = (ctx.name as string) || "";
      const position = (ctx.position as string) || "";
      const age = (ctx.age as number) || 28;
      const personality = (ctx.personality as string) || "";
      const background = (ctx.background as string) || "";
      const synopsis = (ctx.synopsis as string) || "";
      return {
        system: `你是一个专业的人物设定顾问。为剧本角色补充和完善人物档案。
根据已有的姓名、定位、年龄、部分已知信息，以及故事整体梗概，生成完整的性格描写和人物背景。

返回格式（纯文本，不要JSON或标记）：
性格：[2-4句话的性格描写，包含内核、行为模式、情感弱点]
背景：[2-4句话的背景故事，包含出身、关键经历、与主线的关系]`,
        user: [
          synopsis ? `故事梗概：${synopsis}` : "",
          `人物姓名：${name || "待定"}`,
          `角色定位：${position || "待定"}`,
          `年龄：${age}岁`,
          personality ? `当前性格设定：${personality}` : "",
          background ? `当前背景设定：${background}` : "",
          "请根据故事梗概和以上信息完善此人物，确保人物设定与故事主线协调一致。",
        ]
          .filter(Boolean)
          .join("\n"),
      };
    }

    default:
      throw new Error(`Unknown action for original: ${action}`);
  }
}

// ─── REWRITE ─────────────────────────────────────────────

function buildRewritePrompts(
  action: Action,
  ctx: Record<string, unknown>
): { system: string; user: string } {
  switch (action) {
    case "detect_scenes": {
      const scriptText = truncateText((ctx.scriptText as string) || "");
      return {
        system: `你是一个专业的剧本结构分析专家。分析未经格式化或格式不规范的剧本原文，识别出场次边界。

"场次"的定义：在单一地点和连续时间内发生的完整叙事单元。识别依据包括但不限于：
1. 地标转换（如"场景：咖啡厅 日内"、"INT. COFFEE SHOP - DAY"）
2. 时间跳跃（"三天后"、"当日深夜"）
3. 人物上下场导致的焦点转移
4. 明显的叙事空行或分隔符
5. 语气或节奏的显著变化

请严格按以下JSON结构返回结果（不要包含markdown代码块标记）：
{
  "scenes": [
    { "id": "s1", "number": 1, "preview": "前60字预览（去除换行）..." }
  ]
}
每场preview取该场次开头约60字，若该场无文字则为空字符串。`,
        user: `请分析以下剧本原文，识别出所有场次边界，按JSON格式返回：\n\n${scriptText}`,
      };
    }

    case "optimize": {
      const sceneTitle = (ctx.sceneTitle as string) || "";
      const originalContent = (ctx.originalContent as string) || "";
      const dimensions = (ctx.dimensions as {
        key: string;
        label?: string;
        selected?: boolean;
        intensity?: number;
      }[]) || [];

      const dimText = dimensions
        .filter((d) => d.selected !== false)
        .map((d) => {
          const intensity = d.intensity || 2;
          const level =
            intensity === 1 ? "轻度" : intensity === 2 ? "中度" : "深度";
          return `- ${d.label || d.key}：${level}优化`;
        })
        .join("\n");

      return {
        system: `你是一个专业的剧本改写专家。根据指定的优化维度对剧本场次进行改写。

优化维度说明：
- 节奏（rhythm）：调整场次长短、信息密度与观众呼吸感
- 对白（dialogue）：优化台词风格、潜台词与人物腔调
- 人物（character）：增强人物弧光、动机逻辑与角色区分度
- 冲突（conflict）：提升戏剧张力、反转密度与悬念

${
  dimText
    ? "当前优化方向：\n" + dimText
    : "对所有维度进行适度优化"
}

只返回改写后的完整场次文本，保留原格式，不要任何解释或标记。`,
        user: `请改写以下场次：\n场次：${sceneTitle}\n\n原文：\n${originalContent}`,
      };
    }

    case "analyze_for_rewrite": {
      const scriptText = truncateText((ctx.scriptText as string) || "");
      return {
        system: `你是一个专业的剧本诊断专家。分析给定的剧本，判断哪些维度最需要优化。

维度说明：
- rhythm（节奏）：场次长短、信息密度与观众呼吸感
- dialogue（对白）：台词风格、潜台词与人物腔调
- character（人物）：人物弧光、动机逻辑与角色区分度
- conflict（冲突）：戏剧张力、反转密度与悬念

请严格按以下JSON结构返回（不要包含markdown代码块）：
{
  "dimensions": [
    { "key": "rhythm", "selected": true, "intensity": 2, "reason": "一句话理由" },
    { "key": "dialogue", "selected": false, "intensity": 2, "reason": "一句话理由" },
    { "key": "character", "selected": true, "intensity": 3, "reason": "一句话理由" },
    { "key": "conflict", "selected": true, "intensity": 2, "reason": "一句话理由" }
  ]
}
intensity: 1=轻度 2=中度 3=深度。只推荐确实有改进空间的维度，selected为true表示建议优化。`,
        user: `请分析以下剧本，推荐改写维度和深度：\n\n${scriptText}`,
      };
    }

    default:
      throw new Error(`Unknown action for rewrite: ${action}`);
  }
}

// ─── ADAPT ───────────────────────────────────────────────

function buildAdaptPrompts(
  action: Action,
  ctx: Record<string, unknown>
): { system: string; user: string } {
  switch (action) {
    case "detect_chapters": {
      const novelText = truncateText((ctx.novelText as string) || "");
      return {
        system: `你是一个专业的网文章节分析专家。分析网文原文，识别出章节边界。

识别依据（按优先级）：
1. 显式章节标题："第X章"、"Chapter X"、"第X回"、"卷X" 等
2. 卷/部/篇分隔标记
3. 以数字序号或特殊符号开头的独立行
4. "分割线"或明显的叙事重起位置

请严格按以下JSON结构返回（不要包含markdown代码块）：
{
  "chapters": [
    { "id": "ch1", "number": 1, "title": "章节标题", "wordCount": 数字 }
  ]
}
wordCount为该章节的估计中文字数。`,
        user: `请分析以下网文原文，识别出各章节边界，按JSON格式返回：\n\n${novelText}`,
      };
    }

    case "extract_characters": {
      const novelText = truncateText((ctx.novelText as string) || "");
      const chapters = ctx.chapters as
        | { id: string; number: number; title: string; wordCount: number }[]
        | undefined;
      const chapterInfo = chapters?.length
        ? `\n\n网文共有${chapters.length}章，总约${chapters.reduce((s, c) => s + c.wordCount, 0).toLocaleString()}字。`
        : "";

      return {
        system: `你是一个专业的网文人物分析专家。提取网文中所有的重要人物信息。

对每个人物提取以下字段：
- name: 人物姓名或主要称呼
- role: 角色定位，必须是以下之一："主角"、"第二主角"、"反派"、"重要配角"、"线索人物"、"路人"
- aliases: 其他称呼（绰号、尊称、化名等），用逗号分隔
- traits: 性格特征（2-3个关键词）
- appearance: 外貌描述、年龄感、标志性穿着（一句话）
- sourceChapters: 首次出场章节（如"第1章"）
- relationship: 与其他主要人物的关系（一句话）

请严格按以下JSON结构返回（不要包含markdown代码块）：
{
  "characters": [
    {
      "id": "c1",
      "name": "...",
      "role": "主角",
      "aliases": "...",
      "traits": "...",
      "appearance": "...",
      "sourceChapters": "第...章",
      "relationship": "..."
    }
  ]
}
按重要性排序，主角在前。只提取有名字或明确身份的人物，忽略路人甲。`,
        user: `请分析以下网文，提取所有重要人物：${chapterInfo}\n\n${novelText}`,
      };
    }

    case "adapt_chapter": {
      const chapterTitle = (ctx.chapterTitle as string) || "";
      const plotPoints = (ctx.plotPoints as string) || "";
      const sourceChapters = (ctx.sourceChapters as string) || "";
      const episodeDuration = (ctx.episodeDuration as number) || 15;
      const characters = (ctx.characters as {
        name: string;
        role: string;
        traits: string;
      }[]) || [];

      const charProfiles = characters.length
        ? "\n\n人物档案：\n" +
          characters
            .map(
              (c) =>
                `- ${c.name}（${c.role}）：${c.traits || ""}`
            )
            .join("\n")
        : "";

      const targetWords = episodeDuration * 150;

      return {
        system: `你是一个专业的网文改编编剧。将网文章节改编为影视剧本格式。

改编要求：
1. 保留原作的叙事风格与对白特色
2. 将网文叙述转为标准剧本格式：场次标题 + 场景描述 + 人物对白
3. 对白格式：人物名：对白内容
4. 合理增删——合并冗余叙述，补全视角转换
5. 单集时长为${episodeDuration}分钟，目标约${targetWords}字
${charProfiles}

只返回改编后的完整剧本正文，不要解释或说明。`,
        user: `请改编以下内容为剧本：\n章节：${chapterTitle}\n原文来源：${sourceChapters}\n情节要点：\n${plotPoints}`,
      };
    }

    case "polish": {
      const content = (ctx.content as string) || "";
      return {
        system: `你是一个专业的文字编辑。润色以下改编剧本文本，提升：
1. 语言的流畅度与文学质感
2. 对白的自然度和人物腔调
3. 节奏控制（段落长短交替，张弛有度）

只返回润色后的完整文本，不要解释或标记。`,
        user: content || "请润色以下文本",
      };
    }

    case "breakdown_chapters": {
      const novelChapters = (ctx.novelChapters as { number: number; title: string; wordCount: number }[]) || [];
      const characters = (ctx.characters as { name: string; role: string; traits: string }[]) || [];
      const chapterList = novelChapters.length
        ? novelChapters
            .map((c) => `第${c.number}章${c.title ? " " + c.title : ""}（${c.wordCount.toLocaleString()}字）`)
            .join("\n")
        : "未提供章节信息";
      const charList = characters.length
        ? characters.map((c) => `- ${c.name}（${c.role}）：${c.traits || ""}`).join("\n")
        : "未提供人物信息";
      return {
        system: `你是一个专业的网文改编编剧。根据原文章节信息和人物档案，生成改编为影视剧本的章节拆解方案。

每章改编章需合并多个相邻的原文小章节（通常5-10章合并为1改编章），并为每改编章定义：
- title: 改编章标题（3-8字）
- sourceChapters: 来源章节范围（如"第1-7章"）
- plotPoints: 核心情节要点（每行一条，2-4条）

请严格按以下JSON结构返回（不要包含markdown代码块）：
{
  "chapters": [
    { "number": 1, "title": "废柴崛起", "sourceChapters": "第1-7章", "plotPoints": "萧炎测试斗气失败\\n被纳兰嫣然退婚\\n立下三年之约\\n遇到药老" }
  ]
}
plotPoints中每条要点之间用\\n分隔。共生成6-10改编章，覆盖全部原文内容。`,
        user: `请根据以下信息生成改编章节拆解：\n\n原文章节：\n${chapterList}\n\n人物档案：\n${charList}`,
      };
    }

    default:
      throw new Error(`Unknown action for adapt: ${action}`);
  }
}

// ─── EVALUATE ────────────────────────────────────────────

function buildEvaluatePrompts(
  action: Action,
  ctx: Record<string, unknown>
): { system: string; user: string } {
  switch (action) {
    case "analyze": {
      const scriptText = truncateText((ctx.scriptText as string) || "");
      const dimensions = (ctx.dimensions as {
        key: string;
        weight: number;
      }[]) || [];

      const allDims = [
        { key: "structure", label: "结构完整性", benchmark: 70, desc: "起承转合、场次衔接、叙事逻辑" },
        { key: "character", label: "人物弧光", benchmark: 68, desc: "人物成长、动机清晰度、角色区分度" },
        { key: "dialogue", label: "对白质量", benchmark: 72, desc: "台词自然度、潜台词深度、人物腔调" },
        { key: "pacing", label: "节奏控制", benchmark: 70, desc: "信息密度、张弛有度、观众呼吸感" },
        { key: "conflict", label: "冲突设计", benchmark: 65, desc: "戏剧张力、反转密度、悬念设置" },
        { key: "market", label: "市场潜力", benchmark: 73, desc: "类型匹配度、受众规模、话题性" },
        { key: "compliance", label: "合规性", benchmark: 80, desc: "行业审查、内容红线、价值观" },
        { key: "originality", label: "原创性", benchmark: 68, desc: "设定新颖度、叙事手法、差异化" },
      ];

      const activeDims = dimensions.length > 0
        ? allDims.filter((d) => dimensions.some((ad) => ad.key === d.key))
        : allDims;

      const dimList = activeDims
        .map((d) => {
          const w = dimensions.find((ad) => ad.key === d.key)?.weight || 3;
          return `- ${d.label}（${d.desc}）：基准分${d.benchmark}，权重${w}/5`;
        })
        .join("\n");

      return {
        system: `你是一个专业的剧本评估AI。对剧本进行客观的多维度评分分析。

评估规则：
1. 每个维度独立评分，分数为0-100的整数
2. 基准分（benchmark）代表同类剧本平均水平
3. 评语需2-3段中文，不使用HTML标签
4. 评语包含：总体印象、亮点评析、薄弱环节及改进建议

待评估维度及基准：
${dimList}

请严格按以下JSON结构返回（不要包含markdown代码块）：
{
  "scores": [
    { "key": "structure", "label": "结构完整性", "score": 82, "benchmark": 70 },
    ...
  ],
  "summary": "综合评语（2-3段纯文本）..."
}`,
        user: `请评估以下剧本，按JSON格式返回评分与评语：\n\n${scriptText}`,
      };
    }

    case "recommend_dimensions": {
      const scriptText = truncateText((ctx.scriptText as string) || "");
      return {
        system: `你是一个专业的剧本评估顾问。快速浏览剧本，根据剧本类型和内容特点，推荐评估维度和权重。

可选维度：
- structure（结构完整性）：起承转合、场次衔接、叙事逻辑
- character（人物弧光）：人物成长、动机清晰度、区分度
- dialogue（对白质量）：台词自然度、潜台词、人物腔调
- pacing（节奏控制）：信息密度、张弛有度、观众呼吸感
- conflict（冲突设计）：戏剧张力、反转密度、悬念设置
- market（市场潜力）：类型匹配度、受众规模、话题性
- compliance（合规性）：行业审查、内容红线、价值观
- originality（原创性）：设定新颖度、叙事手法、差异化

请严格按以下JSON结构返回（不要包含markdown代码块）：
{
  "dimensions": [
    { "key": "structure", "enabled": true, "weight": 4 },
    { "key": "character", "enabled": true, "weight": 5 },
    ...
  ]
}
weight: 1-5整数，代表该维度的重要性。enabled: true表示建议开启该维度评估。`,
        user: `请分析以下剧本，推荐评估维度和权重：\n\n${scriptText}`,
      };
    }

    default:
      throw new Error(`Unknown action for evaluate: ${action}`);
  }
}
