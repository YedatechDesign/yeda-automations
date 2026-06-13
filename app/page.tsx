"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Task, TasksData, TaskNote, TaskLink, Status, Urgency, Role } from "@/lib/data";
import {
  INITIAL_DATA,
  generateId,
  fetchServerData,
  saveDataWithSync,
  loadRole,
  saveRole,
  roleFromCode,
  loadTheme,
  saveTheme,
} from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  Status & Urgency config (each with an emoji)                       */
/* ------------------------------------------------------------------ */
const STATUS_CFG: Record<Status, { emoji: string; label: string; badge: string }> = {
  new:           { emoji: "🆕", label: "Новая",    badge: "bg-gray-500/15 text-gray-400" },
  "in-progress": { emoji: "🔄", label: "В работе", badge: "bg-blue-500/15 text-blue-400" },
  waiting:       { emoji: "⏳", label: "Ожидает",  badge: "bg-amber-500/15 text-amber-400" },
  done:          { emoji: "✅", label: "Готово",   badge: "bg-emerald-500/15 text-emerald-400" },
};
const STATUS_LIST: Status[] = ["new", "in-progress", "waiting", "done"];

const URGENCY_CFG: Record<Urgency, { emoji: string; label: string; cls: string }> = {
  critical: { emoji: "🔴", label: "Критический", cls: "bg-red-500/15 text-red-400" },
  high:     { emoji: "🟠", label: "Высокий",     cls: "bg-orange-500/15 text-orange-400" },
  medium:   { emoji: "🟡", label: "Средний",     cls: "bg-yellow-500/15 text-yellow-500" },
  low:      { emoji: "⚪", label: "Низкий",      cls: "bg-gray-500/15 text-gray-400" },
};
const URGENCY_LIST: Urgency[] = ["critical", "high", "medium", "low"];

const ROLE_LABEL: Record<Role, string> = { viewer: "", alexey: "🧑‍💼 Alexey", kateryna: "👑 Kateryna" };
const QUICK_EMOJIS = ["📌", "🚀", "🛠️", "🐛", "💡", "📞", "📧", "🔗", "🎨", "📊", "🤖", "💬", "🌐", "🧩", "💳", "🧂", "⚡", "🔥"];
const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];
const DEFAULT_ACCENT = "#3b82f6";

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */
function ChevronDown({ className = "" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
}
function ArrowUp() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>;
}
function ArrowDown() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
}
function XIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function LinkIcon() {
  return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 11-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 115.656 5.656l-1.5 1.5" /></svg>;
}
function SunIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="5" /><path strokeLinecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>;
}
function MoonIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>;
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */
function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center transition-smooth hover:border-border-hover">
      <div className="text-2xl sm:text-3xl font-bold text-heading stat-number">{value}</div>
      <div className="text-xs sm:text-sm text-text-secondary mt-1 text-center">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Login Modal                                                        */
