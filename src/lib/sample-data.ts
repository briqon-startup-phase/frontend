import type { WorkspaceState } from "./types";

// Reference data only. Replace the sample adapter with the authenticated platform API.
export const outlets = [
  { id: "depok", name: "Depok", location: "Depok" },
  { id: "menteng", name: "Menteng", location: "Menteng" },
  { id: "cipinang", name: "Cipinang", location: "Cipinang" },
];
const cold = [
  3.3, 3.2, 3.4, 3.1, 3.5, 3.7, 3.4, 3.1, 3.3, 3.6, 3.2, 3.5, 3.9, 3.8, 4.1,
  4.0, 4.3, 4.6, 4.5, 4.8, 5.3, 5.7, 6.0, 6.4, 6.8,
];
const frozen = [
  -20.0, -20.1, -19.8, -19.3, -19.7, -20, -20.3, -20, -19.5, -19.8, -19.4,
  -20.1, -20.4, -20.2, -19.7, -19.9, -19.6, -19.8, -20, -19.5, -19.8, -19.4,
  -19.2, -19.6, -19.4,
];
export const initialState: WorkspaceState = {
  equipment: [
    {
      id: "BRQ-001",
      name: "Walk-in chiller",
      kind: "Chiller",
      outletId: "depok",
      zone: "Main kitchen",
      temperature: 6.8,
      min: 0,
      max: 5,
      power: 0.84,
      energy: 18.4,
      connected: true,
      relay: true,
      lastSeen: "2026-10-31T07:30:00Z",
      history: cold,
    },
    {
      id: "BRQ-002",
      name: "Chest freezer",
      kind: "Freezer",
      outletId: "menteng",
      zone: "Prep area",
      temperature: -19.4,
      min: -24,
      max: -18,
      power: 0.46,
      energy: 12.6,
      connected: true,
      relay: true,
      lastSeen: "2026-10-31T07:30:00Z",
      history: frozen,
    },
    {
      id: "BRQ-003",
      name: "Display chiller",
      kind: "Chiller",
      outletId: "cipinang",
      zone: "Front counter",
      temperature: 3.2,
      min: 0,
      max: 5,
      power: 0,
      energy: 9.2,
      connected: false,
      relay: true,
      lastSeen: "2026-10-31T07:12:00Z",
      history: cold.map((_, i) => +(3 + Math.sin(i) * 0.5).toFixed(1)),
    },
  ],
  notifications: [
    {
      id: "NTF-103",
      equipmentId: "BRQ-001",
      title: "Temperature above range",
      description:
        "Walk-in chiller reached 6.8°C. The configured upper limit is 5.0°C. Inspect the door seal and cooling conditions.",
      severity: "warning",
      createdAt: "2026-10-31T07:24:00Z",
      acknowledged: false,
    },
    {
      id: "NTF-102",
      equipmentId: "BRQ-003",
      title: "Equipment disconnected",
      description:
        "Display chiller in Cipinang stopped reporting at 14:12 WIB. Check the device power supply and network connection.",
      severity: "offline",
      createdAt: "2026-10-31T07:17:00Z",
      acknowledged: false,
    },
    {
      id: "NTF-101",
      equipmentId: "BRQ-002",
      title: "Temperature back in range",
      description:
        "Chest freezer in Menteng returned to its configured temperature range. Continue normal monitoring.",
      severity: "resolved",
      createdAt: "2026-10-31T05:45:00Z",
      acknowledged: true,
    },
  ],
  commands: [
    {
      id: "CMD-1042",
      equipmentId: "BRQ-002",
      target: true,
      createdAt: "2026-10-31T06:40:00Z",
      status: "confirmed",
      outcome: "respond",
    },
    {
      id: "CMD-1041",
      equipmentId: "BRQ-003",
      target: true,
      createdAt: "2026-10-31T05:15:00Z",
      status: "failed",
      outcome: "timeout",
    },
  ],
  preferences: {
    workspace: "BRIQON Workspace",
    interval: 10,
    unit: "C",
    showAcknowledged: true,
  },
};
export const sampleDate = "2026-10-31";
export const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const dailyFactors = [0.86, 0.93, 0.89, 0.96, 0.91, 0.98, 1];
