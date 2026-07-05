"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { AppState, CalendarEvent, EventType } from "@/lib/types";
import { todayStr } from "@/lib/date";
import {
  WEEKDAYS,
  monthGrid,
  monthLabel,
  addMonths,
  parseYMD,
  isToday,
  prettyDate,
  formatTime,
  calendarItemsForDate,
  itemHour,
  hourLabel,
} from "@/lib/calendar";
import type { CalendarItem } from "@/lib/calendar";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import Loading from "@/components/Loading";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Quick-pick start times for the add/edit form (the native time field is fiddly
// to type into). Picking one sets the start and bumps the end to one hour later.
const TIME_PRESETS: { label: string; time: string }[] = [
  { label: "Morning", time: "09:00" },
  { label: "Noon", time: "12:00" },
  { label: "Afternoon", time: "14:00" },
  { label: "Evening", time: "18:00" },
];

/** Add one hour to an "HH:MM" string (wraps past midnight). */
function plusOneHour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const nextH = (h + 1) % 24;
  return `${String(nextH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const {
    state,
    hydrated,
    addEvent,
    deleteEvent,
    updateEvent,
    toggleEventDone,
    toggleStudyTaskDone,
  } = useStore();

  // Route a calendar item's checkbox to the right store action by its source.
  function toggleItem(item: CalendarItem) {
    if (item.source === "event") toggleEventDone(item.id);
    else if (item.source === "study") toggleStudyTaskDone(item.id);
  }
  function editItem(item: CalendarItem) {
    if (item.source !== "event") return;
    const ev = state.events.find((e) => e.id === item.id);
    if (ev) openEdit(ev);
  }
  function deleteItem(item: CalendarItem) {
    if (item.source === "event") deleteEvent(item.id);
  }

  const today = todayStr();
  const init = parseYMD(today);
  const [view, setView] = useState<"month" | "day">("month");
  const [cursor, setCursor] = useState({ year: init.year, month: init.month });
  const [selectedDate, setSelectedDate] = useState(today);

  // Add / edit-event form
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("task");
  const [date, setDate] = useState(today);
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  const grid = useMemo(
    () => monthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  );

  function openAdd(forDate: string) {
    setEditId(null);
    setDate(forDate);
    setTitle("");
    setType("task");
    setAllDay(false);
    setStartTime("09:00");
    setEndTime("10:00");
    setNotes("");
    setShowAdd(true);
  }

  function openEdit(ev: CalendarEvent) {
    setEditId(ev.id);
    setTitle(ev.title);
    setType(ev.type);
    setDate(ev.date);
    setAllDay(ev.startTime === null);
    setStartTime(ev.startTime ?? "09:00");
    setEndTime(ev.endTime ?? "10:00");
    setNotes(ev.notes ?? "");
    setShowAdd(true);
  }

  function closeForm() {
    setShowAdd(false);
    setEditId(null);
  }

  // Quick-pick: set start, nudge end to an hour later, and ensure it's timed.
  function pickTime(time: string) {
    setAllDay(false);
    setStartTime(time);
    setEndTime(plusOneHour(time));
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const fields = {
      title: title.trim(),
      type,
      date,
      startTime: allDay ? null : startTime,
      endTime: allDay ? null : endTime || null,
      notes: notes.trim() || undefined,
    };
    if (editId) updateEvent(editId, fields);
    else addEvent(fields);
    closeForm();
  }

  function goMonth(delta: number) {
    setCursor((c) => addMonths(c.year, c.month, delta));
  }
  function goDay(delta: number) {
    const { year, month, day } = parseYMD(selectedDate);
    const d = new Date(year, month, day + delta);
    setSelectedDate(todayStr(d));
  }
  function jumpToday() {
    const t = parseYMD(today);
    setCursor({ year: t.year, month: t.month });
    setSelectedDate(today);
  }

  if (!hydrated) return <Loading />;

  const dayItems = calendarItemsForDate(state, selectedDate);
  const allDayItems = dayItems.filter((i) => itemHour(i) === null);

  return (
    <div>
      <PageHeader
        title="Calendar"
        icon="🗓️"
        subtitle="Track tasks, meetings & events by day and hour"
        action={
          <button onClick={() => openAdd(selectedDate)} className="btn-primary">
            + Add
          </button>
        }
      />

      {/* View switch */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex rounded-xl border border-line p-0.5 bg-surface">
          {(["month", "day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3.5 py-1.5 text-sm rounded-lg capitalize transition ${
                view === v ? "bg-brand-500 text-white" : "text-muted"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <button onClick={jumpToday} className="btn-ghost border border-line text-sm">
          Today
        </button>
      </div>

      {view === "month" ? (
        <MonthView
          grid={grid}
          cursor={cursor}
          appState={state}
          onPrev={() => goMonth(-1)}
          onNext={() => goMonth(1)}
          onPick={(d) => {
            setSelectedDate(d);
            setView("day");
          }}
          onQuickAdd={openAdd}
        />
      ) : (
        <DayView
          date={selectedDate}
          allDayItems={allDayItems}
          dayItems={dayItems}
          onPrev={() => goDay(-1)}
          onNext={() => goDay(1)}
          onAdd={() => openAdd(selectedDate)}
          onToggle={toggleItem}
          onDelete={deleteItem}
          onEdit={editItem}
        />
      )}

      {/* Add / edit event modal */}
      <Modal
        open={showAdd}
        onClose={closeForm}
        title={editId ? "Edit entry" : "New entry"}
      >
        <form onSubmit={submitAdd} className="space-y-4">
          <div>
            <label className="label" htmlFor="ev-title">Title</label>
            <input
              id="ev-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Team standup"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ev-type">Type</label>
              <select
                id="ev-type"
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
              >
                <option value="task">Task</option>
                <option value="meeting">Meeting</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ev-date">Date</label>
              <input
                id="ev-date"
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            All day
          </label>

          {!allDay && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="ev-start">Start</label>
                  <TimeSelect
                    id="ev-start"
                    value={startTime}
                    onChange={setStartTime}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="ev-end">End</label>
                  <TimeSelect id="ev-end" value={endTime} onChange={setEndTime} />
                </div>
              </div>
              <p className="text-xs text-muted">
                {formatTime(startTime)} – {formatTime(endTime)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TIME_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => pickTime(p.time)}
                    className={`btn-ghost border border-line px-2.5 py-1 text-xs ${
                      startTime === p.time ? "border-brand-500 text-brand-600" : ""
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label" htmlFor="ev-notes">Notes (optional)</label>
            <input
              id="ev-notes"
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to remember"
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            {editId ? "Save changes" : "Add to calendar"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

const MINUTE_STEPS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

/** 24-hour hour + minute dropdowns (so 13–23 are directly selectable, unlike
 *  the native 12-hour time picker). Stores/reads an "HH:MM" string. */
function TimeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [h, m] = value.split(":");
  // Keep an off-grid minute (e.g. from older data) selectable.
  const minutes = MINUTE_STEPS.includes(m)
    ? MINUTE_STEPS
    : [...MINUTE_STEPS, m].sort();
  return (
    <div className="flex items-center gap-1.5">
      <select
        id={id}
        className="input"
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${m}`)}
        aria-label="Hour"
      >
        {HOURS.map((hr) => {
          const hh = String(hr).padStart(2, "0");
          return (
            <option key={hh} value={hh}>
              {hh}
            </option>
          );
        })}
      </select>
      <span className="text-muted">:</span>
      <select
        className="input"
        value={m}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        aria-label="Minute"
      >
        {minutes.map((mm) => (
          <option key={mm} value={mm}>
            {mm}
          </option>
        ))}
      </select>
    </div>
  );
}

function MonthView({
  grid,
  cursor,
  appState,
  onPrev,
  onNext,
  onPick,
  onQuickAdd,
}: {
  grid: string[];
  cursor: { year: number; month: number };
  appState: AppState;
  onPrev: () => void;
  onNext: () => void;
  onPick: (date: string) => void;
  onQuickAdd: (date: string) => void;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-ink">
          {monthLabel(cursor.year, cursor.month)}
        </h2>
        <div className="flex gap-1">
          <button onClick={onPrev} className="btn-ghost border border-line px-2.5 py-1">
            ‹
          </button>
          <button onClick={onNext} className="btn-ghost border border-line px-2.5 py-1">
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((d) => {
          const { day, month } = parseYMD(d);
          const inMonth = month === cursor.month;
          const dayItems = calendarItemsForDate(appState, d);
          return (
            <button
              key={d}
              onClick={() => onPick(d)}
              onDoubleClick={() => onQuickAdd(d)}
              className={`min-h-[78px] rounded-lg border p-1.5 text-left align-top transition hover:border-brand-400 ${
                isToday(d) ? "border-brand-500" : "border-line"
              } ${inMonth ? "bg-surface" : "bg-bg opacity-60"}`}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  isToday(d) ? "text-brand-600" : "text-ink"
                }`}
              >
                {day}
              </div>
              <div className="space-y-0.5">
                {dayItems.slice(0, 2).map((it) => (
                  <div
                    key={it.key}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: it.style.color }}
                    title={it.title}
                  >
                    {it.startTime ? `${it.startTime} ` : ""}
                    {it.title}
                  </div>
                ))}
                {dayItems.length > 2 && (
                  <div className="text-[10px] text-muted">
                    +{dayItems.length - 2} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        Tip: click a day to open it, double-click to add an entry.
      </p>
    </div>
  );
}

function DayView({
  date,
  allDayItems,
  dayItems,
  onPrev,
  onNext,
  onAdd,
  onToggle,
  onDelete,
  onEdit,
}: {
  date: string;
  allDayItems: CalendarItem[];
  dayItems: CalendarItem[];
  onPrev: () => void;
  onNext: () => void;
  onAdd: () => void;
  onToggle: (item: CalendarItem) => void;
  onDelete: (item: CalendarItem) => void;
  onEdit: (item: CalendarItem) => void;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ink">{prettyDate(date)}</h2>
        <div className="flex gap-1">
          <button onClick={onPrev} className="btn-ghost border border-line px-2.5 py-1">‹</button>
          <button onClick={onAdd} className="btn-ghost border border-line px-3 py-1 text-sm">+ Add</button>
          <button onClick={onNext} className="btn-ghost border border-line px-2.5 py-1">›</button>
        </div>
      </div>

      {dayItems.length === 0 && (
        <p className="text-sm text-muted py-8 text-center">
          Nothing scheduled. Add a task, meeting, or event.
        </p>
      )}

      {allDayItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide text-muted mb-1">All day</p>
          <div className="space-y-1.5">
            {allDayItems.map((it) => (
              <ItemRow key={it.key} item={it} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
            ))}
          </div>
        </div>
      )}

      {/* Hourly timeline */}
      <div className="divide-y divide-line">
        {HOURS.map((h) => {
          const hourItems = dayItems.filter((it) => itemHour(it) === h);
          if (hourItems.length === 0) {
            return (
              <div key={h} className="flex items-start gap-3 py-1.5">
                <span className="w-14 shrink-0 text-xs text-muted pt-0.5">
                  {hourLabel(h)}
                </span>
                <span className="flex-1 h-5" />
              </div>
            );
          }
          return (
            <div key={h} className="flex items-start gap-3 py-1.5">
              <span className="w-14 shrink-0 text-xs text-muted pt-1.5">
                {hourLabel(h)}
              </span>
              <div className="flex-1 space-y-1.5">
                {hourItems.map((it) => (
                  <ItemRow key={it.key} item={it} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onDelete,
  onEdit,
}: {
  item: CalendarItem;
  onToggle: (item: CalendarItem) => void;
  onDelete: (item: CalendarItem) => void;
  onEdit: (item: CalendarItem) => void;
}) {
  const { style } = item;

  // Body (icon, title, meta) — a link for study/goal rows, plain text for events.
  const meta = (
    <p className="text-xs text-muted truncate">
      {style.label}
      {" · "}
      {item.startTime ? formatTime(item.startTime) : "All day"}
      {item.endTime ? ` – ${formatTime(item.endTime)}` : ""}
      {item.notes ? ` · ${item.notes}` : ""}
    </p>
  );
  const titleText = (
    <p
      className={`text-sm font-medium truncate ${
        item.done ? "line-through text-muted" : "text-ink"
      }`}
    >
      {style.icon} {item.title}
    </p>
  );
  const body =
    item.href != null ? (
      <Link href={item.href} className="min-w-0 flex-1 block hover:opacity-80">
        {titleText}
        {meta}
      </Link>
    ) : item.source === "study" ? (
      <Link href="/study" className="min-w-0 flex-1 block hover:opacity-80">
        {titleText}
        {meta}
      </Link>
    ) : (
      <div className="min-w-0 flex-1">
        {titleText}
        {meta}
      </div>
    );

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-line p-2.5"
      style={{ borderLeftColor: style.color, borderLeftWidth: 4 }}
    >
      {item.toggleable ? (
        <button
          onClick={() => onToggle(item)}
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 text-xs transition ${
            item.done ? "bg-mint border-mint text-white" : "border-line text-muted hover:border-mint"
          }`}
          aria-label={item.done ? "Mark not done" : "Mark done"}
          title={item.source === "study" ? "Complete study task (+10 XP)" : "Mark done"}
        >
          {item.done ? "✓" : ""}
        </button>
      ) : (
        <span
          className="grid h-6 w-6 shrink-0 place-items-center text-sm"
          aria-hidden
        >
          {style.icon}
        </span>
      )}

      {body}

      {item.source === "event" && (
        <>
          <button
            onClick={() => onEdit(item)}
            className="text-muted hover:text-ink text-sm px-1 shrink-0"
            aria-label="Edit entry"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(item)}
            className="text-muted hover:text-red-500 text-sm px-1 shrink-0"
            aria-label="Delete entry"
          >
            🗑
          </button>
        </>
      )}
    </div>
  );
}
