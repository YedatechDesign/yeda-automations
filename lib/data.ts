/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export type Status = "new" | "in-progress" | "done";
export type Urgency = "critical" | "high" | "medium" | "low";
export type Role = "viewer" | "alexey" | "kateryna";

export interface TaskNote {
  id: string;
  text: string;
  author: Role; // who wrote it ("alexey" | "kateryna")
  createdAt: string;
}

export interface TaskLink {
  id: string;
  label: string;
  url: string;
}

export interface Task {
  id: string;
  emoji: string; // leading emoji — every title starts with one
  title: string;
  description: string;
  status: Status;
  urgency: Urgency;
  color: string | null; // custom accent color (hex) or null for default
  progress: number; // 0-100, set manually with the slider
  links: TaskLink[];
  waitingPerson: string; // who we are waiting on ("" if none)
  waitingWhat: string; // what they need to do ("" if none)
  notes: TaskNote[];
  createdAt: string;
  updatedAt: string;
}

export interface Credential {
  id: string;
  name: string;
  description: string; // short description of the platform
  url: string; // opens in a new tab
  login: string; // "" if none
  password: string; // "" if none
}

export interface TasksData {
  // display order === array order; reordering mutates the array
  tasks: Task[];
  credentials: Credential[]; // "Пароли" tab — visible to logged-in roles only
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Passwords tab seed — shown until the stored blob has its own credentials list.
export const INITIAL_CREDENTIALS: Credential[] = [
  {
    id: "automations-yedalms",
    name: "Automations YedaLMS",
    description:
      "Платформа для управления автоматизациями для колледжей: дашборд + автоматизация домашних заданий. Супер-админ: создание колледжей; клик по колледжу открывает превью платформы глазами админа колледжа.",
    url: "https://automations.yedalms.io",
    login: "design@yedatech.io",
    password: "Yeda2026",
  },
  {
    id: "dscope-dashboard",
    name: "Dscope - дашборд лидов",
    description: "Дашборд лидов Dscope.",
    url: "https://targetbob-dashboard.vercel.app",
    login: "alexey",
    password: "",
  },
];

// Map any legacy "waiting" status (removed in favour of the waiting-for field) to "in-progress";
// seed credentials when the stored data has none yet.
export function normalizeData(d: TasksData): TasksData {
  return {
    tasks: (d.tasks ?? []).map((t) =>
      (t.status as string) === "waiting" ? { ...t, status: "in-progress" as Status } : t
    ),
    credentials: d.credentials ?? INITIAL_CREDENTIALS,
  };
}

export const URGENCY_ORDER: Record<Urgency, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/* ------------------------------------------------------------------ */
/*  Initial data — REPLACE the tasks below with the real task list    */
/* ------------------------------------------------------------------ */
const T = "2026-06-13T09:00:00.000Z";

export const INITIAL_DATA: TasksData = {
  tasks: [
    {
      id: "dscope", emoji: "🌐", title: "Dscope",
      description: "- Routes / titles / sitemap (Alon sent instructions)\n- Case studies\n- Dashboard with statistics from all agents on the clients' sites",
      status: "in-progress", urgency: "medium", color: null, progress: 30,
      links: [], waitingPerson: "", waitingWhat: "",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "callcenter", emoji: "📞", title: "Call Center",
      description: "Twilio - check that the personal account information is approved, then buy the numbers.",
      status: "new", urgency: "medium", color: null, progress: 10,
      links: [], waitingPerson: "", waitingWhat: "",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "abutable", emoji: "💳", title: "Abu Table (Seva)",
      description: "Create a payment page, redirect to the Yeda course site, and after payment grant the student access through the YedaLMS API.\n\nThe page is ready; the connection to the YedaLMS API is not done yet.\nThe bit is still not available after signing the contract with Tranzila - on 14.06 the bot is supposed to appear on the page.",
      status: "in-progress", urgency: "high", color: null, progress: 70,
      links: [{ id: "l-abu", label: "course.abutable.com", url: "https://course.abutable.com" }],
      waitingPerson: "Tranzila", waitingWhat: "the bit to become available; bot expected on the page on 14.06",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "orin", emoji: "🤖", title: "Orin Shpalter (Seva)",
      description: "Create an agent that guides workers on how to use Rivhit and Oketz.\nAlready created and sent to Seva.",
      status: "in-progress", urgency: "medium", color: null, progress: 90,
      links: [{ id: "l-orin", label: "Demo agent", url: "https://app.targetbob.ai/public/demo/c36de657-d4df-44ac-bc2c-bbfd10507d90" }],
      waitingPerson: "Seva", waitingWhat: "feedback - whether anything needs to be changed",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "yedalms-chrome", emoji: "🧩", title: "YedaLMS Chrome agent (Vitalina)",
      description: "Chrome agent for YedaLMS.",
      status: "in-progress", urgency: "medium", color: null, progress: 10,
      links: [], waitingPerson: "Vitalina", waitingWhat: "send the materials",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "csmart", emoji: "🔗", title: "Csmart",
      description: "Fix how leads are saved in Lead Manager. Add the webhook keys to the form fields.",
      status: "new", urgency: "medium", color: null, progress: 0,
      links: [], waitingPerson: "", waitingWhat: "",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "calcalist", emoji: "📧", title: "Calcalist",
      description: "Send a message to Ron.",
      status: "new", urgency: "medium", color: null, progress: 0,
      links: [], waitingPerson: "", waitingWhat: "",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "habetzefer", emoji: "💬", title: "Chat / voice Agent - Habetzefer",
      description: "Igal approved the chat and voice agent. Now I need to connect it to Zoho.",
      status: "in-progress", urgency: "medium", color: null, progress: 50,
      links: [{ id: "l-hab", label: "Demo agent", url: "https://app.targetbob.ai/public/demo/49b00641-e615-4d3b-820f-663970f5f97b" }],
      waitingPerson: "", waitingWhat: "",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "salty", emoji: "🧂", title: "Salty",
      description: "- Improve the trigger\n- Finish the chatbot",
      status: "in-progress", urgency: "medium", color: null, progress: 30,
      links: [{ id: "l-salty", label: "saltrooms.co.il", url: "https://www.saltrooms.co.il" }],
      waitingPerson: "", waitingWhat: "",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "smart-trigger", emoji: "⚡", title: "New smart trigger",
      description: `Alexey has to improve the plan.

План (RU):

Dynamic Page-Aware Trigger

Нужно создать один умный триггер, который будет автоматически подстраиваться под разные главы разных страниц на сайте во время перехода между страницами и скролла на странице, в зависимости от контекста, вместо того чтобы создавать много разных триггеров для разных страниц.

Триггер должен понимать, на какой странице находится посетитель, и менять свои тексты в зависимости от контекста страницы. Например, на странице с ценами он может задавать вопросы про стоимость услуг, а на странице с конкретным продуктом — предлагать помощь именно по этому продукту.

Также триггер должен реагировать на скролл страницы. Когда пользователь переходит к другому разделу страницы, текст триггера может меняться в соответствии с тем контентом, который сейчас находится на экране.

Кроме текста, триггер должен уметь менять свой внешний вид. Например, сначала это может быть обычный текстовый триггер, затем небольшой видеотриггер, потом другой формат. В зависимости от страницы и поведения пользователя триггер может переключаться между разными вариантами отображения. Для каждого отображения подбирать какие форматы агента будут показываться чат/звонок/форма.

Для подготовки этой функциональности нужно также пройтись по существующим дизайнам в Figma и выбрать несколько вариантов триггеров разных форматов, которые смогут динамически сменять друг друга. Необходимо определить, какие именно варианты отображения будут использоваться в рамках одного динамического триггера и как они будут сочетаться между собой в разных сценариях.

Все настройки должны управляться из админки TargetBob. Там должно быть можно настроить:
• какие тексты показывать на разных страницах;
• когда менять сообщения;
• когда менять вид триггера;
• какие форми агента есть в каждом виде триггера;
• сколько времени показывать каждый вариант;
• какие действия пользователя запускают смену триггера;
• последовательность показа разных вариантов.

Важно сохранять статистику по каждому варианту триггера. Нужно видеть:
• сколько раз был показан каждый вариант;
• на каких страницах он показывался;
• сколько пользователей на него нажали;
• какие варианты работают лучше всего;
• какие варианты приводят к большему количеству открытий и лидов.

Следующий этап — сделать так, чтобы после открытия триггера содержимое внутри него тоже подстраивалось под контекст страницы. Например, если пользователь находится на странице для организаций, то ему показываются вопросы и поля формы, связанные с организациями. Если он находится на другой странице, то вопросы и форма автоматически меняются под эту страницу.

В итоге должен получиться один универсальный триггер, который сам меняет тексты, внешний вид и сценарии в зависимости от страницы и поведения пользователя, вместо большого количества отдельных триггеров.

Важно, чтобы настройка такого динамического триггера выполнялась один раз при создании TargetBob, а не при каждом открытии сайта пользователем. Во время первоначальной настройки система может проанализировать страницы сайта, определить их контекст, подобрать релевантные тексты, сценарии и форматы триггеров. После этого все созданные настройки сохраняются и используются в работе без необходимости заново выполнять полный анализ сайта при каждом посещении. Также должна быть возможность обновления настроек через отдельную кнопку на странице админа в Таргетбоб. При обновлении пользователь может выбрать, нужно ли пересканировать весь сайт или только отдельные страницы, чтобы обновить тексты, сценарии или варианты триггеров только там, где были внесены изменения.`,
      status: "new", urgency: "high", color: null, progress: 5,
      links: [], waitingPerson: "Alexey", waitingWhat: "improve the plan",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "calcalist-prices", emoji: "💰", title: "Calcalist - update agent prices",
      description: "Update the agent's prices in Calcalist. Vitalina sent the table with the prices.",
      status: "new", urgency: "medium", color: null, progress: 0,
      links: [], waitingPerson: "", waitingWhat: "",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "minrav", emoji: "🏗️", title: "Minrav - LMS agent",
      description: "Create an agent for Minrav for the LMS platform.",
      status: "in-progress", urgency: "medium", color: null, progress: 30,
      links: [{ id: "l-minrav", label: "Demo agent", url: "https://app.targetbob.ai/public/demo/ef99e635-79ce-4a06-983b-71aad9b183ab" }],
      waitingPerson: "", waitingWhat: "",
      notes: [], createdAt: T, updatedAt: T,
    },
    {
      id: "rashuyot", emoji: "🏛️", title: "Rashuyot - proposal page with agent",
      description: "Proposal page for רשויות (authorities) with an embedded agent.",
      status: "in-progress", urgency: "medium", color: null, progress: 60,
      links: [{ id: "l-rashuyot", label: "offer.yedalms.io/rashuyot", url: "https://offer.yedalms.io/rashuyot" }],
      waitingPerson: "", waitingWhat: "",
      notes: [], createdAt: T, updatedAt: T,
    },
  ],
  credentials: INITIAL_CREDENTIALS,
};

/* ------------------------------------------------------------------ */
/*  Local persistence (offline fallback) + theme                      */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "yeda-tasks-data-v1";
const AUTH_KEY = "yeda-tasks-role";
const THEME_KEY = "yeda-tasks-theme";

export function loadData(): TasksData {
  if (typeof window === "undefined") return INITIAL_DATA;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeData(JSON.parse(stored));
  } catch {
    // ignore
  }
  return INITIAL_DATA;
}

