import type { ModuleKey } from "../components/workbench/Workbench";

export interface ProjectSnapshot {
  id: string;
  name: string;
  module: ModuleKey;
  step: number;
  completed: boolean[];
  workbenchData: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "frame_projects";

function loadAll(): ProjectSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(projects: ProjectSnapshot[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch { /* quota exceeded */ }
}

export function listProjects(module?: ModuleKey): ProjectSnapshot[] {
  const all = loadAll();
  if (!module) return all.sort((a, b) => b.updatedAt - a.updatedAt);
  return all
    .filter((p) => p.module === module)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(id: string): ProjectSnapshot | undefined {
  return loadAll().find((p) => p.id === id);
}

export function saveProject(snapshot: ProjectSnapshot) {
  const all = loadAll();
  const idx = all.findIndex((p) => p.id === snapshot.id);
  snapshot.updatedAt = Date.now();
  if (idx >= 0) {
    all[idx] = snapshot;
  } else {
    snapshot.createdAt = Date.now();
    all.push(snapshot);
  }
  saveAll(all);
}

export function deleteProject(id: string) {
  const all = loadAll().filter((p) => p.id !== id);
  saveAll(all);
}

export function createProjectId(): string {
  return `p${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
