export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface AutomationNote {
  id: string;
  text: string;
  isPublic: boolean;
  createdAt: string;
}

export interface Automation {
  id: string;
  title: string;
  description: string;
  status: "not-started" | "in-progress" | "done";
  category: string;
  deadline: string | null;
  checklist: ChecklistItem[];
  notes: AutomationNote[];
  createdAt: string;
  updatedAt: string;
}

export interface AutomationsData {
  categories: string[];
  automations: Automation[];
}

export const INITIAL_DATA: AutomationsData = {
  categories: [],
  automations: [],
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getProgress(a: Automation): number {
  if (a.checklist.length === 0) return a.status === "done" ? 100 : 0;
  return Math.round(
    (a.checklist.filter((c) => c.completed).length / a.checklist.length) * 100
  );
}

const STORAGE_KEY = "yeda-automations-data";
const AUTH_KEY = "yeda-automations-auth";

export function loadData(): AutomationsData {
  if (typeof window === "undefined") return INITIAL_DATA;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return INITIAL_DATA;
}

export function saveData(data: AutomationsData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function checkAuth(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function setAuth(v: boolean) {
  if (typeof window === "undefined") return;
  if (v) sessionStorage.setItem(AUTH_KEY, "true");
  else sessionStorage.removeItem(AUTH_KEY);
}

export const PASSWORD = "067270";
