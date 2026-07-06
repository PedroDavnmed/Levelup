"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import Modal from "@/components/Modal";

const CONFIRM_WORD = "RESET";

export default function ResetAccount() {
  const { resetAll } = useStore();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [ack, setAck] = useState(false);

  const canReset = ack && confirmText.trim().toUpperCase() === CONFIRM_WORD;

  function close() {
    setOpen(false);
    setConfirmText("");
    setAck(false);
  }

  function doReset() {
    if (!canReset) return;
    resetAll();
    close();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost w-full justify-start text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500"
      >
        <AlertTriangle size={14} aria-hidden /> Reset account
      </button>

      <Modal open={open} onClose={close} title="Reset account?">
        <div className="space-y-4">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            This permanently erases <strong>everything</strong>: your XP, level,
            rank, activities, logs, habits, streaks, goals, calendar entries, and
            achievements. This cannot be undone.
          </div>

          {/* Verification step 1 */}
          <label className="flex items-start gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-0.5"
            />
            I understand this will delete all my data and cannot be reversed.
          </label>

          {/* Verification step 2 */}
          <div>
            <label className="label" htmlFor="reset-confirm">
              Type <span className="font-mono font-bold">{CONFIRM_WORD}</span> to
              confirm
            </label>
            <input
              id="reset-confirm"
              className="input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={close} className="btn-ghost border border-line flex-1">
              Cancel
            </button>
            <button
              onClick={doReset}
              disabled={!canReset}
              className="btn flex-1 bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reset everything
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