/* ------------------------------------------------------------------ */
function LoginModal({ onLogin, onClose }: { onLogin: (role: Role) => void; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = roleFromCode(code);
    if (role) onLogin(role);
    else { setError(true); setTimeout(() => setError(false), 2000); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-heading mb-2 text-center">Вход</h2>
        <p className="text-xs text-text-muted text-center mb-6">Введи логин, чтобы редактировать. Без логина — только просмотр.</p>
        <form onSubmit={submit}>
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Логин / код" autoFocus
            className={`w-full px-4 py-3 rounded-lg bg-input-bg border text-foreground placeholder-muted outline-none transition-colors ${error ? "border-red-500" : "border-border-hover focus:border-accent"}`} />
          {error && <p className="text-red-400 text-sm mt-2">Неверный логин</p>}
          <button type="submit" className="w-full mt-4 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors">Войти</button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Task Modal (Add / Edit) — kateryna only                            */
/* ------------------------------------------------------------------ */
function TaskModal({ task, onSave, onClose }: {
  task: Task | null; onSave: (t: Task) => void; onClose: () => void;
}) {
  const isEdit = !!task;
  const [emoji, setEmoji] = useState(task?.emoji ?? "📌");
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<Status>(task?.status ?? "new");
  const [urgency, setUrgency] = useState<Urgency>(task?.urgency ?? "medium");
  const [color, setColor] = useState<string | null>(task?.color ?? null);
  const [progress, setProgress] = useState<number>(task?.progress ?? 0);
  const [links, setLinks] = useState<TaskLink[]>(task?.links ?? []);
  const [waitingPerson, setWaitingPerson] = useState(task?.waitingPerson ?? "");
  const [waitingWhat, setWaitingWhat] = useState(task?.waitingWhat ?? "");

  const handleSave = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    onSave({
      id: task?.id ?? generateId(),
      emoji: emoji.trim() || "📌",
      title: title.trim(),
      description: description.trim(),
      status, urgency, color, progress,
      links: links.filter((l) => l.url.trim()).map((l) => ({ ...l, label: l.label.trim() || l.url.trim(), url: l.url.trim() })),
      waitingPerson: waitingPerson.trim(),
      waitingWhat: waitingWhat.trim(),
      notes: task?.notes ?? [],
      createdAt: task?.createdAt ?? now,
      updatedAt: now,
    });
  };

  const ic = "w-full px-3 py-2.5 rounded-lg bg-input-bg border border-border-hover text-foreground placeholder-muted outline-none focus:border-accent transition-colors text-sm";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-heading mb-5">{isEdit ? "Редактировать задачу" : "Новая задача"}</h2>

        <label className="block text-xs text-text-secondary mb-1 font-medium">Эмодзи + название</label>
        <div className="flex gap-2 mb-2">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className={`${ic} w-16 text-center text-lg`} placeholder="📌" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${ic} flex-1`} placeholder="Название задачи" autoFocus />
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {QUICK_EMOJIS.map((em) => (
            <button key={em} type="button" onClick={() => setEmoji(em)}
              className={`w-8 h-8 rounded-md text-base transition-colors ${emoji === em ? "bg-accent/20 ring-1 ring-accent" : "hover:bg-border/50"}`}>{em}</button>
          ))}
        </div>

        <label className="block text-xs text-text-secondary mb-1 font-medium">Описание</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${ic} mb-4 min-h-[80px] resize-y`} placeholder="Что нужно сделать?" />

        {/* Links */}
        <label className="block text-xs text-text-secondary mb-1 font-medium">Ссылки</label>
        <div className="space-y-2 mb-2">
          {links.map((l, i) => (
            <div key={l.id} className="flex gap-2">
              <input value={l.label} onChange={(e) => setLinks((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={`${ic} w-1/3`} placeholder="Название" />
              <input value={l.url} onChange={(e) => setLinks((p) => p.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} className={`${ic} flex-1`} placeholder="https://..." />
              <button type="button" onClick={() => setLinks((p) => p.filter((_, j) => j !== i))} className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-border/40 transition-colors"><XIcon /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setLinks((p) => [...p, { id: generateId(), label: "", url: "" }])}
          className="text-xs text-accent hover:text-blue-300 mb-4">+ Добавить ссылку</button>

        {/* Waiting for */}
        <label className="block text-xs text-text-secondary mb-1 font-medium">⏳ Жду (кого / что должен сделать)</label>
        <div className="flex gap-2 mb-4">
          <input value={waitingPerson} onChange={(e) => setWaitingPerson(e.target.value)} className={`${ic} w-1/3`} placeholder="Имя" />
          <input value={waitingWhat} onChange={(e) => setWaitingWhat(e.target.value)} className={`${ic} flex-1`} placeholder="Что он должен сделать" />
        </div>

        {/* Color */}
        <label className="block text-xs text-text-secondary mb-1 font-medium">Цвет</label>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button type="button" onClick={() => setColor(null)}
            className={`w-7 h-7 rounded-full border border-border-hover flex items-center justify-center text-[10px] text-text-muted ${color === null ? "ring-2 ring-accent" : ""}`} title="Без цвета">∅</button>
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} style={{ backgroundColor: c }}
              className={`w-7 h-7 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-offset-card ring-foreground" : ""}`} title={c} />
          ))}
        </div>

        {/* Progress */}
        <label className="block text-xs text-text-secondary mb-1 font-medium">Прогресс: {progress}%</label>
        <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))}
          style={{ accentColor: color || DEFAULT_ACCENT }} className="w-full h-2 mb-4 cursor-pointer" />

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-xs text-text-secondary mb-1 font-medium">Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={ic}>
              {STATUS_LIST.map((s) => <option key={s} value={s}>{STATUS_CFG[s].emoji} {STATUS_CFG[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1 font-medium">Срочность</label>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)} className={ic}>
              {URGENCY_LIST.map((u) => <option key={u} value={u}>{URGENCY_CFG[u].emoji} {URGENCY_CFG[u].label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-secondary hover:text-heading transition-colors text-sm">Отменить</button>
          <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors text-sm">{isEdit ? "Сохранить" : "Создать"}</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Note Modal                                                         */
/* ------------------------------------------------------------------ */
function NoteModal({ onSave, onClose }: { onSave: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-heading mb-4">Добавить заметку</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-input-bg border border-border-hover text-foreground placeholder-muted outline-none focus:border-accent transition-colors text-sm min-h-[90px] resize-y"
          placeholder="Напиши комментарий или заметку..." autoFocus />
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-secondary hover:text-heading transition-colors text-sm">Отменить</button>
          <button onClick={() => { if (text.trim()) onSave(text.trim()); }}
            className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors text-sm">Добавить</button>
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
        <p className="text-heading text-sm mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-text-secondary hover:text-heading transition-colors text-sm">Отменить</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors text-sm">Удалить</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Task Card                                                          */
/* ------------------------------------------------------------------ */
function TaskCard({ task, index, role, isFirst, isLast, onMove, onSetStatus, onSetUrgency, onSetProgress, onMarkDone, onReturnActive, onEdit, onDelete, onAddNote, onDeleteNote }: {
  task: Task; index: number; role: Role; isFirst: boolean; isLast: boolean;
  onMove: (id: string, dir: -1 | 1) => void;
  onSetStatus: (id: string, status: Status) => void;
  onSetUrgency: (id: string, urgency: Urgency) => void;
  onSetProgress: (id: string, progress: number) => void;
  onMarkDone: (id: string) => void; onReturnActive: (id: string) => void;
  onEdit: (t: Task) => void; onDelete: (id: string) => void;
  onAddNote: (id: string) => void; onDeleteNote: (taskId: string, noteId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[task.status];
  const urg = URGENCY_CFG[task.urgency];
  const canFull = role === "kateryna";
  const canManage = role === "alexey" || role === "kateryna";
  const isDone = task.status === "done";
  const accent = task.color || DEFAULT_ACCENT;

  return (
    <div className={`rounded-xl transition-smooth hover:bg-card-hover px-3 sm:px-4 py-3 ${isDone ? "opacity-60" : ""}`}
      style={task.color ? { borderLeft: `4px solid ${task.color}` } : undefined}>
      <div className="flex items-center gap-3">
        {/* Reorder arrows (active tab only) */}
        {canManage && !isDone && (
          <div className="flex flex-col shrink-0 -my-1">
            <button onClick={() => onMove(task.id, -1)} disabled={isFirst}
              className="p-0.5 rounded text-text-muted hover:text-accent disabled:opacity-20 disabled:hover:text-text-muted transition-colors" title="Вверх"><ArrowUp /></button>
            <button onClick={() => onMove(task.id, 1)} disabled={isLast}
              className="p-0.5 rounded text-text-muted hover:text-accent disabled:opacity-20 disabled:hover:text-text-muted transition-colors" title="Вниз"><ArrowDown /></button>
          </div>
        )}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background border border-border-hover flex items-center justify-center text-xs sm:text-sm font-semibold text-text-secondary shrink-0">{index}</div>
        <div className="flex-1 min-w-0 cursor-pointer select-none" onClick={() => setOpen(!open)}>
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <span className={`font-semibold text-sm sm:text-[15px] ${isDone ? "text-text-muted line-through" : "text-heading"}`}>
              <span className="mr-1 no-underline">{task.emoji}</span>{task.title}
            </span>
            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge} whitespace-nowrap`}>{cfg.emoji} {cfg.label}</span>
            {!isDone && <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${urg.cls} whitespace-nowrap`}>{urg.emoji} {urg.label}</span>}
            {task.waitingPerson && !isDone && (
              <span className="text-[10px] sm:text-xs text-amber-500 whitespace-nowrap">⏳ {task.waitingPerson}</span>
            )}
            {task.notes.length > 0 && <span className="text-[10px] sm:text-xs text-text-muted whitespace-nowrap">💬 {task.notes.length}</span>}
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${task.progress}%`, backgroundColor: isDone ? "#9ca3af" : accent }} />
            </div>
            <span className="text-[11px] text-text-muted font-semibold shrink-0">{task.progress}%</span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-text-muted transition-transform shrink-0 cursor-pointer ${open ? "rotate-180" : ""}`} />
      </div>

      {open && (
        <div className="mt-4 pt-3 border-t border-border/50 ml-11 sm:ml-12">
          {task.description && <p className="text-sm text-text-secondary mb-4 leading-relaxed whitespace-pre-wrap">{task.description}</p>}

          {/* Links */}
          {task.links.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {task.links.map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                  <LinkIcon />{l.label}
                </a>
              ))}
            </div>
          )}

          {/* Waiting for */}
          {(task.waitingPerson || task.waitingWhat) && (
            <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm">
              <span className="text-amber-500 font-medium">⏳ Жду{task.waitingPerson ? ` ${task.waitingPerson}` : ""}</span>
              {task.waitingWhat && <span className="text-text-secondary">: {task.waitingWhat}</span>}
            </div>
          )}

          {/* Progress slider (kateryna) */}
          {canFull && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Прогресс</span>
                <span className="text-xs text-text-secondary font-semibold">{task.progress}%</span>
              </div>
              <input type="range" min={0} max={100} value={task.progress}
                onChange={(e) => onSetProgress(task.id, Number(e.target.value))}
                style={{ accentColor: accent }} className="w-full h-2.5 cursor-pointer" />
            </div>
          )}

          {/* Inline status / urgency editors */}
          {canManage && (
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {canFull && (
                <label className="flex items-center gap-2 text-[11px] text-text-muted">
                  <span className="uppercase tracking-widest font-semibold">Статус</span>
                  <select value={task.status} onChange={(e) => onSetStatus(task.id, e.target.value as Status)}
                    className="px-2 py-1 rounded-md bg-input-bg border border-border-hover text-foreground text-xs outline-none focus:border-accent">
                    {STATUS_LIST.map((s) => <option key={s} value={s}>{STATUS_CFG[s].emoji} {STATUS_CFG[s].label}</option>)}
                  </select>
                </label>
              )}
              <label className="flex items-center gap-2 text-[11px] text-text-muted">
                <span className="uppercase tracking-widest font-semibold">Срочность</span>
                <select value={task.urgency} onChange={(e) => onSetUrgency(task.id, e.target.value as Urgency)}
                  className="px-2 py-1 rounded-md bg-input-bg border border-border-hover text-foreground text-xs outline-none focus:border-accent">
                  {URGENCY_LIST.map((u) => <option key={u} value={u}>{URGENCY_CFG[u].emoji} {URGENCY_CFG[u].label}</option>)}
                </select>
              </label>
            </div>
          )}

          {/* Notes */}
          {task.notes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Заметки</h4>
              <div className="space-y-2">
                {task.notes.map((note) => (
                  <div key={note.id} className="bg-background rounded-lg p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-text-secondary whitespace-pre-wrap flex-1 leading-relaxed">{note.text}</p>
                      {canManage && (
                        <button onClick={() => onDeleteNote(task.id, note.id)} className="p-1 rounded-md text-text-muted hover:text-red-400 hover:bg-card transition-colors shrink-0"><XIcon /></button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-text-muted">
                      <span className="font-medium">{ROLE_LABEL[note.author] || "—"}</span>
                      <span>·</span>
                      <span>{new Date(note.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {canManage && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => onAddNote(task.id)} className="text-xs px-3 py-1.5 rounded-lg bg-border/30 text-text-secondary hover:text-heading hover:bg-border/60 transition-colors">+ Заметка</button>
              {canFull && !isDone && (
                <button onClick={() => onMarkDone(task.id)} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500/80 hover:text-emerald-400 hover:bg-emerald-500/20 transition-colors">✅ Готово</button>
              )}
              {canFull && isDone && (
                <button onClick={() => onReturnActive(task.id)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400/80 hover:text-blue-400 hover:bg-blue-500/20 transition-colors">↩ Вернуть в работу</button>
              )}
              {canFull && (
                <>
                  <button onClick={() => onEdit(task)} className="text-xs px-3 py-1.5 rounded-lg bg-border/30 text-text-secondary hover:text-heading hover:bg-border/60 transition-colors">Редактировать</button>
                  <button onClick={() => onDelete(task.id)} className="text-xs px-3 py-1.5 rounded-lg bg-border/30 text-red-400/60 hover:text-red-400 hover:bg-red-900/20 transition-colors">Удалить</button>
                </>
              )}
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
export default function TasksBoard() {
  const [data, setData] = useState<TasksData>(INITIAL_DATA);
  const [role, setRole] = useState<Role>("viewer");
  const [tab, setTab] = useState<"active" | "done">("active");
  const [showLogin, setShowLogin] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [noteTarget, setNoteTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setRole(loadRole());
    setTheme(loadTheme());
    fetchServerData().then((d) => { setData(d); setLoaded(true); });
  }, []);

  useEffect(() => { if (loaded) saveDataWithSync(data, role); }, [data, loaded, role]);
  useEffect(() => {
    document.documentElement.className = theme === "dark" ? "theme-dark h-full antialiased" : "theme-light h-full antialiased";
    if (loaded) saveTheme(theme);
  }, [theme, loaded]);

  const update = useCallback((fn: (d: TasksData) => TasksData) => setData(fn), []);
  const canFull = role === "kateryna";
  const canManage = role === "alexey" || role === "kateryna";

  const doLogin = (r: Role) => { setRole(r); saveRole(r); setShowLogin(false); };
  const doLogout = () => { setRole("viewer"); saveRole("viewer"); };
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const handleSaveTask = (t: Task) => {
    update((prev) => {
      const exists = prev.tasks.some((x) => x.id === t.id);
      return { tasks: exists ? prev.tasks.map((x) => (x.id === t.id ? t : x)) : [...prev.tasks, t] };
    });
    setShowTaskModal(false); setEditingTask(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    update((prev) => ({ tasks: prev.tasks.filter((t) => t.id !== deleteTarget) }));
    setDeleteTarget(null);
  };

  // Swap with the nearest non-done neighbour (done tasks live in the array but show in another tab).
  const handleMove = (id: string, dir: -1 | 1) => {
    update((prev) => {
      const arr = [...prev.tasks];
      const i = arr.findIndex((t) => t.id === id);
      if (i < 0) return prev;
      let j = i + dir;
      while (j >= 0 && j < arr.length && arr[j].status === "done") j += dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { tasks: arr };
    });
  };

  const patch = (id: string, fields: Partial<Task>) =>
    update((prev) => ({ tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...fields, updatedAt: new Date().toISOString() } : t)) }));

  const handleSetStatus = (id: string, status: Status) => patch(id, { status });
  const handleSetUrgency = (id: string, urgency: Urgency) => patch(id, { urgency });
  const handleSetProgress = (id: string, progress: number) => patch(id, { progress });
  const handleMarkDone = (id: string) => patch(id, { status: "done", progress: 100 });
  const handleReturnActive = (id: string) => patch(id, { status: "in-progress" });

  const handleAddNote = (text: string) => {
    if (!noteTarget || role === "viewer") return;
    const note: TaskNote = { id: generateId(), text, author: role, createdAt: new Date().toISOString() };
    update((prev) => ({ tasks: prev.tasks.map((t) => (t.id === noteTarget ? { ...t, notes: [...t.notes, note], updatedAt: new Date().toISOString() } : t)) }));
    setNoteTarget(null);
  };

  const handleDeleteNote = (taskId: string, noteId: string) => {
    update((prev) => ({ tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, notes: t.notes.filter((n) => n.id !== noteId) } : t)) }));
  };

  const activeTasks = useMemo(() => data.tasks.filter((t) => t.status !== "done"), [data]);
  const doneTasks = useMemo(() => data.tasks.filter((t) => t.status === "done"), [data]);
  const stats = useMemo(() => {
    const total = data.tasks.length;
    const done = doneTasks.length;
    const inProgress = data.tasks.filter((t) => t.status === "in-progress").length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, inProgress, pct };
  }, [data, doneTasks]);

  if (!loaded) return <div className="min-h-screen bg-background" />;

  const shown = tab === "active" ? activeTasks : doneTasks;
  const tabBtn = (t: "active" | "done") =>
    `px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${tab === t ? "bg-accent text-white" : "text-text-secondary hover:text-heading hover:bg-border/40"}`;

  const cardHandlers = {
    onMove: handleMove, onSetStatus: handleSetStatus, onSetUrgency: handleSetUrgency,
    onSetProgress: handleSetProgress, onMarkDone: handleMarkDone, onReturnActive: handleReturnActive,
    onEdit: (t: Task) => { setEditingTask(t); setShowTaskModal(true); },
    onDelete: (id: string) => setDeleteTarget(id), onAddNote: (id: string) => setNoteTarget(id),
    onDeleteNote: handleDeleteNote,
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-2 flex items-start justify-between">
        <div>
          <img src={theme === "dark" ? "/yeda-logo-white.png" : "/yeda-logo-blue.png"} alt="Yeda" className="h-7 sm:h-9 w-auto" />
          <p className="text-text-muted text-xs sm:text-sm mt-1.5">Список задач</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5">
          {role !== "viewer" && <span className="hidden sm:inline text-xs text-text-muted">{ROLE_LABEL[role]}</span>}
          <button onClick={toggleTheme} className="p-2 rounded-lg border border-border-hover text-text-secondary hover:text-heading hover:border-text-muted transition-colors" title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          {canFull && (
            <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
              className="px-3 sm:px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs sm:text-sm font-medium transition-colors">+ Задача</button>
          )}
          <button onClick={() => role !== "viewer" ? doLogout() : setShowLogin(true)}
            className="px-3 sm:px-4 py-2 rounded-lg border border-border-hover text-text-secondary hover:text-heading hover:border-text-muted text-xs sm:text-sm transition-colors">
            {role !== "viewer" ? "Выйти" : "Войти"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <p className="text-right text-[11px] text-text-muted mb-4">
          Обновлено: {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
          <StatCard value={stats.total} label="Всего задач" />
          <StatCard value={stats.inProgress} label="В работе" />
          <StatCard value={stats.done} label="Готово" />
          <StatCard value={`${stats.pct}%`} label="Выполнено" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => setTab("active")} className={tabBtn("active")}>📋 Активные ({activeTasks.length})</button>
          <button onClick={() => setTab("done")} className={tabBtn("done")}>✅ Сделано ({doneTasks.length})</button>
        </div>

        {shown.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl py-16 text-center">
            <p className="text-text-secondary text-base mb-2">{tab === "active" ? "Активных задач нет" : "Сделанных задач пока нет"}</p>
            {tab === "active" && canFull && (
              <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} className="text-accent hover:text-blue-300 text-sm">Создать задачу</button>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-2 sm:p-3 space-y-1">
            {shown.map((t, i) => (
              <TaskCard key={t.id} task={t} index={i + 1} role={role}
                isFirst={i === 0} isLast={i === shown.length - 1} {...cardHandlers} />
            ))}
          </div>
        )}
      </main>

      {showLogin && <LoginModal onLogin={doLogin} onClose={() => setShowLogin(false)} />}
      {showTaskModal && canFull && <TaskModal task={editingTask} onSave={handleSaveTask} onClose={() => { setShowTaskModal(false); setEditingTask(null); }} />}
      {noteTarget && canManage && <NoteModal onSave={handleAddNote} onClose={() => setNoteTarget(null)} />}
      {deleteTarget && <ConfirmModal message="Удалить эту задачу?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
