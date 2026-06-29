"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { CalendarEvent, EventType } from "@/lib/types";
import { todayStr } from "@/lib/date";
import {
  WEEKDAYS,
  EVENT_STYLE,
  monthGrid,
  monthLabel,
  addMonths,
  parseYMD,
  isToday,
  prettyDate,
  formatTime,
  eventsForDate,
  eventHour,
  hourLabel,
} from "@/lib/calendar";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import Loading from "@/components/Loading";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarPage() {
  const { state, hydrated, addEvent, deleteEvent, updateEvent, toggleEventDone } =
    useStore();

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

  const dayEvents = eventsForDate(state.events, selectedDate);
  const allDayEvents = dayEvents.filter((e) => eventHour(e) === null);

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
          events={state.events}
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
          allDayEvents={allDayEvents}
          dayEvents={dayEvents}
          onPrev={() => goDay(-1)}
          onNext={() => goDay(1)}
          onAdd={() => openAdd(selectedDate)}
          onToggle={toggleEventDone}
          onDelete={deleteEvent}
          onEdit={openEdit}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="ev-start">Start</label>
                <input
                  id="ev-start"
                  type="time"
                  className="input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="ev-end">End</label>
                <input
                  id="ev-end"
                  type="time"
                  className="input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
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

function MonthView({
  grid,
  cursor,
  events,
  onPrev,
  onNext,
  onPick,
  onQuickAdd,
}: {
  grid: string[];
  cursor: { year: number; month: number };
  events: CalendarEvent[];
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
          const dayEvents = eventsForDate(events, d);
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
                {dayEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: EVENT_STYLE[e.type].color }}
                    title={e.title}
                  >
                    {e.startTime ? `${e.startTime} ` : ""}
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-muted">
                    +{dayEvents.length - 2} more
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
  allDayEvents,
  dayEvents,
  onPrev,
  onNext,
  onAdd,
  onToggle,
  onDelete,
  onEdit,
}: {
  date: string;
  allDayEvents: CalendarEvent[];
  dayEvents: CalendarEvent[];
  onPrev: () => void;
  onNext: () => void;
  onAdd: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (e: CalendarEvent) => void;
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

      {dayEvents.length === 0 && (
        <p className="text-sm text-muted py-8 text-center">
          Nothing scheduled. Add a task, meeting, or event.
        </p>
      )}

      {allDayEvents.length > 0 && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wide text-muted mb-1">All day</p>
          <div className="space-y-1.5">
            {allDayEvents.map((e) => (
              <EventRow key={e.id} e={e} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
            ))}
          </div>
        </div>
      )}

      {/* Hourly timeline */}
      <div className="divide-y divide-line">
        {HOURS.map((h) => {
          const hourEvents = dayEvents.filter((e) => eventHour(e) === h);
          if (hourEvents.length === 0) {
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
                {hourEvents.map((e) => (
                  <EventRow key={e.id} e={e} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventRow({
  e,
  onToggle,
  onDelete,
  onEdit,
}: {
  e: CalendarEvent;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (e: CalendarEvent) => void;
}) {
  const style = EVENT_STYLE[e.type];
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-line p-2.5"
      style={{ borderLeftColor: style.color, borderLeftWidth: 4 }}
    >
      <button
        onClick={() => onToggle(e.id)}
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 text-xs transition ${
          e.done ? "bg-mint border-mint text-white" : "border-line text-muted hover:border-mint"
        }`}
        aria-label={e.done ? "Mark not done" : "Mark done"}
        title={e.type === "task" ? "Complete task (+10 XP)" : "Mark done"}
      >
        {e.done ? "✓" : ""}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${e.done ? "line-through text-muted" : "text-ink"}`}>
          {style.icon} {e.title}
        </p>
        <p className="text-xs text-muted">
          {style.label}
          {" · "}
          {e.startTime ? formatTime(e.startTime) : "All day"}
          {e.endTime ? ` – ${formatTime(e.endTime)}` : ""}
          {e.notes ? ` · ${e.notes}` : ""}
        </p>
      </div>
      <button
        onClick={() => onEdit(e)}
        className="text-muted hover:text-ink text-sm px-1 shrink-0"
        aria-label="Edit entry"
      >
        ✏️
      </button>
      <button
        onClick={() => onDelete(e.id)}
        className="text-muted hover:text-red-500 text-sm px-1 shrink-0"
        aria-label="Delete entry"
      >
        🗑
      </button>
    </div>
  );
}
