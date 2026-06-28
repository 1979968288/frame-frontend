import { useState, useEffect, useCallback } from "react";
import type { ModuleKey } from "./workbench/Workbench";
import type { ProjectSnapshot } from "../lib/projectStore";
import { listProjects, deleteProject, createProjectId } from "../lib/projectStore";
import NameDialog from "./NameDialog";

const MODULE_LABELS: Record<ModuleKey, string> = {
  original: "剧本原创",
  rewrite: "剧本改写",
  adapt: "网文改编",
  evaluate: "剧本评估",
};

const MODULE_STEPS: Record<ModuleKey, string[]> = {
  original: ["故事梗概", "人物小传", "分集大纲", "剧本正文"],
  rewrite: ["剧本导入", "改写方向", "深度优化", "对比导出"],
  adapt: ["网文导入", "人物梳理", "章节拆解", "剧本生成"],
  evaluate: ["剧本上传", "维度选择", "AI 分析", "报告导出"],
};

const MODULE_ICONS: Record<ModuleKey, string> = {
  original: "✧",
  rewrite: "↻",
  adapt: "↗",
  evaluate: "◉",
};

interface Props {
  module: ModuleKey;
  onNewProject: () => void;
  onOpenProject: (project: ProjectSnapshot) => void;
  onBack: () => void;
}

export default function ProjectRepo({ module, onNewProject, onOpenProject, onBack }: Props) {
  const [filter, setFilter] = useState<ModuleKey | "all">(module);
  const [projects, setProjects] = useState<ProjectSnapshot[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSnapshot | null>(null);

  const refresh = useCallback(() => {
    setProjects(listProjects(filter === "all" ? undefined : filter));
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = (name: string) => {
    setDialogOpen(false);
    const id = createProjectId();
    const snapshot: ProjectSnapshot = {
      id,
      name,
      module,
      step: 0,
      completed: [false, false, false, false],
      workbenchData: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onOpenProject(snapshot);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id);
    setDeleteTarget(null);
    refresh();
  };

  const filtered = filter === "all"
    ? projects
    : projects.filter((p) => p.module === (filter as ModuleKey));

  const filterTabs: (ModuleKey | "all")[] = ["all", "original", "rewrite", "adapt", "evaluate"];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-warm-cream)" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center shrink-0"
        style={{
          height: "64px",
          padding: "0 80px",
          borderBottom: "1px solid var(--color-mist)",
          background: "var(--color-warm-cream)",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center cursor-pointer bg-transparent border-none"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--color-mid)",
            gap: "6px",
            padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回首页
        </button>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            color: "var(--color-charcoal)",
            fontWeight: 500,
          }}
        >
          项目储存库
        </span>
      </header>

      <main
        className="flex-1"
        style={{ padding: "48px 80px 96px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}
      >
        {/* New project card — always on top */}
        <div
          onClick={() => setDialogOpen(true)}
          className="cursor-pointer transition-all duration-200"
          style={{
            borderRadius: "var(--radius-md)",
            background: "var(--color-paper)",
            border: "2px dashed var(--color-accent-veil)",
            padding: "28px 32px",
            marginBottom: "32px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent)";
            e.currentTarget.style.background = "var(--color-accent-whisper)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-accent-veil)";
            e.currentTarget.style.background = "var(--color-paper)";
          }}
        >
          <div className="flex items-center" style={{ gap: "14px" }}>
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-accent)",
                color: "var(--color-paper)",
                fontSize: "20px",
                fontWeight: 300,
              }}
            >
              +
            </span>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "var(--color-ink)",
                  marginBottom: "2px",
                }}
              >
                新建项目
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  color: "var(--color-mid)",
                }}
              >
                创建一个新的{MODULE_LABELS[module]}项目
              </div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex" style={{ gap: "6px", marginBottom: "28px", flexWrap: "wrap" }}>
          {filterTabs.map((tab) => {
            const active = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className="cursor-pointer transition-all duration-150"
                style={{
                  height: "32px",
                  padding: "0 16px",
                  borderRadius: "var(--radius-sm)",
                  background: active ? "var(--color-accent-whisper)" : "transparent",
                  border: active ? "1px solid var(--color-accent)" : "1px solid var(--color-mist)",
                  color: active ? "var(--color-accent-deep)" : "var(--color-mid)",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  letterSpacing: "0.02em",
                }}
              >
                {tab === "all" ? "全部" : MODULE_LABELS[tab as ModuleKey]}
              </button>
            );
          })}
        </div>

        {/* Project list */}
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              padding: "80px 32px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                color: "var(--color-mid)",
                marginBottom: "8px",
              }}
            >
              还没有项目
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--color-mid)",
                opacity: 0.7,
              }}
            >
              点击上方"新建项目"开始创作
            </p>
          </div>
        ) : (
          <div className="flex flex-col" style={{ gap: "8px" }}>
            {filtered.map((proj) => {
              const steps = MODULE_STEPS[proj.module];
              const stepLabel = steps[proj.step] ?? "";
              const dateStr = new Date(proj.updatedAt).toLocaleDateString("zh-CN", {
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={proj.id}
                  className="group flex items-center cursor-pointer transition-all duration-150"
                  onClick={() => onOpenProject(proj)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-paper)",
                    border: "1px solid var(--color-mist)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "var(--shadow-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-accent-whisper)",
                      color: "var(--color-accent-deep)",
                      fontSize: "18px",
                    }}
                  >
                    {MODULE_ICONS[proj.module]}
                  </span>
                  <div style={{ marginLeft: "14px", minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "var(--color-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {proj.name}
                    </div>
                    <div className="flex items-center" style={{ gap: "12px", marginTop: "3px" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                          color: "var(--color-mid)",
                        }}
                      >
                        {MODULE_LABELS[proj.module]}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                          color: "var(--color-mid)",
                        }}
                      >
                        {dateStr}
                      </span>
                      {stepLabel && (
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "11px",
                            color: "var(--color-accent-deep)",
                          }}
                        >
                          第{proj.step + 1}步 · {stepLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(proj);
                    }}
                    className="ml-auto opacity-0 group-hover:opacity-100 cursor-pointer bg-transparent border-none transition-opacity duration-150"
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-mid)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--color-accent-whisper)";
                      e.currentTarget.style.color = "var(--color-accent-deep)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--color-mid)";
                    }}
                    title="删除项目"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create dialog */}
      <NameDialog
        open={dialogOpen}
        title="新建项目"
        defaultValue={`未命名${MODULE_LABELS[module]}`}
        onConfirm={handleCreate}
        onCancel={() => setDialogOpen(false)}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "360px",
              padding: "32px",
              background: "var(--color-paper)",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "18px",
                fontWeight: 500,
                color: "var(--color-ink)",
                margin: "0 0 8px",
              }}
            >
              确认删除
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "var(--color-mid)",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              删除后无法恢复。确定要删除"{deleteTarget.name}"？
            </p>
            <div className="flex" style={{ gap: "8px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  height: "36px",
                  padding: "0 20px",
                  background: "transparent",
                  color: "var(--color-charcoal)",
                  border: "1px solid var(--color-mist)",
                  borderRadius: "var(--radius-none)",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  height: "36px",
                  padding: "0 20px",
                  background: "var(--color-ink)",
                  color: "var(--color-paper)",
                  border: "1px solid var(--color-ink)",
                  borderRadius: "var(--radius-none)",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
