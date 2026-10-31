import type { Equipment, WorkspaceState, Command } from "./types.ts";
import { outlets } from "./sample-data.ts";

export const sumEnergy = (equipment: Equipment[]) =>
  equipment.reduce((sum, item) => sum + Math.round(item.energy * 100), 0) / 100;
export const statusOf = (equipment: Equipment) =>
  !equipment.connected
    ? "Offline"
    : equipment.temperature > equipment.max ||
        equipment.temperature < equipment.min
      ? "Needs attention"
      : "In range";
export const toTemperature = (value: number, unit: "C" | "F") =>
  unit === "F" ? (value * 9) / 5 + 32 : value;
export const temperatureText = (value: number, unit: "C" | "F" = "C") =>
  `${toTemperature(value, unit).toFixed(1)}°${unit}`;
export const outletName = (id: string) =>
  outlets.find((outlet) => outlet.id === id)?.name || id;
export const clock = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

// Submission cannot change the relay. Only a device response updates its reported state.
export function settleCommand(
  state: WorkspaceState,
  id: string,
): WorkspaceState {
  const command = state.commands.find((item) => item.id === id);
  if (!command || command.status !== "pending") return state;
  const equipment = state.equipment.find(
    (item) => item.id === command.equipmentId,
  );
  const confirmed = equipment?.connected && command.outcome === "respond";
  return {
    ...state,
    commands: state.commands.map((item) =>
      item.id === id
        ? { ...item, status: confirmed ? "confirmed" : "failed" }
        : item,
    ),
    equipment: confirmed
      ? state.equipment.map((item) =>
          item.id === command.equipmentId
            ? { ...item, relay: command.target }
            : item,
        )
      : state.equipment,
  };
}
export function canSend(equipment: Equipment, commands: Command[]) {
  return (
    equipment.connected &&
    !commands.some(
      (item) => item.equipmentId === equipment.id && item.status === "pending",
    )
  );
}
