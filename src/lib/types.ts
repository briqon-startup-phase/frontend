export type EquipmentKind = "Chiller" | "Freezer" | "Cold storage";
export type Equipment = {
  id: string;
  name: string;
  kind: EquipmentKind;
  outletId: string;
  zone: string;
  temperature: number;
  min: number;
  max: number;
  power: number;
  energy: number;
  connected: boolean;
  relay: boolean;
  lastSeen: string;
  history: number[];
};
export type Notification = {
  id: string;
  equipmentId: string;
  title: string;
  description: string;
  severity: "warning" | "offline" | "resolved";
  createdAt: string;
  acknowledged: boolean;
};
export type Command = {
  id: string;
  equipmentId: string;
  target: boolean;
  createdAt: string;
  status: "pending" | "confirmed" | "failed";
  outcome: "respond" | "timeout";
};
export type Preferences = {
  workspace: string;
  interval: number;
  unit: "C" | "F";
  showAcknowledged: boolean;
};
export type WorkspaceState = {
  equipment: Equipment[];
  notifications: Notification[];
  commands: Command[];
  preferences: Preferences;
};