export function saveData(data: TasksData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark";
}

export function saveTheme(t: "dark" | "light") {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, t);
}

/* ------------------------------------------------------------------ */
/*  Roles / auth                                                       */
/* ------------------------------------------------------------------ */
export const ALEXEY_CODE = "alexey";
export const KATERYNA_CODE = "kateryna";

export function roleFromCode(code: string): Role | null {
  const c = code.trim().toLowerCase();
  if (c === KATERYNA_CODE) return "kateryna";
  if (c === ALEXEY_CODE) return "alexey";
  return null;
}

export function loadRole(): Role {
  if (typeof window === "undefined") return "viewer";
  const r = sessionStorage.getItem(AUTH_KEY);
  return r === "alexey" || r === "kateryna" ? r : "viewer";
}

export function saveRole(r: Role) {
  if (typeof window === "undefined") return;
  if (r === "viewer") sessionStorage.removeItem(AUTH_KEY);
  else sessionStorage.setItem(AUTH_KEY, r);
}

/* ------------------------------------------------------------------ */
/*  Server sync (shared Vercel Blob storage)                           */
/* ------------------------------------------------------------------ */
export async function fetchServerData(): Promise<TasksData> {
  try {
    const res = await fetch(`/api/data?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const serverData = normalizeData(await res.json());
      saveData(serverData); // keep a local fallback copy
      return serverData;
    }
  } catch {
    // fall back to localStorage
  }
  return loadData();
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

// Both "alexey" and "kateryna" may write; viewers never sync.
// The role string doubles as the server auth token.
export function saveDataWithSync(data: TasksData, role: Role) {
  saveData(data);
  if (role === "viewer") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-auth": role },
      body: JSON.stringify(data),
    }).catch(() => {});
  }, 500);
}
