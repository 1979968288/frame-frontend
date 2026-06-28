interface Episode {
  number: number;
  title: string;
  content: string;
}

interface Scene {
  number: number;
  title: string;
  original: string;
  rewritten: string;
}

interface EvalScore {
  key: string;
  label: string;
  score: number;
  benchmark: number;
}

// ─── Generic download helper ──────────────────────────────

function download(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Script Episode Export ────────────────────────────────

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportScriptMarkdown(episodes: Episode[], title?: string) {
  const lines: string[] = [];
  if (title) lines.push(`# ${title}`, "");
  episodes.forEach((ep) => {
    const header = ep.title
      ? `## 第${ep.number}集 · ${ep.title}`
      : `## 第${ep.number}集`;
    lines.push(header, "");
    if (ep.content) {
      lines.push(ep.content.trim(), "");
    }
    lines.push("---", "");
  });
  download(
    `${title || "剧本"}.md`,
    lines.join("\n"),
    "text/markdown;charset=utf-8",
  );
}

export function exportScriptWord(episodes: Episode[], title?: string) {
  const header = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(title || "剧本")}</title>
<style>
  body { font-family: "SimSun", serif; line-height: 2; max-width: 720px; margin: 0 auto; padding: 40px; color: #222; }
  h1 { text-align: center; font-size: 22pt; margin-bottom: 32pt; }
  h2 { font-size: 16pt; margin-top: 24pt; margin-bottom: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 6pt; }
  p { text-indent: 2em; margin: 0 0 6pt 0; }
</style></head><body>`;
  const bodyLines: string[] = [];
  if (title) bodyLines.push(`<h1>${escapeHtml(title)}</h1>`);
  episodes.forEach((ep) => {
    const epTitle = ep.title
      ? `第${ep.number}集 · ${escapeHtml(ep.title)}`
      : `第${ep.number}集`;
    bodyLines.push(`<h2>${epTitle}</h2>`);
    if (ep.content) {
      ep.content
        .trim()
        .split(/\n\s*\n/)
        .filter(Boolean)
        .forEach((para) => {
          bodyLines.push(`<p>${escapeHtml(para.trim())}</p>`);
        });
    }
  });
  download(
    `${title || "剧本"}.doc`,
    header + bodyLines.join("\n") + "</body></html>",
    "application/msword",
  );
}

export function exportScriptFdx(episodes: Episode[], title?: string) {
  const paragraphs = episodes.flatMap((ep) => {
    const parts: string[] = [];
    parts.push(`<Paragraph Type="Scene Heading"><Text>第${ep.number}集${ep.title ? " · " + ep.title : ""}</Text></Paragraph>`);
    if (ep.content) {
      ep.content
        .trim()
        .split(/\n/)
        .filter(Boolean)
        .forEach((line) => {
          const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          if (/^[^：:]{1,6}[：:]/.test(line)) {
            parts.push(`<Paragraph Type="Character"><Text>${escaped}</Text></Paragraph>`);
          } else if (/^[（(]|[）)]$/.test(line) || line.length < 20) {
            parts.push(`<Paragraph Type="Parenthetical"><Text>${escaped}</Text></Paragraph>`);
          } else {
            parts.push(`<Paragraph Type="Action"><Text>${escaped}</Text></Paragraph>`);
          }
        });
    }
    return parts;
  });

  const fdx = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDocument xmlns="http://www.finaldraft.com/schema">
  <Content>
${paragraphs.join("\n")}
  </Content>
</FinalDocument>`;

  download(`${title || "剧本"}.fdx`, fdx, "application/xml;charset=utf-8");
}

export function exportScriptPDF() {
  window.print();
}

// ─── Rewrite Comparison Export ────────────────────────────

export function exportRewriteMarkdown(scenes: Scene[], title?: string) {
  const lines: string[] = [];
  if (title) lines.push(`# ${title} · 改写对比`, "");

  scenes.forEach((sc) => {
    lines.push(`## 第${sc.number}场 · ${sc.title || ""}`, "");
    lines.push("### 原文", "", sc.original || "（无）", "");
    lines.push("### 改写", "", sc.rewritten || "（未改写）", "");
    lines.push("---", "");
  });

  const changed = scenes.filter((s) => s.rewritten).length;
  lines.push(
    "",
    `> 统计：共 ${scenes.length} 场，已改写 ${changed} 场`,
  );

  download(
    `${title || "改写对比"}.md`,
    lines.join("\n"),
    "text/markdown;charset=utf-8",
  );
}

export function exportRewriteWord(scenes: Scene[], title?: string) {
  const changed = scenes.filter((s) => s.rewritten).length;
  const header = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(title || "改写对比")}</title>
<style>
  body { font-family: "SimSun", serif; line-height: 1.8; max-width: 720px; margin: 0 auto; padding: 40px; color: #222; }
  h1 { text-align: center; font-size: 20pt; margin-bottom: 24pt; }
  h2 { font-size: 15pt; margin-top: 24pt; margin-bottom: 10pt; color: #555; }
  h3 { font-size: 12pt; margin-bottom: 8pt; }
  .original { background: #f9f9f9; padding: 12pt; margin-bottom: 12pt; border-left: 3pt solid #ccc; }
  .rewritten { background: #fffbf0; padding: 12pt; border-left: 3pt solid #c8960c; }
  .stats { margin-top: 24pt; padding: 12pt; background: #f0f0f0; font-size: 10pt; }
</style></head><body>`;
  const bodyLines: string[] = [];
  if (title) bodyLines.push(`<h1>${escapeHtml(title)} · 改写对比报告</h1>`);
  scenes.forEach((sc) => {
    bodyLines.push(`<h2>第${sc.number}场 · ${escapeHtml(sc.title || "")}</h2>`);
    bodyLines.push(`<h3>原文</h3><div class="original"><p>${escapeHtml(sc.original || "（无）")}</p></div>`);
    bodyLines.push(`<h3>改写</h3><div class="rewritten"><p>${escapeHtml(sc.rewritten || "（未改写）")}</p></div>`);
  });
  bodyLines.push(`<div class="stats">共 ${scenes.length} 场 | 已改写 ${changed} 场</div>`);
  download(
    `${title || "改写对比"}.doc`,
    header + bodyLines.join("\n") + "</body></html>",
    "application/msword",
  );
}

export function exportRewriteFdx(scenes: Scene[]) {
  const paragraphs = scenes.flatMap((sc) => {
    const parts: string[] = [];
    parts.push(`<Paragraph Type="Scene Heading"><Text>第${sc.number}场 · ${sc.title || ""}</Text></Paragraph>`);
    if (sc.rewritten) {
      sc.rewritten
        .trim()
        .split(/\n/)
        .filter(Boolean)
        .forEach((line) => {
          const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          if (/^[^：:]{1,6}[：:]/.test(line)) {
            parts.push(`<Paragraph Type="Character"><Text>${escaped}</Text></Paragraph>`);
          } else {
            parts.push(`<Paragraph Type="Action"><Text>${escaped}</Text></Paragraph>`);
          }
        });
    } else if (sc.original) {
      sc.original
        .trim()
        .split(/\n/)
        .filter(Boolean)
        .forEach((line) => {
          parts.push(`<Paragraph Type="Action"><Text>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Text></Paragraph>`);
        });
    }
    return parts;
  });

  download(
    "rewrite.fdx",
    `<?xml version="1.0" encoding="UTF-8"?>\n<FinalDocument xmlns="http://www.finaldraft.com/schema">\n  <Content>\n${paragraphs.join("\n")}\n  </Content>\n</FinalDocument>`,
    "application/xml;charset=utf-8",
  );
}

// ─── Evaluate Report Export ───────────────────────────────

export function exportEvalMarkdown(
  scores: EvalScore[],
  summary: string,
  scriptWordCount: number,
) {
  const overall = scores.length
    ? Math.round(scores.reduce((s, d) => s + d.score, 0) / scores.length)
    : 0;
  const above = scores.filter((d) => d.score >= d.benchmark).length;

  const lines: string[] = [
    "# 剧本评估报告",
    "",
    `> FRAME · ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## 概览",
    "",
    `| 指标 | 值 |`,
    `|------|----|`,
    `| 综合评分 | ${overall} |`,
    `| 评估维度 | ${scores.length} |`,
    `| 超过基准 | ${above} / ${scores.length} |`,
    `| 总字数 | ${scriptWordCount.toLocaleString()} |`,
    "",
    "## 维度评分",
    "",
    "| 维度 | 得分 | 基准 | 差值 |",
    "|------|------|------|------|",
    ...scores.map((d) => {
      const diff = d.score - d.benchmark;
      return `| ${d.label} | ${d.score} | ${d.benchmark} | ${diff >= 0 ? "+" + diff : String(diff)} |`;
    }),
    "",
    "## AI 综合评语",
    "",
    summary,
  ];

  download(
    "剧本评估报告.md",
    lines.join("\n"),
    "text/markdown;charset=utf-8",
  );
}

export function exportEvalPDF() {
  window.print();
}
