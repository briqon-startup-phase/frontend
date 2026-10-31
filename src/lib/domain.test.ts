import test from "node:test";
import assert from "node:assert/strict";
import {
  settleCommand,
  canSend,
  statusOf,
  sumEnergy,
  toTemperature,
} from "./domain.ts";
import type { WorkspaceState, Equipment } from "./types.ts";
const device: Equipment = {
  id: "test",
  name: "Chiller",
  kind: "Chiller",
  outletId: "depok",
  zone: "Kitchen",
  temperature: 3,
  min: 0,
  max: 5,
  power: 0.5,
  energy: 1.01,
  connected: true,
  relay: true,
  lastSeen: "2026-10-31T07:30:00Z",
  history: [],
};
function state(
  outcome: "respond" | "timeout",
  connected = true,
): WorkspaceState {
  return {
    equipment: [{ ...device, connected }],
    commands: [
      {
        id: "test-cmd",
        equipmentId: "test",
        target: false,
        createdAt: "2026-10-31T07:30:00Z",
        status: "pending",
        outcome,
      },
    ],
    notifications: [],
    preferences: {
      workspace: "Test",
      interval: 10,
      unit: "C",
      showAcknowledged: true,
    },
  };
}
test("pending submission leaves relay unchanged and prevents duplicate commands", () => {
  const s = state("respond");
  assert.equal(s.equipment[0].relay, true);
  assert.equal(canSend(s.equipment[0], s.commands), false);
});
test("response updates only device-reported state and is idempotent", () => {
  const s = settleCommand(state("respond"), "test-cmd");
  assert.equal(s.commands[0].status, "confirmed");
  assert.equal(s.equipment[0].relay, false);
  assert.equal(settleCommand(s, "test-cmd"), s);
});
test("timeout and offline device never change reported relay state", () => {
  for (const s of [state("timeout"), state("respond", false)]) {
    const next = settleCommand(s, "test-cmd");
    assert.equal(next.commands[0].status, "failed");
    assert.equal(next.equipment[0].relay, true);
  }
});
test("freshness takes precedence over in-range temperature", () =>
  assert.equal(statusOf({ ...device, connected: false }), "Offline"));
test("energy sum uses displayed rounded amounts and conversions retain negative values", () => {
  assert.equal(sumEnergy([device, { ...device, energy: 2.02 }]), 3.03);
  assert.equal(toTemperature(-20, "F"), -4);
});
