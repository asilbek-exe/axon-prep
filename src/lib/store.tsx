"use client";
import { useLiveQuery } from "dexie-react-hooks";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { db, seedDatabase, tableNames } from "./db";
import type { Backup } from "./models";
export type Data = Omit<Backup, "format" | "version" | "exportedAt">;
const DataContext = createContext<Data | null>(null);
const ToastContext = createContext<(message: string) => void>(() => {});
export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error("Workspace not loaded");
  return data;
}
export const useToast = () => useContext(ToastContext);
const pending = new Map<string, () => Promise<void>>();
export async function flushAll() {
  await Promise.all([...pending.values()].map((fn) => fn()));
}
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    seedDatabase()
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
  }, []);
  const data = useLiveQuery(async () => {
    if (!ready) return null;
    const rows = await Promise.all(
      tableNames.map(async (key) => [key, await db.table(key).toArray()]),
    );
    return Object.fromEntries(rows) as Data;
  }, [ready]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (pending.size) {
        void flushAll().catch(() => {});
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme =
      data?.settings[0]?.theme || "light";
  }, [data?.settings]);
  if (error)
    return (
      <div className="loading">
        <h1>Could not open local storage</h1>
        <p>{error}</p>
        <p>
          Check that this browser allows IndexedDB, then reload. Your existing
          records have not been reset.
        </p>
        <button onClick={() => location.reload()}>Retry</button>
      </div>
    );
  if (!data)
    return (
      <div className="loading">
        <span className="brand-mark">A</span>
        <p>Opening your workspace…</p>
      </div>
    );
  return (
    <DataContext.Provider value={data}>
      <ToastContext.Provider
        value={(m) => {
          setToast(m);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(""), 4000);
        }}
      >
        {children}
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </ToastContext.Provider>
    </DataContext.Provider>
  );
}
// A shared queue lets internal navigation await durable writes. Failed saves remain pending for retry.
export function useAutosave<T>(
  key: string,
  initial: T,
  save: (value: T) => Promise<unknown>,
) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState("Saved");
  const current = useRef(initial);
  const saver = useRef(save);
  saver.current = save;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const revision = useRef(0);
  const savedRevision = useRef(0);
  const mounted = useRef(true);
  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const run = async () => {
      if (savedRevision.current === revision.current) return;
      const rev = revision.current;
      const snapshot = current.current;
      try {
        if (mounted.current) setStatus("Saving…");
        await saver.current(snapshot);
        savedRevision.current = rev;
        if (revision.current === rev) {
          pending.delete(key);
          if (mounted.current) setStatus("Saved");
        }
      } catch (e) {
        if (mounted.current) setStatus("Save failed · retry");
        throw e;
      }
    };
    chain.current = chain.current.catch(() => {}).then(run);
    return chain.current;
  }, [key]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
      void flush().catch(() => {});
    };
  }, [flush]);
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      current.current =
        typeof next === "function"
          ? (next as (prev: T) => T)(current.current)
          : next;
      revision.current++;
      setValue(current.current);
      setStatus("Unsaved changes");
      pending.set(key, flush);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush().catch(() => {}), 350);
    },
    [key, flush],
  );
  return { value, update, status, flush };
}
export function SavedNote({
  id,
  label,
  placeholder = "",
  rows = 4,
}: {
  id: string;
  label: string;
  placeholder?: string;
  rows?: number;
}) {
  const { notes } = useData();
  const { value, update, status, flush } = useAutosave(
    `note-${id}`,
    notes.find((n) => n.id === id)?.value || "",
    async (value) =>
      db.notes.put({ id, value, updatedAt: new Date().toISOString() }),
  );
  return (
    <label className="field">
      {label}
      <textarea
        aria-label={label}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => update(e.target.value)}
        onBlur={() => void flush().catch(() => {})}
      />
      <span
        className={status.startsWith("Save failed") ? "error" : "save-status"}
        role="status"
      >
        {status}
      </span>
      {status.startsWith("Save failed") && (
        <button type="button" onClick={() => void flush().catch(() => {})}>
          Retry save
        </button>
      )}
    </label>
  );
}
