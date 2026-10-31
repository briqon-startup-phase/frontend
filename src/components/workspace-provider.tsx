"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { initialState } from "@/lib/sample-data";
import { canSend, settleCommand } from "@/lib/domain";
import type { Command, Preferences, WorkspaceState } from "@/lib/types";

type WorkspaceContext = {
  state: WorkspaceState;
  scope: string;
  setScope: (scope: string) => void;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  updated: string;
  ready: boolean;
  refresh: () => void;
  acknowledge: (id: string) => void;
  sendCommand: (
    equipmentId: string,
    target: boolean,
    outcome: "respond" | "timeout",
  ) => void;
  savePreferences: (preferences: Preferences) => void;
  toast: string;
  notify: (message: string) => void;
};
const Context = createContext<WorkspaceContext | null>(null);
const storageKey = "briqon-workspace-v1";
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(initialState);
  const [scope, setScope] = useState("all");
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [updated, setUpdated] = useState("2026-10-31T07:30:00Z");
  const [toast, setToast] = useState("");
  const tick = useRef(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        // Persist local preferences, acknowledgements and command evidence, not telemetry.
        if (
          saved.preferences &&
          [5, 10, 30].includes(saved.preferences.interval) &&
          ["C", "F"].includes(saved.preferences.unit) &&
          typeof saved.preferences.workspace === "string" &&
          typeof saved.preferences.showAcknowledged === "boolean"
        ) {
          setState((s) => ({
            ...s,
            preferences: saved.preferences,
            notifications: s.notifications.map((n) => ({
              ...n,
              acknowledged: Array.isArray(saved.acknowledged)
                ? saved.acknowledged.includes(n.id)
                : n.acknowledged,
            })),
            commands: Array.isArray(saved.commands)
              ? saved.commands
                  .filter(
                    (c: Command) =>
                      c &&
                      typeof c.id === "string" &&
                      s.equipment.some((e) => e.id === c.equipmentId) &&
                      typeof c.target === "boolean" &&
                      Number.isFinite(Date.parse(c.createdAt)) &&
                      ["pending", "confirmed", "failed"].includes(c.status),
                  )
                  .slice(0, 100)
                  .map((c: Command) => ({
                    ...c,
                    status: c.status === "pending" ? "failed" : c.status,
                  }))
              : s.commands,
            equipment: s.equipment.map((e) => ({
              ...e,
              relay:
                typeof saved.relays?.[e.id] === "boolean"
                  ? saved.relays[e.id]
                  : e.relay,
            })),
          }));
        }
      }
    } catch {
      /* A restricted browser or an older local schema uses the reference dataset. */
    }
    setReady(true);
    setUpdated(new Date().toISOString());
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          preferences: state.preferences,
          acknowledged: state.notifications
            .filter((n) => n.acknowledged)
            .map((n) => n.id),
          commands: state.commands,
          relays: Object.fromEntries(
            state.equipment.map((e) => [e.id, e.relay]),
          ),
        }),
      );
    } catch {
      /* Session remains usable without browser storage. */
    }
  }, [state, ready]);
  const refresh = useCallback(() => {
    tick.current++;
    setState((s) => ({
      ...s,
      equipment: s.equipment.map((e, i) => {
        if (!e.connected) return e;
        const base = initialState.equipment.find((item) => item.id === e.id)!;
        const temperature = +(
          base.temperature +
          Math.sin(tick.current * 0.6 + i) * 0.08
        ).toFixed(1);
        return { ...e, temperature, lastSeen: new Date().toISOString() };
      }),
    }));
    setUpdated(new Date().toISOString());
  }, []);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(refresh, state.preferences.interval * 1000);
    return () => clearInterval(id);
  }, [paused, refresh, state.preferences.interval]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  // Keep pending commands in one place; navigating between views doesn't cancel a response.
  useEffect(() => {
    const pending = state.commands.filter((c) => c.status === "pending");
    const timers = pending.map((c) =>
      setTimeout(
        () => setState((s) => settleCommand(s, c.id)),
        Math.max(
          0,
          (c.outcome === "timeout" ? 5000 : 1800) -
            (Date.now() - Date.parse(c.createdAt)),
        ),
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [state.commands]);
  const sendCommand = (
    equipmentId: string,
    target: boolean,
    outcome: "respond" | "timeout",
  ) => {
    setState((s) => {
      const e = s.equipment.find((item) => item.id === equipmentId);
      if (!e || !canSend(e, s.commands)) return s;
      return {
        ...s,
        commands: [
          {
            id: `CMD-${crypto.randomUUID().slice(0, 8)}`,
            equipmentId,
            target,
            outcome,
            status: "pending" as const,
            createdAt: new Date().toISOString(),
          },
          ...s.commands,
        ].slice(0, 100),
      };
    });
  };
  return (
    <Context.Provider
      value={{
        state,
        scope,
        setScope,
        paused,
        setPaused,
        updated,
        ready,
        refresh,
        acknowledge: (id) =>
          setState((s) => ({
            ...s,
            notifications: s.notifications.map((n) =>
              n.id === id ? { ...n, acknowledged: true } : n,
            ),
          })),
        sendCommand,
        savePreferences: (preferences) => {
          setState((s) => ({ ...s, preferences }));
          setToast("Workspace preferences saved.");
        },
        toast,
        notify: setToast,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useWorkspace = () => {
  const value = useContext(Context);
  if (!value) throw new Error("WorkspaceProvider is required");
  return value;
};
