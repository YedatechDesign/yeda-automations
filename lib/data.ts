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

export type Urgency = "critical" | "high" | "medium" | "low";

export interface Automation {
  id: string;
  title: string;
  description: string;
  status: "not-started" | "in-progress" | "done";
  urgency: Urgency;
  category: string;
  deadline: string | null;
  manualProgress: number | null;
  checklist: ChecklistItem[];
  notes: AutomationNote[];
  createdAt: string;
  updatedAt: string;
}

export interface AutomationsData {
  categories: string[];
  automations: Automation[];
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getProgress(a: Automation): number {
  if (a.manualProgress !== null && a.manualProgress !== undefined) return a.manualProgress;
  if (a.checklist.length === 0) return a.status === "done" ? 100 : 0;
  return Math.round(
    (a.checklist.filter((c) => c.completed).length / a.checklist.length) * 100
  );
}

const STORAGE_KEY = "yeda-automations-data-v2";
const AUTH_KEY = "yeda-automations-auth";
const THEME_KEY = "yeda-automations-theme";

export const INITIAL_DATA: AutomationsData = {
  categories: ["Platforms", "Integrations"],
  automations: [
    {
      id: "auto-lms-dashboard",
      title: "LMS Statistics Dashboard",
      description:
        "Dashboard with real-time statistics from the LMS. The platform is built and deployed at automations.yedalms.io. Need to fix pagination, verify displayed statistics, review Excel export data, and test on the Yeda Website test college to confirm data updates correctly in real time.",
      status: "in-progress",
      urgency: "high",
      category: "Platforms",
      deadline: null,
      manualProgress: null,
      checklist: [
        { id: "lms-1", text: "Fix pagination component", completed: false },
        { id: "lms-2", text: "Verify which statistics are displayed correctly", completed: false },
        { id: "lms-3", text: "Review data shown when Excel is downloaded", completed: false },
        { id: "lms-4", text: "Test on Yeda Website test college — confirm real-time data updates", completed: false },
      ],
      notes: [],
      createdAt: "2026-04-08T10:00:00.000Z",
      updatedAt: "2026-04-08T10:00:00.000Z",
    },
    {
      id: "auto-homework",
      title: "Homework Platform Migration",
      description:
        "Existing homework platform at yedauto.com/webhook needs to be migrated to the new college automations platform. The homework system is functional but needs to be integrated into the unified automation suite.",
      status: "in-progress",
      urgency: "medium",
      category: "Platforms",
      deadline: null,
      manualProgress: null,
      checklist: [
        { id: "hw-1", text: "Audit current homework platform features and data", completed: false },
        { id: "hw-2", text: "Design migration plan for data and workflows", completed: false },
        { id: "hw-3", text: "Migrate homework functionality to new platform", completed: false },
        { id: "hw-4", text: "Test migrated features end-to-end", completed: false },
        { id: "hw-5", text: "Switch over and deprecate old platform", completed: false },
      ],
      notes: [],
      createdAt: "2026-04-08T10:01:00.000Z",
      updatedAt: "2026-04-08T10:01:00.000Z",
    },
    {
      id: "auto-sales-platform",
      title: "Automations Sales Platform",
      description:
        "Standalone platform to sell automations — currently at yedatechdesign.github.io/yedauto. Need to finish the design, review all automation listings, add a chatbot, and connect a custom domain.",
      status: "in-progress",
      urgency: "medium",
      category: "Platforms",
      deadline: null,
      manualProgress: null,
      checklist: [
        { id: "sp-1", text: "Finish and polish design across all pages", completed: false },
        { id: "sp-2", text: "Review and update all automation descriptions", completed: false },
        { id: "sp-3", text: "Add chatbot integration", completed: false },
        { id: "sp-4", text: "Connect custom domain", completed: false },
      ],
      notes: [],
      createdAt: "2026-04-08T10:02:00.000Z",
      updatedAt: "2026-04-08T10:02:00.000Z",
    },
    {
      id: "auto-targetbob",
      title: "TargetBob — Chat & Call Summaries",
      description:
        "Send short summaries of chats and calls from TargetBob to Alexia via LeadManager. So far only the required fields have been added in TargetBob itself — the rest of the integration is not done yet.",
      status: "not-started",
      urgency: "high",
      category: "Integrations",
      deadline: null,
      manualProgress: null,
      checklist: [
        { id: "tb-1", text: "Add required fields in TargetBob", completed: true },
        { id: "tb-2", text: "Build LeadManager integration to receive data", completed: false },
        { id: "tb-3", text: "Create summary generation logic for chats", completed: false },
        { id: "tb-4", text: "Create summary generation logic for calls", completed: false },
        { id: "tb-5", text: "Send summaries to Alexia via LeadManager", completed: false },
        { id: "tb-6", text: "Test full flow end-to-end", completed: false },
      ],
      notes: [],
      createdAt: "2026-04-08T10:03:00.000Z",
      updatedAt: "2026-04-08T10:03:00.000Z",
    },
  ],
};

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

export function loadTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "light";
}

export function saveTheme(t: "dark" | "light") {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, t);
}

export const PASSWORD = "067270";

export async function fetchServerData(): Promise<AutomationsData> {
  try {
    const res = await fetch("/api/data", { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {
    // fallback to localStorage
  }
  return loadData();
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveDataWithSync(data: AutomationsData, isLoggedIn: boolean) {
  saveData(data);
  if (!isLoggedIn) return;
  // Debounce server saves to avoid spamming during slider drags
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-auth": PASSWORD },
      body: JSON.stringify(data),
    }).catch(() => {});
  }, 500);
}

export const URGENCY_ORDER: Record<Urgency, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
