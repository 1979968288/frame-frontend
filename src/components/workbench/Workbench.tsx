import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import { getApiKey, setApiKey } from "../../lib/api";
import StepNav from "./StepNav";
import SearchModal from "./SearchModal";
import SynopsisStep from "./SynopsisStep";
import CharacterStep from "./CharacterStep";
import OutlineStep from "./OutlineStep";
import ScriptStep from "./ScriptStep";
import RewriteImportStep from "./rewrite/ImportStep";
import RewriteDirectionStep from "./rewrite/DirectionStep";
import RewriteOptimizeStep from "./rewrite/OptimizeStep";
import RewriteExportStep from "./rewrite/ExportStep";
import AdaptImportStep from "./adapt/ImportStep";
import AdaptCharacterStep from "./adapt/CharacterStep";
import AdaptBreakdownStep from "./adapt/BreakdownStep";
import AdaptGenerateStep from "./adapt/GenerateStep";
import EvaluateUploadStep from "./evaluate/UploadStep";
import EvaluateDimensionStep from "./evaluate/DimensionStep";
import EvaluateAnalysisStep from "./evaluate/AnalysisStep";
import EvaluateReportStep from "./evaluate/ReportStep";
import type { ProjectSnapshot } from "../../lib/projectStore";

export type ModuleKey = "original" | "rewrite" | "adapt" | "evaluate";

interface Props {
  onExit: () => void;
  initialModule: ModuleKey;
  projectId?: string;
  initialSnapshot?: ProjectSnapshot | null;
}

const MODULE_STEPS: Record<ModuleKey, string[]> = {
  original: ["故事梗概", "人物小传", "分集大纲", "剧本正文"],
  rewrite: ["剧本导入", "改写方向", "深度优化", "对比导出"],
  adapt: ["网文导入", "人物梳理", "章节拆解", "剧本生成"],
  evaluate: ["剧本上传", "维度选择", "AI 分析", "报告导出"],
};

export default function Workbench({ onExit, initialModule, projectId, initialSnapshot }: Props) {
  const snap = initialSnapshot ?? null;
  const [projectName] = useState(snap?.name ?? "");
  const [module, setModule] = useState<ModuleKey>(snap?.module ?? initialModule);
  const [step, setStep] = useState(snap?.step ?? 0);
  const [completed, setCompleted] = useState<boolean[]>(snap?.completed ?? [false, false, false, false]);
  const [workbenchData, setWorkbenchData] = useState<Record<string, unknown>>(snap?.workbenchData ?? {});
  const [apiKey, setApiKeyState] = useState(() => getApiKey());
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: Ctrl+F / Cmd+F for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const handleSearchNavigate = useCallback((_targetModule: ModuleKey, stepIndex: number, itemId: string) => {
    setStep(stepIndex);
    setWorkbenchData((prev) => ({ ...prev, _jumpToItem: itemId }));
  }, []);

  const handleExit = useCallback(() => {
    onExit();
  }, [onExit]);

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    setApiKeyState(key);
  };

  const updateData = (patch: Record<string, unknown>) => {
    setWorkbenchData((prev) => ({ ...prev, ...patch }));
  };

  const steps = MODULE_STEPS[module];

  const handleStepComplete = () => {
    setCompleted((prev) => {
      const next = [...prev];
      next[step] = true;
      return next;
    });
    if (step < steps.length - 1) setStep(step + 1);
  };

  return (
    <div
      className="flex w-screen h-screen overflow-hidden"
      style={{ background: "var(--color-warm-cream)" }}
    >
      <Sidebar
        active={module}
        onExit={handleExit}
        apiKey={apiKey}
        onSetApiKey={handleSetApiKey}
      />

      <main
        className="flex-1 flex flex-col h-screen overflow-hidden"
        style={{ minWidth: 0 }}
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
          <div className="flex items-center" style={{ gap: "10px" }}>
            {projectName ? (
              <>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--color-ink)",
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {projectName}
                </span>
                <span style={{ color: "var(--color-mist)" }}>/</span>
              </>
            ) : (
              <>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--color-mid)",
                  }}
                >
                  工作台
                </span>
                <span style={{ color: "var(--color-mist)" }}>/</span>
              </>
            )}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--color-ink)",
              }}
            >
              {MODULE_LABELS[module]}
            </span>
          </div>

          <div className="ml-auto flex items-center" style={{ gap: "12px" }}>
            <button
              type="button"
              onClick={onExit}
              className="cursor-pointer border"
              style={{
                height: "30px",
                padding: "0 14px",
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                borderColor: "var(--color-mist)",
                color: "var(--color-charcoal)",
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                letterSpacing: "0.04em",
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
              项目选择
            </button>
            <button
              type="button"
              aria-label="搜索"
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center cursor-pointer bg-transparent border-none"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                color: "var(--color-charcoal)",
                transition: "background 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-accent-whisper)";
                e.currentTarget.style.color = "var(--color-accent-deep)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-charcoal)";
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div style={{ padding: "40px 80px 96px", maxWidth: "1800px", margin: "0 auto", width: "100%" }}>
            <StepNav
              steps={steps}
              current={step}
              completed={completed}
              onSelect={setStep}
            />

            {module === "original" && step === 0 && (
              <SynopsisStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "original" && step === 1 && (
              <CharacterStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "original" && step === 2 && (
              <OutlineStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "original" && step === 3 && (
              <ScriptStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}

            {module === "rewrite" && step === 0 && (
              <RewriteImportStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "rewrite" && step === 1 && (
              <RewriteDirectionStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "rewrite" && step === 2 && (
              <RewriteOptimizeStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "rewrite" && step === 3 && (
              <RewriteExportStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}

            {module === "adapt" && step === 0 && (
              <AdaptImportStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "adapt" && step === 1 && (
              <AdaptCharacterStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "adapt" && step === 2 && (
              <AdaptBreakdownStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "adapt" && step === 3 && (
              <AdaptGenerateStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}

            {module === "evaluate" && step === 0 && (
              <EvaluateUploadStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "evaluate" && step === 1 && (
              <EvaluateDimensionStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "evaluate" && step === 2 && (
              <EvaluateAnalysisStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
            {module === "evaluate" && step === 3 && (
              <EvaluateReportStep onComplete={handleStepComplete} data={workbenchData} updateData={updateData} />
            )}
          </div>
        </div>
      </main>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        workbenchData={workbenchData}
        onNavigate={handleSearchNavigate}
      />
    </div>
  );
}

const MODULE_LABELS: Record<ModuleKey, string> = {
  original: "剧本原创",
  rewrite: "剧本改写",
  adapt: "网文改编",
  evaluate: "剧本评估",
};
