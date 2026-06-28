import { useState } from "react";
import Navbar from "./components/Navbar";
import ModuleCards from "./components/ModuleCards";
import ScriptGallery from "./components/ScriptGallery";
import ProjectRepo from "./components/ProjectRepo";
import Workbench from "./components/workbench/Workbench";
import type { ModuleKey } from "./components/workbench/Workbench";
import type { ProjectSnapshot } from "./lib/projectStore";
import { saveProject } from "./lib/projectStore";

type View = "home" | "project-repo" | "workbench";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [pendingModule, setPendingModule] = useState<ModuleKey>("original");
  const [editingProject, setEditingProject] = useState<ProjectSnapshot | null>(null);

  // From home → project-repo
  const handleModuleSelect = (module: ModuleKey) => {
    setPendingModule(module);
    setEditingProject(null);
    setView("project-repo");
  };

  // From project-repo → workbench (new project)
  const handleNewProject = () => {
    setEditingProject(null);
    setView("workbench");
  };

  // From project-repo → workbench (open existing)
  const handleOpenProject = (project: ProjectSnapshot) => {
    setEditingProject(project);
    setView("workbench");
  };

  // From workbench → project-repo (current module)
  const handleBackToRepo = () => {
    setView("project-repo");
  };

  // From workbench → project-repo (different module via sidebar)
  const handleNavigateToRepo = (module: ModuleKey) => {
    setPendingModule(module);
    setView("project-repo");
  };

  // From workbench → project-repo (with save)
  const handleSaveAndBack = (snapshot: ProjectSnapshot) => {
    saveProject(snapshot);
    setView("project-repo");
  };

  // From project-repo → home
  const handleBackToHome = () => {
    setView("home");
  };

  if (view === "project-repo") {
    return (
      <ProjectRepo
        module={pendingModule}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        onBack={handleBackToHome}
      />
    );
  }

  if (view === "workbench") {
    return (
      <Workbench
        onExit={handleBackToRepo}
        onNavigateTo={handleNavigateToRepo}
        initialModule={pendingModule}
        projectId={editingProject?.id}
        initialSnapshot={editingProject}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-warm-cream)" }}
    >
      <Navbar />

      <section
        className="w-full flex flex-col items-center"
        style={{
          paddingTop: "clamp(140px, 18vh, 200px)",
          paddingBottom: "var(--space-3xl)",
          paddingLeft: "var(--space-lg)",
          paddingRight: "var(--space-lg)",
        }}
      >
        <h1
          className="text-center font-light italic leading-[1.05] tracking-[-1px] m-0 max-w-[700px]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 5.5vw, 4rem)",
            color: "var(--color-ink)",
          }}
        >
          让AI辅助您孵化出
          <br />
          最具创意的作品
        </h1>

        <p
          className="text-center mt-[20px] mx-0 mb-0 max-w-[500px]"
          style={{
            fontSize: "clamp(0.95rem, 1.5vw, 1.0625rem)",
            color: "var(--color-charcoal)",
            lineHeight: 1.65,
          }}
        >
          从灵感到成片，Frame 为每一个故事注入专业级的AI创作力
        </p>

        <div
          className="w-[48px] h-[2px] mt-[36px]"
          style={{ background: "var(--color-accent)" }}
        />

        <div className="w-full mt-[64px]" style={{ maxWidth: "var(--width-max)" }}>
          <ModuleCards onSelect={handleModuleSelect} />
        </div>
      </section>

      <section
        className="w-full"
        style={{
          padding: "var(--space-3xl) var(--space-lg)",
          borderTop: "1px solid var(--color-mist)",
        }}
      >
        <ScriptGallery />
      </section>

      <footer
        className="w-full text-center py-[40px]"
        style={{
          borderTop: "1px solid var(--color-mist)",
          color: "var(--color-mid)",
          fontSize: "13px",
        }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>Frame</span>
        <span className="mx-[8px] opacity-30">—</span>
        用AI重新定义剧本创作
      </footer>
    </div>
  );
}
