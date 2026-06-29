"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { serializeBackup, parseBackup } from "@/lib/backup";
import { todayStr } from "@/lib/date";
import type { AppState } from "@/lib/types";
import Modal from "@/components/Modal";

export default function DataBackup() {
  const { state, importData } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);

  function doExport() {
    const blob = new Blob([serializeBackup(state)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `levelup-backup-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked later
    if (!file) return;
    const parsed = parseBackup(await file.text());
    if (!parsed) {
      setError("That doesn't look like a LevelUp backup file.");
      return;
    }
    setError(null);
    setPending(parsed);
  }

  function confirmImport() {
    if (pending) importData(pending);
    setPending(null);
  }

  return (
    <>
      <button
        onClick={doExport}
        className="btn-ghost w-full justify-start text-xs"
      >
        ⬇ Export data
      </button>
      <button
        onClick={() => fileInput.current?.click()}
        className="btn-ghost w-full justify-start text-xs"
      >
        ⬆ Import data
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json"
        onChange={onFile}
        className="hidden"
      />
      {error && <p className="px-1 text-xs text-red-500">{error}</p>}

      <Modal
        open={pending != null}
        onClose={() => setPending(null)}
        title="Import backup?"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-amber/40 bg-amber/10 p-3 text-sm text-ink">
            This replaces <strong>all</strong> your current data with the
            contents of the backup file. Consider exporting first if you&apos;re
            not sure.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPending(null)}
              className="btn-ghost border border-line flex-1"
            >
              Cancel
            </button>
            <button onClick={confirmImport} className="btn-primary flex-1">
              Replace my data
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
