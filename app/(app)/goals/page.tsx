"use client";

import { Pencil, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { todayStr } from "@/lib/date";
import { shortDate } from "@/lib/calendar";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import ProgressRing from "@/components/ProgressRing";
import Loading from "@/components/Loading";

export default function GoalsPage() {
  const { state, hydrated, addGoal, addGoalProgress, deleteGoal, updateGoal } =
    useStore();

  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  const [progressFor, setProgressFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    const t = parseFloat(target);
    if (!title.trim() || isNaN(t) || t <= 0) return;
    if (editId) {
      updateGoal(editId, {
        title: title.trim(),
        targetValue: t,
        deadline: deadline || null,
      });
    } else {
      addGoal(title.trim(), t, deadline || null);
    }
    closeForm();
  }

  function openNew() {
    setEditId(null);
    setTitle("");
    setTarget("");
    setDeadline("");
    setShowNew(true);
  }

  function openEdit(g: (typeof state.goals)[number]) {
    setEditId(g.id);
    setTitle(g.title);
    setTarget(String(g.targetValue));
    setDeadline(g.deadline ?? "");
    setShowNew(false);
  }

  function closeForm() {
    setShowNew(false);
    setEditId(null);
    setTitle("");
    setTarget("");
    setDeadline("");
  }

  function submitProgress(e: React.FormEvent) {
    e.preventDefault();
    if (progressFor == null) return;
    const a = parseFloat(amount);
    if (!isNaN(a) && a !== 0) addGoalProgress(progressFor, a);
    setAmount("");
    setProgressFor(null);
  }

  const active = state.goals.filter((g) => g.status === "active");
  const done = state.goals.filter((g) => g.status === "done");

  if (!hydrated) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Goals"
        icon={<Target size={22} aria-hidden />}
        subtitle={`${active.length} active · ${done.length} completed`}
        action={
          <button onClick={openNew} className="btn-primary">
            + New
          </button>
        }
      />

      {state.goals.length === 0 ? (
        <EmptyState
          icon={<Target size={22} aria-hidden />}
          title="No goals yet"
          hint='Set a target like "Run 50 km this month" and watch the ring fill as you log progress.'
          action={
            <button onClick={openNew} className="btn-primary">
              + New goal
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {[...active, ...done].map((g) => {
            const pct = Math.min(
              100,
              Math.round((g.currentValue / g.targetValue) * 100)
            );
            return (
              <div key={g.id} className="card p-4 flex items-center gap-4">
                <ProgressRing
                  pct={pct}
                  color={g.status === "done" ? "#3DD68C" : "#4D7CFF"}
                >
                  {pct}%
                </ProgressRing>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">
                    {g.title}{" "}
                    {g.status === "done" && (
                      <span className="text-mint">✓ done</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {g.currentValue} / {g.targetValue}
                    {g.deadline && (
                      <span
                        className={
                          g.status === "active" && g.deadline < todayStr()
                            ? "text-red-500"
                            : ""
                        }
                      >
                        {" · "}
                        by {shortDate(g.deadline)}
                        {g.status === "active" && g.deadline < todayStr()
                          ? " · overdue"
                          : ""}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {g.status === "active" && (
                    <>
                      <button
                        onClick={() => addGoalProgress(g.id, 1)}
                        className="btn-ghost border border-line px-3 py-1.5 text-xs"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => setProgressFor(g.id)}
                        className="btn-primary px-3 py-1.5 text-xs"
                      >
                        + Add
                      </button>
                      <button
                        onClick={() => openEdit(g)}
                        className="text-muted hover:text-ink text-sm px-1"
                        aria-label="Edit goal"
                      >
                        <Pencil size={15} aria-hidden />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteGoal(g.id)}
                    className="text-muted hover:text-red-500 text-sm px-1"
                    aria-label="Delete goal"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New / edit goal modal */}
      <Modal
        open={showNew || editId != null}
        onClose={closeForm}
        title={editId ? "Edit goal" : "New goal"}
      >
        <form onSubmit={submitNew} className="space-y-4">
          <div>
            <label className="label" htmlFor="goal-title">Goal</label>
            <input
              id="goal-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Run 50 km this month"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="goal-target">Target</label>
              <input
                id="goal-target"
                type="number"
                step="any"
                min={0}
                required
                className="input"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="50"
              />
            </div>
            <div>
              <label className="label" htmlFor="goal-deadline">Deadline (optional)</label>
              <input
                id="goal-deadline"
                type="date"
                className="input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          {!editId && (
            <p className="text-xs text-muted">Completing a goal earns +50 XP.</p>
          )}
          <button type="submit" className="btn-primary w-full">
            {editId ? "Save changes" : "Create goal"}
          </button>
        </form>
      </Modal>

      {/* Add progress modal */}
      <Modal
        open={progressFor != null}
        onClose={() => setProgressFor(null)}
        title="Add progress"
      >
        <form onSubmit={submitProgress} className="space-y-4">
          <div>
            <label className="label" htmlFor="goal-amount">How much to add?</label>
            <input
              id="goal-amount"
              type="number"
              step="any"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5"
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary w-full">Add progress</button>
        </form>
      </Modal>
    </div>
  );
}
