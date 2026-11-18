"use client";
import { useState } from "react";
import { Download, Upload, ShieldCheck, Database, Check } from "lucide-react";
import { useData, useToast, flushAll } from "@/lib/store";
import {
  db,
  exportBackup,
  importBackup,
  validateBackup,
  downloadFile,
} from "@/lib/db";
import { Backup } from "@/lib/models";
import { PageHeader, Card, Modal, Badge } from "./ui";
export function SettingsPage() {
  const { settings, questions, answers, attempts } = useData();
  const s = settings[0];
  const toast = useToast();
  const [backup, setBackup] = useState<Backup | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [persistent, setPersistent] = useState("");
  async function patch(p: Partial<typeof s>) {
    try {
      await db.settings.update("preferences", p);
    } catch {
      toast("Could not save preference.");
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="MAKE YOURSELF AT HOME"
        title="Settings & backups"
        description="Your workspace, your data, your pace."
      />
      <div className="two-column">
        <div>
          <Card>
            <h2>Personal preferences</h2>
            <label className="field">
              Display name
              <input
                aria-label="Display name"
                defaultValue={s.name}
                onBlur={(e) => {
                  if (e.target.value.trim())
                    void patch({ name: e.target.value.trim() });
                }}
              />
            </label>
            <label className="field">
              Speaking rate · {s.speakingRate} words per minute
              <input
                aria-label="Speaking rate"
                type="range"
                min={90}
                max={220}
                step={5}
                value={s.speakingRate}
                onChange={(e) =>
                  void patch({ speakingRate: Number(e.target.value) })
                }
              />
              <span className="small muted">
                Used for speaking-time estimates. Typical practice range:
                130–150 words/minute.
              </span>
            </label>
            <label className="field">
              Appearance
              <select
                value={s.theme}
                onChange={(e) =>
                  void patch({ theme: e.target.value as "dark" | "light" })
                }
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
          </Card>
          <Card>
            <h2>
              <Database size={20} />
              Backup your preparation
            </h2>
            <p>
              Export all questions, answer variants, versions, stories, practice
              attempts, reviews, timeline events, resource notes, and settings
              as a versioned JSON file.
            </p>
            <div className="backup-stats">
              <span>{questions.length} questions</span>
              <span>{answers.length} answer records</span>
              <span>{attempts.length} attempts</span>
            </div>
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await flushAll();
                  const data = await exportBackup();
                  downloadFile(
                    `axon-prep-backup-${new Date().toISOString().slice(0, 10)}.json`,
                    JSON.stringify(data, null, 2),
                  );
                  toast("Backup exported. Keep it somewhere you trust.");
                } catch (e) {
                  setError(`Export failed: ${String(e)}`);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download size={16} />
              Export all data
            </button>
            <p className="small muted">
              Backups include private answers and logistics notes. They are not
              encrypted.
            </p>
          </Card>
          <Card>
            <h2>
              <Upload size={20} />
              Restore from a backup
            </h2>
            <p>
              Choose an Axon Prep JSON backup. Its schema, IDs, and record
              relationships are checked before any records change.
            </p>
            <label className="file-upload">
              Choose backup file
              <input
                type="file"
                aria-label="Import backup file"
                accept=".json,application/json"
                onChange={async (e) => {
                  setError("");
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 25 * 1024 * 1024) {
                    setError("This file exceeds the 25 MB import limit.");
                    return;
                  }
                  try {
                    const parsed = validateBackup(
                      JSON.parse(await file.text()),
                    );
                    setBackup(parsed);
                    setConfirmed(false);
                  } catch {
                    setError(
                      "Invalid backup. Use an unmodified version 1 Axon Prep export; no data was changed.",
                    );
                  }
                  e.target.value = "";
                }}
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </Card>
        </div>
        <div>
          <Card className="privacy-card">
            <ShieldCheck size={27} />
            <h2>Local by design.</h2>
            <p>
              Structured data lives in this browser’s IndexedDB database,{" "}
              <code>axon-prep-v1</code>, for this exact origin. There is no
              login, external database, analytics, or AI service.
            </p>
            <p>
              Using a different browser, hostname, or port creates a separate
              workspace. Clearing site data can remove your work. Export
              regularly, especially before moving devices.
            </p>
            <p>
              The local database and exported files are not encrypted. Anyone
              with access to this browser profile may be able to read them.
            </p>
            <button
              onClick={async () => {
                if (!navigator.storage?.persist) {
                  setPersistent(
                    "This browser does not support requesting persistent storage.",
                  );
                  return;
                }
                try {
                  const ok = await navigator.storage.persist();
                  setPersistent(
                    ok
                      ? "Persistent storage granted. Continue making backups."
                      : "Persistent storage was not granted by the browser. Backups are still available.",
                  );
                } catch {
                  setPersistent("Could not request persistent storage.");
                }
              }}
            >
              Request persistent browser storage
            </button>
            {persistent && <p role="status">{persistent}</p>}
          </Card>
          <Card>
            <h3>Useful without an AI service</h3>
            <p>
              Writing checks use explicit word-count and language rules. No
              answer content is sent to an AI provider. Speech recognition, live
              AI coaching, and offline installation are not enabled.
            </p>
            <Badge tone="green">
              <Check size={12} />
              No API key needed
            </Badge>
          </Card>
          <Card>
            <h3>Your profile</h3>
            <p>
              University of Rochester
              <br />
              BS, Computer Science and Business
              <br />
              Graduation: May 2028 · GPA: 3.95
              <br />
              Davis UWC Scholar · Dean’s List
            </p>
            <p className="small muted">
              Profile facts from your request and supplied resume. Sensitive
              work-authorization preparation stays in your local answers.
            </p>
          </Card>
        </div>
      </div>
      {backup && (
        <Modal
          title="Review your import"
          onClose={() => {
            if (!busy) setBackup(null);
          }}
        >
          <p>Backup from {new Date(backup.exportedAt).toLocaleString()}.</p>
          <div className="backup-stats">
            <span>{backup.questions.length} questions</span>
            <span>{backup.answers.length} answers</span>
            <span>{backup.attempts.length} attempts</span>
          </div>
          <label className="field">
            Import behavior
            <select
              aria-label="Import behavior"
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as "merge" | "replace");
                setConfirmed(false);
              }}
            >
              <option value="merge">
                Merge · imported records win when IDs match
              </option>
              <option value="replace">
                Replace · remove existing data, then restore backup
              </option>
            </select>
          </label>
          <p>
            {mode === "merge"
              ? "New records are added. Records with matching IDs are overwritten by this backup, even if the local version is newer."
              : "All current workspace records will be replaced. Export a backup first if you want to preserve them."}
          </p>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I understand and want to {mode} this backup.
          </label>
          <button
            className="primary"
            disabled={!confirmed || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await flushAll();
                await importBackup(backup, mode);
                setBackup(null);
                toast(
                  "Import complete. Answers, progress, and history restored.",
                );
              } catch (e) {
                setError(
                  `Import failed: ${String(e)}. No partial import was committed.`,
                );
                toast("Import failed. See the error in Settings.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirm import
          </button>
        </Modal>
      )}
    </>
  );
}
