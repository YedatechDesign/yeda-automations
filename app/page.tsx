"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Automation,
  AutomationsData,
  ChecklistItem,
  AutomationNote,
} from "@/lib/data";
import {
  INITIAL_DATA,
  generateId,
  getProgress,
  loadData,
  saveData,
  checkAuth,
  setAuth,
  PASSWORD,
} from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  Status config                                                      */
/* ------------------------------------------------------------------ */
const STATUS_CFG = {
  done: {
    label: "Done",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-400",
    bar: "from-emerald-500 to-emerald-400",
  },
  "in-progress": {
    label: "In Progress",
    dot: "bg-blue-500",
    badge: "bg-blue-500/15 text-blue-400",
    bar: "from-blue-500 to-blue-400",
  },
  "not-started": {
    label: "Not Started",
    dot: "bg-gray-500",
    badge: "bg-gray-500/20 text-gray-400",
    bar: "from-gray-600 to-gray-500",
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Icons (inline SVGs)                                                */
/* ------------------------------------------------------------------ */
function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center transition-smooth hover:border-border-hover">
      <div className="text-2xl sm:text-3xl font-bold text-white stat-number">{value}</div>
      <div className="text-xs sm:text-sm text-text-secondary mt-1 text-center">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Login Modal                                                        */
/* ------------------------------------------------------------------ */
function LoginModal({ onLogin, onClose }: { onLogin: () => void; onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === PASSWORD) onLogin();
    else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-6 text-center">Log In</h2>
        <form onSubmit={submit}>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Password"
            autoFocus
            className={`w-full px-4 py-3 rounded-lg bg-input-bg border text-white placeholder-muted outline-none transition-colors ${
              error ? "border-red-500" : "border-border-hover focus:border-accent"
            }`}
          />
          {error && <p className="text-red-400 text-sm mt-2">Wrong password</p>}
          <button type="submit" className="w-full mt-4 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors">
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Automation Modal (Add / Edit)                                      */
/* ------------------------------------------------------------------ */
function AutomationModal({
  automation,
  categories,
  onSave,
  onClose,
}: {
  automation: Automation | null;
  categories: string[];
  onSave: (a: Automation) => void;
  onClose: () => void;
}) {
  const isEdit = !!automation;
  const [title, setTitle] = useState(automation?.title ?? "");
  const [description, setDescription] = useState(automation?.description ?? "");
  const [status, setStatus] = useState<Automation["status"]>(automation?.status ?? "not-started");
  const [category, setCategory] = useState(automation?.category ?? categories[0] ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [useNew, setUseNew] = useState(categories.length === 0);
  const [deadline, setDeadline] = useState(automation?.deadline ?? "");
  const [checklistText, setChecklistText] = useState(
    automation?.checklist.map((c) => (c.completed ? "[x] " : "[ ] ") + c.text).join("\n") ?? ""
  );

  const handleSave = () => {
    if (!title.trim()) return;
    const cat = useNew ? newCategory.trim() : category;
    if (!cat) return;

    const checklist: ChecklistItem[] = checklistText
      .split("\n")
      .filter((l) => l.trim())
      .map((line) => {
        const completed = line.trim().startsWith("[x]");
        const text = line.replace(/^\[[ x]\]\s*/, "").trim();
        return { id: generateId(), text, completed };
      });

    const now = new Date().toISOString();
    onSave({
      id: automation?.id ?? generateId(),
      title: title.trim(),
      description: description.trim(),
      status,
      category: cat,
      deadline: deadline || null,
      checklist,
      notes: automation?.notes ?? [],
      createdAt: automation?.createdAt ?? now,
      updatedAt: now,
    });
  };

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-input-bg border border-border-hover text-white placeholder-muted outline-none focus:border-accent transition-colors text-sm";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-5">{isEdit ? "Edit Automation" : "New Automation"}</h2>

        <label className="block text-xs text-text-secondary mb-1 font-medium">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${inputCls} mb-3`} placeholder="Automation title" />

        <label className="block text-xs text-text-secondary mb-1 font-medium">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} mb-3 min-h-[70px] resize-y`} placeholder="What does this automation do?" />

        <label className="block text-xs text-text-secondary mb-1 font-medium">Category</label>
        {categories.length > 0 && !useNew ? (
          <div className="flex gap-2 mb-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} flex-1`}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setUseNew(true)} className="text-accent text-xs hover:text-blue-300 whitespace-nowrap px-2">+ New</button>
          </div>
        ) : (
          <div className="flex gap-2 mb-3">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className={`${inputCls} flex-1`} placeholder="Category name" />
            {categories.length > 0 && <button onClick={() => setUseNew(false)} className="text-text-secondary text-xs hover:text-white px-2">Cancel</button>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1 font-medium">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Automation["status"])} className={inputCls}>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1 font-medium">Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
          </div>
        </div>

        <label className="block text-xs text-text-secondary mb-1 font-medium">
          Plan / Checklist <span className="text-text-muted">(one item per line, prefix [x] for done)</span>
        </label>
        <textarea
          value={checklistText}
          onChange={(e) => setChecklistText(e.target.value)}
          className={`${inputCls} mb-5 min-h-[100px] resize-y font-mono text-xs leading-relaxed`}
          placeholder={"[ ] Step one\n[ ] Step two\n[x] Already done step"}
        />

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-secondary hover:text-white transition-colors text-sm">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors text-sm">
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Note Modal                                                         */
/* ------------------------------------------------------------------ */
function NoteModal({ onSave, onClose }: { onSave: (text: string, isPublic: boolean) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-4">Add Note</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-input-bg border border-border-hover text-white placeholder-muted outline-none focus:border-accent transition-colors text-sm min-h-[90px] resize-y"
          placeholder="Write a note..."
          autoFocus
        />
        <label className="flex items-center gap-2 text-sm text-text-secondary mt-3 mb-4 cursor-pointer select-none">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4" />
          Visible to everyone
        </label>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-secondary hover:text-white transition-colors text-sm">Cancel</button>
          <button
            onClick={() => { if (text.trim()) onSave(text.trim(), isPublic); }}
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors text-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirm Modal                                                      */
/* ------------------------------------------------------------------ */
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <p className="text-white text-sm mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-text-secondary hover:text-white transition-colors text-sm">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors text-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Automation Card                                                    */
/* ------------------------------------------------------------------ */
function AutomationCard({
  automation,
  index,
  isLoggedIn,
  onToggleCheck,
  onEdit,
  onDelete,
  onAddNote,
  onDeleteNote,
  onToggleNoteVis,
}: {
  automation: Automation;
  index: number;
  isLoggedIn: boolean;
  onToggleCheck: (autoId: string, itemId: string) => void;
  onEdit: (a: Automation) => void;
  onDelete: (id: string) => void;
  onAddNote: (id: string) => void;
  onDeleteNote: (autoId: string, noteId: string) => void;
  onToggleNoteVis: (autoId: string, noteId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const progress = getProgress(automation);
  const cfg = STATUS_CFG[automation.status];
  const doneCount = automation.checklist.filter((c) => c.completed).length;
  const notes = isLoggedIn ? automation.notes : automation.notes.filter((n) => n.isPublic);

  const deadlineInfo = useMemo(() => {
    if (!automation.deadline) return null;
    const d = new Date(automation.deadline + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    const fmt = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (diff < 0) return { text: `Overdue (${fmt})`, cls: "text-red-400" };
    if (diff <= 3) return { text: `Due ${fmt}`, cls: "text-amber-400" };
    return { text: `Due ${fmt}`, cls: "text-text-muted" };
  }, [automation.deadline]);

  return (
    <div className="rounded-xl transition-smooth hover:bg-card-hover px-3 sm:px-4 py-3">
      {/* Header row */}
      <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background border border-border-hover flex items-center justify-center text-xs sm:text-sm font-semibold text-text-secondary shrink-0">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-semibold text-white text-sm sm:text-[15px] truncate max-w-[200px] sm:max-w-none">{automation.title}</span>
            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge} whitespace-nowrap`}>{cfg.label}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {automation.checklist.length > 0 && (
              <span className="text-[11px] sm:text-xs text-text-muted">{doneCount}/{automation.checklist.length} tasks</span>
            )}
            <span className="text-[11px] sm:text-xs text-text-muted font-semibold">{progress}%</span>
            {deadlineInfo && <span className={`text-[10px] sm:text-xs hidden sm:inline ${deadlineInfo.cls}`}>{deadlineInfo.text}</span>}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-border/50 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${cfg.bar} transition-all duration-700`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-text-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Expanded content */}
      {open && (
        <div className="mt-4 pt-3 border-t border-border/50 ml-11 sm:ml-12">
          {/* Deadline on mobile */}
          {deadlineInfo && <p className={`text-xs mb-3 sm:hidden ${deadlineInfo.cls}`}>{deadlineInfo.text}</p>}

          {/* Description */}
          {automation.description && (
            <p className="text-sm text-text-secondary mb-4 leading-relaxed whitespace-pre-wrap">{automation.description}</p>
          )}

          {/* Checklist */}
          {automation.checklist.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Plan</h4>
              <div className="space-y-1">
                {automation.checklist.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2.5 text-sm py-0.5 ${isLoggedIn ? "cursor-pointer" : ""} ${
                      item.completed ? "text-text-muted line-through" : "text-text-secondary"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => isLoggedIn && onToggleCheck(automation.id, item.id)}
                      disabled={!isLoggedIn}
                      className="mt-0.5 w-4 h-4 shrink-0 rounded"
                    />
                    <span>{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {notes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Notes</h4>
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="bg-background rounded-lg p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-text-secondary whitespace-pre-wrap flex-1 leading-relaxed">{note.text}</p>
                      {isLoggedIn && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => onToggleNoteVis(automation.id, note.id)}
                            title={note.isPublic ? "Visible to all" : "Private"}
                            className={`p-1.5 rounded-md hover:bg-card transition-colors ${note.isPublic ? "text-blue-400" : "text-text-muted"}`}
                          >
                            {note.isPublic ? <EyeIcon /> : <EyeOffIcon />}
                          </button>
                          <button
                            onClick={() => onDeleteNote(automation.id, note.id)}
                            className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-card transition-colors"
                          >
                            <XIcon />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-text-muted">
                      <span>{new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      {isLoggedIn && (
                        <span className={note.isPublic ? "text-blue-500/60" : ""}>
                          {note.isPublic ? "public" : "private"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {isLoggedIn && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => onAddNote(automation.id)} className="text-xs px-3 py-1.5 rounded-lg bg-border/30 text-text-secondary hover:text-white hover:bg-border/60 transition-colors">
                + Note
              </button>
              <button onClick={() => onEdit(automation)} className="text-xs px-3 py-1.5 rounded-lg bg-border/30 text-text-secondary hover:text-white hover:bg-border/60 transition-colors">
                Edit
              </button>
              <button onClick={() => onDelete(automation.id)} className="text-xs px-3 py-1.5 rounded-lg bg-border/30 text-red-400/50 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function AutomationsRoadmap() {
  const [data, setData] = useState<AutomationsData>(INITIAL_DATA);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [editingAuto, setEditingAuto] = useState<Automation | null>(null);
  const [noteTarget, setNoteTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(loadData());
    setLoggedIn(checkAuth());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveData(data);
  }, [data, loaded]);

  const update = useCallback((fn: (d: AutomationsData) => AutomationsData) => setData(fn), []);

  const doLogin = () => { setLoggedIn(true); setAuth(true); setShowLogin(false); };
  const doLogout = () => { setLoggedIn(false); setAuth(false); };

  const handleSaveAuto = (a: Automation) => {
    update((prev) => {
      const cats = prev.categories.includes(a.category) ? prev.categories : [...prev.categories, a.category];
      const exists = prev.automations.some((x) => x.id === a.id);
      return {
        categories: cats,
        automations: exists ? prev.automations.map((x) => (x.id === a.id ? a : x)) : [...prev.automations, a],
      };
    });
    setShowAutoModal(false);
    setEditingAuto(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    update((prev) => ({ ...prev, automations: prev.automations.filter((a) => a.id !== deleteTarget) }));
    setDeleteTarget(null);
  };

  const handleToggleCheck = (autoId: string, itemId: string) => {
    update((prev) => ({
      ...prev,
      automations: prev.automations.map((a) =>
        a.id === autoId
          ? { ...a, checklist: a.checklist.map((c) => (c.id === itemId ? { ...c, completed: !c.completed } : c)), updatedAt: new Date().toISOString() }
          : a
      ),
    }));
  };

  const handleAddNote = (text: string, isPublic: boolean) => {
    if (!noteTarget) return;
    const note: AutomationNote = { id: generateId(), text, isPublic, createdAt: new Date().toISOString() };
    update((prev) => ({
      ...prev,
      automations: prev.automations.map((a) =>
        a.id === noteTarget ? { ...a, notes: [...a.notes, note], updatedAt: new Date().toISOString() } : a
      ),
    }));
    setNoteTarget(null);
  };

  const handleDeleteNote = (autoId: string, noteId: string) => {
    update((prev) => ({
      ...prev,
      automations: prev.automations.map((a) =>
        a.id === autoId ? { ...a, notes: a.notes.filter((n) => n.id !== noteId) } : a
      ),
    }));
  };

  const handleToggleNoteVis = (autoId: string, noteId: string) => {
    update((prev) => ({
      ...prev,
      automations: prev.automations.map((a) =>
        a.id === autoId ? { ...a, notes: a.notes.map((n) => (n.id === noteId ? { ...n, isPublic: !n.isPublic } : n)) } : a
      ),
    }));
  };

  /* Stats */
  const stats = useMemo(() => {
    const total = data.automations.length;
    const done = data.automations.filter((a) => a.status === "done").length;
    const inProg = data.automations.filter((a) => a.status === "in-progress").length;
    const overall = total === 0 ? 0 : Math.round(data.automations.reduce((s, a) => s + getProgress(a), 0) / total);
    return { total, done, inProg, overall, cats: data.categories.length };
  }, [data]);

  /* Group by category */
  const grouped = useMemo(() => {
    const m = new Map<string, Automation[]>();
    for (const a of data.automations) {
      if (!m.has(a.category)) m.set(a.category, []);
      m.get(a.category)!.push(a);
    }
    return m;
  }, [data]);

  if (!loaded) return <div className="min-h-screen bg-background" />;

  let idx = 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Yeda</h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">Automations Roadmap</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {loggedIn && (
            <button
              onClick={() => { setEditingAuto(null); setShowAutoModal(true); }}
              className="px-3 sm:px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium transition-colors"
            >
              + New
            </button>
          )}
          <button
            onClick={() => loggedIn ? doLogout() : setShowLogin(true)}
            className="px-3 sm:px-4 py-2 rounded-lg border border-border-hover text-text-secondary hover:text-white hover:border-text-muted text-xs sm:text-sm transition-colors"
          >
            {loggedIn ? "Log Out" : "Log In"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        {/* Date */}
        <p className="text-right text-[11px] text-text-muted mb-4">
          Updated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>

        {/* Legend */}
        <div className="flex items-center gap-4 sm:gap-5 mb-5 text-xs sm:text-sm text-text-secondary">
          {(["done", "in-progress", "not-started"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${STATUS_CFG[s].dot} inline-block`} />
              {STATUS_CFG[s].label}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-8">
          <StatCard value={stats.total} label="Total Automations" />
          <StatCard value={stats.done} label="Completed" />
          <StatCard value={`${stats.overall}%`} label="Overall Progress" />
          <StatCard value={stats.cats} label="Categories" />
        </div>

        {/* Empty state */}
        {data.automations.length === 0 && (
          <div className="bg-card border border-border rounded-2xl py-16 text-center">
            <p className="text-text-secondary text-base mb-2">No automations yet</p>
            {loggedIn ? (
              <button
                onClick={() => { setEditingAuto(null); setShowAutoModal(true); }}
                className="text-accent hover:text-blue-300 text-sm"
              >
                Create your first automation
              </button>
            ) : (
              <p className="text-text-muted text-sm">Log in to start adding automations</p>
            )}
          </div>
        )}

        {/* Categories */}
        {Array.from(grouped.entries()).map(([cat, autos]) => {
          const catDone = autos.filter((a) => a.status === "done").length;
          const catProg = Math.round(autos.reduce((s, a) => s + getProgress(a), 0) / autos.length);
          return (
            <section key={cat} className="mb-6 sm:mb-8">
              <div className="flex items-baseline justify-between mb-2 sm:mb-3">
                <h2 className="text-lg sm:text-xl font-bold text-white">{cat}</h2>
                <span className="text-xs sm:text-sm text-text-muted">{catDone}/{autos.length} done &middot; {catProg}%</span>
              </div>
              <div className="bg-card border border-border rounded-2xl p-2 sm:p-3 space-y-1">
                {autos.map((a) => {
                  idx++;
                  return (
                    <AutomationCard
                      key={a.id}
                      automation={a}
                      index={idx}
                      isLoggedIn={loggedIn}
                      onToggleCheck={handleToggleCheck}
                      onEdit={(a) => { setEditingAuto(a); setShowAutoModal(true); }}
                      onDelete={(id) => setDeleteTarget(id)}
                      onAddNote={(id) => setNoteTarget(id)}
                      onDeleteNote={handleDeleteNote}
                      onToggleNoteVis={handleToggleNoteVis}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* Modals */}
      {showLogin && <LoginModal onLogin={doLogin} onClose={() => setShowLogin(false)} />}
      {showAutoModal && (
        <AutomationModal
          automation={editingAuto}
          categories={data.categories}
          onSave={handleSaveAuto}
          onClose={() => { setShowAutoModal(false); setEditingAuto(null); }}
        />
      )}
      {noteTarget && <NoteModal onSave={handleAddNote} onClose={() => setNoteTarget(null)} />}
      {deleteTarget && <ConfirmModal message="Delete this automation?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
