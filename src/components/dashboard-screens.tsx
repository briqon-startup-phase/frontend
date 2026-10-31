"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  RefreshCw,
  Download,
  Search,
  CircleAlert,
  Check,
  ChevronDown,
  Radio,
  Pause,
  MapPin,
} from "lucide-react";
import { useWorkspace } from "./workspace-provider";
import { PageHeading, PanelHeading, Status, EmptyState } from "./ui";
import { TemperatureChart, EnergyChart } from "./charts";
import { EquipmentTable } from "./equipment-table";
import { NotificationFeed } from "./notification-feed";
import {
  sumEnergy,
  statusOf,
  temperatureText,
  outletName,
  clock,
  dateTime,
} from "@/lib/domain";
import { dailyFactors, weekDays, outlets } from "@/lib/sample-data";
import { downloadCsv } from "@/lib/export";
import type { Equipment, Preferences } from "@/lib/types";

function useScopedEquipment() {
  const { state, scope } = useWorkspace();
  return useMemo(
    () =>
      state.equipment.filter((e) => scope === "all" || e.outletId === scope),
    [state.equipment, scope],
  );
}
function RefreshButton() {
  const { refresh, notify } = useWorkspace();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="button secondary"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        refresh();
        setTimeout(() => {
          setBusy(false);
          notify("Sample readings refreshed.");
        }, 450);
      }}
    >
      <RefreshCw size={15} className={busy ? "spin" : ""} />
      {busy ? "Refreshing" : "Refresh"}
    </button>
  );
}
function Metric({
  label,
  value,
  unit,
  note,
  children,
}: {
  label: string;
  value: string | number;
  unit?: string;
  note: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <div className="metric-value">
        {value}
        {unit && <span>{unit}</span>}
        {children}
      </div>
      <div className="metric-note">{note}</div>
    </div>
  );
}
function energyDays(equipment: Equipment[]) {
  return dailyFactors.map((f) =>
    sumEnergy(
      equipment.map((e) => ({ ...e, energy: +(e.energy * f).toFixed(1) })),
    ),
  );
}
function TemperaturePanel({ equipment }: { equipment: Equipment[] }) {
  const { state, paused, updated } = useWorkspace();
  const [selected, setSelected] = useState("");
  const [period, setPeriod] = useState("24h");
  const unit = state.preferences.unit;
  const asset = equipment.find((e) => e.id === selected) || equipment[0];
  if (!asset) return null;
  return (
    <section className="panel temperature-panel">
      <PanelHeading title="Temperature monitor">
        <div className="segmented" aria-label="Temperature period">
          {["6h", "24h"].map((p) => (
            <button
              key={p}
              aria-pressed={period === p}
              className={period === p ? "selected" : ""}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </PanelHeading>
      <div className="temperature-heading">
        <div>
          <div className="select-inline">
            <select
              aria-label="Equipment to monitor"
              value={asset.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {equipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <ChevronDown size={13} />
          </div>
          <div className="temperature-value">
            <strong>{temperatureText(asset.temperature, unit)}</strong>
            <Status status={statusOf(asset)} />
          </div>
        </div>
        <div className="range-label">
          Configured range
          <strong>
            {temperatureText(asset.min, unit)} –{" "}
            {temperatureText(asset.max, unit)}
          </strong>
        </div>
      </div>
      <TemperatureChart equipment={asset} unit={unit} period={period} />
      <div className="chart-footer">
        <span className="reading-freshness">
          <span
            className={`tiny-dot ${paused || !asset.connected ? "paused" : ""}`}
          />
          {!asset.connected
            ? `Last reading ${clock(asset.lastSeen)} WIB`
            : paused
              ? "Playback paused"
              : `Updated ${clock(updated)} WIB`}
        </span>
        <Link className="text-link" href={`/equipment/${asset.id}`}>
          Equipment details
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
export function OverviewScreen({
  selectedRoom = "all",
}: {
  selectedRoom?: string;
}) {
  const { state } = useWorkspace();
  const router = useRouter();
  const scopedEquipment = useScopedEquipment();
  const rooms = useMemo(
    () =>
      Array.from(
        new Map(
          scopedEquipment.map((e) => [
            `${e.outletId}:${e.zone}`,
            {
              key: `${e.outletId}:${e.zone}`,
              name: e.zone,
              outletId: e.outletId,
            },
          ]),
        ).values(),
      ).sort(
        (a, b) =>
          outletName(a.outletId).localeCompare(outletName(b.outletId)) ||
          a.name.localeCompare(b.name),
      ),
    [scopedEquipment],
  );
  const room = rooms.find((r) => r.key === selectedRoom);
  const equipment = useMemo(
    () =>
      selectedRoom === "all"
        ? scopedEquipment
        : scopedEquipment.filter(
            (e) => `${e.outletId}:${e.zone}` === selectedRoom,
          ),
    [scopedEquipment, selectedRoom],
  );
  const notifications = state.notifications.filter((n) =>
    equipment.some((e) => e.id === n.equipmentId),
  );
  const pending = notifications.filter((n) => !n.acknowledged).length;
  const attention = equipment.filter((e) => statusOf(e) !== "In range").length;
  const connected = equipment.filter((e) => e.connected).length;
  const chartValues = useMemo(() => energyDays(equipment), [equipment]);
  return (
    <>
      <PageHeading
        title={room ? room.name : "Overview"}
        description={
          room
            ? `Equipment monitoring in ${room.name} · ${outletName(room.outletId)}.`
            : "Equipment monitoring across all rooms in the selected outlets."
        }
      >
        <RefreshButton />
      </PageHeading>
      <div className="room-toolbar">
        <div className="room-picker">
          <MapPin size={17} aria-hidden="true" />
          <label htmlFor="overview-room">Room</label>
          <select
            id="overview-room"
            value={selectedRoom}
            onChange={(event) =>
              router.push(
                event.target.value === "all"
                  ? "/"
                  : `/?room=${encodeURIComponent(event.target.value)}`,
                { scroll: false },
              )
            }
          >
            <option value="all">All rooms</option>
            {selectedRoom !== "all" && !room && (
              <option value={selectedRoom} disabled>
                Room unavailable
              </option>
            )}
            {rooms.map((r) => (
              <option key={r.key} value={r.key}>
                {r.name} · {outletName(r.outletId)}
              </option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </div>
        <span className="room-view-summary" aria-live="polite">
          {selectedRoom === "all" ? `${rooms.length} rooms` : "1 room"} ·{" "}
          {equipment.length} {equipment.length === 1 ? "asset" : "assets"}
        </span>
      </div>
      {!equipment.length ? (
        <EmptyState
          title="No equipment in this room"
          description="This room is unavailable in the selected outlet. Choose another room or return to all rooms."
        >
          <Link href="/" className="button secondary">
            View all rooms
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className={`attention-strip ${!attention ? "all-clear" : ""}`}>
            <div>
              <CircleAlert size={17} />
              <span>
                {attention ? (
                  <>
                    <strong>
                      {attention}{" "}
                      {attention === 1 ? "asset needs" : "assets need"}{" "}
                      attention.
                    </strong>{" "}
                    Review current conditions and connection status.
                  </>
                ) : (
                  <>
                    <strong>Equipment is within configured ranges.</strong> Keep
                    an eye on new readings.
                  </>
                )}
              </span>
            </div>
            <Link
              href={`/equipment?condition=${attention ? "attention" : "all"}`}
            >
              {attention ? "Review equipment" : "View equipment"}
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="metrics-strip">
            <Metric
              label="Equipment monitored"
              value={equipment.length}
              note={
                <>
                  {selectedRoom === "all"
                    ? `${rooms.length} rooms in this view`
                    : `${room?.name} · ${outletName(room?.outletId || "")}`}
                </>
              }
            />
            <Metric
              label="Connected devices"
              value={connected}
              unit={`/ ${equipment.length}`}
              note={
                <>
                  <span className="tiny-dot" />
                  {equipment.length - connected} offline
                </>
              }
            />
            <Metric
              label="Needs attention"
              value={attention}
              note={`${pending} unacknowledged notifications`}
            />
            <Metric
              label="Energy today"
              value={sumEnergy(equipment).toFixed(1)}
              unit="kWh"
              note="Sample readings · since 00:00 WIB"
            />
          </div>
          <div className="dashboard-grid">
            <TemperaturePanel equipment={equipment} />
            <section className="panel notifications-panel">
              <PanelHeading title="Notifications" href="/notifications" />
              <div className="notification-summary">
                <strong>{pending}</strong>
                <span>need your review</span>
              </div>
              <NotificationFeed
                notifications={notifications
                  .filter((n) => !n.acknowledged)
                  .slice(0, 3)}
                compact
              />
              <div className="panel-bottom-note">
                Acknowledging records a review; it does not resolve the
                condition.
              </div>
            </section>
            <section className="panel equipment-panel">
              <PanelHeading
                title="Equipment at a glance"
                description={`${equipment.length} ${equipment.length === 1 ? "asset" : "assets"} · ${room ? room.name : "All rooms"}`}
                href="/equipment"
              />
              <EquipmentTable equipment={equipment} compact />
              <div className="table-footer">
                <span>
                  Showing all {equipment.length}{" "}
                  {equipment.length === 1 ? "asset" : "assets"}
                </span>
                <Link href="/equipment" className="text-link">
                  Manage equipment
                  <ArrowRight size={14} />
                </Link>
              </div>
            </section>
            <section className="panel energy-summary">
              <PanelHeading title="Energy consumption" href="/energy" />
              <div className="energy-heading">
                <strong>
                  {chartValues.reduce((a, b) => a + b, 0).toFixed(1)}
                  <span>kWh</span>
                </strong>
                <span>This week · 25–31 Oct</span>
              </div>
              <EnergyChart values={chartValues} compact />
              <div className="chart-footer">
                <span>Daily consumption</span>
                <span>
                  <i className="legend-square" />
                  Today
                </span>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}

export function EquipmentScreen({
  initialCondition = "all",
}: {
  initialCondition?: string;
}) {
  const { state } = useWorkspace();
  const equipment = useScopedEquipment();
  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState(initialCondition);
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState("name");
  const rows = equipment
    .filter(
      (e) =>
        (kind === "all" || e.kind === kind) &&
        (condition === "all" ||
          (condition === "attention"
            ? statusOf(e) !== "In range"
            : condition === "online"
              ? e.connected
              : !e.connected)) &&
        `${e.name} ${e.id} ${e.zone} ${outletName(e.outletId)}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "energy"
        ? b.energy - a.energy
        : sort === "temperature"
          ? b.temperature - a.temperature
          : a.id.localeCompare(b.id),
    );
  function exportEquipment() {
    downloadCsv("briqon-equipment-sample.csv", [
      [
        "Equipment ID",
        "Name",
        "Outlet",
        "Condition",
        `Temperature (${state.preferences.unit})`,
        "Power (kW)",
        "Energy today (kWh)",
        "Data source",
      ],
      ...rows.map((e) => [
        e.id,
        e.name,
        outletName(e.outletId),
        statusOf(e),
        e.connected
          ? temperatureText(e.temperature, state.preferences.unit)
          : "Stale",
        e.connected ? e.power : "Unavailable",
        e.energy,
        "Simulation",
      ]),
    ]);
  }
  return (
    <>
      <PageHeading
        title="Equipment"
        description="Monitor the condition of every connected asset."
      >
        <button className="button secondary" onClick={exportEquipment}>
          <Download size={15} />
          Export CSV
        </button>
      </PageHeading>
      <div className="equipment-summary">
        <span>
          <strong>{equipment.length}</strong> assets
        </span>
        <span>
          <i className="tiny-dot" />
          {equipment.filter((e) => e.connected).length} connected
        </span>
        <span>
          <i className="tiny-dot warning-dot" />
          {equipment.filter((e) => statusOf(e) !== "In range").length} need
          attention
        </span>
      </div>
      <section className="panel list-panel">
        <div className="filter-toolbar">
          <div className="field-search">
            <Search size={16} />
            <input
              aria-label="Search equipment"
              placeholder="Search equipment or location…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="filter-selects">
            <select
              aria-label="Filter condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="all">All conditions</option>
              <option value="attention">Needs attention</option>
              <option value="online">Connected</option>
              <option value="offline">Offline</option>
            </select>
            <select
              aria-label="Filter equipment type"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="all">All types</option>
              <option>Chiller</option>
              <option>Freezer</option>
              <option>Cold storage</option>
            </select>
            <select
              aria-label="Sort equipment"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="name">Sort: Equipment ID</option>
              <option value="energy">Sort: Energy use</option>
              <option value="temperature">Sort: Temperature</option>
            </select>
          </div>
        </div>
        <EquipmentTable equipment={rows} />
        <div className="table-footer">
          <span>
            {rows.length} of {equipment.length} assets
          </span>
          <button
            className="text-button"
            onClick={() => {
              setQuery("");
              setCondition("all");
              setKind("all");
              setSort("name");
            }}
          >
            Reset filters
          </button>
        </div>
      </section>
      <div className="info-note">
        <Radio size={16} />
        <span>
          Readings are simulated. Offline equipment retains its last known
          temperature, clearly marked as stale.
        </span>
      </div>
    </>
  );
}

export function EnergyScreen() {
  const equipment = useScopedEquipment();
  const [period, setPeriod] = useState("week");
  const week = useMemo(() => energyDays(equipment), [equipment]);
  const weights = [0.08, 0.12, 0.15, 0.18, 0.2, 0.27];
  const totalToday = sumEnergy(equipment);
  const hourly = weights.map((w, i) =>
    i === weights.length - 1
      ? +(
          totalToday -
          weights
            .slice(0, -1)
            .reduce((a, b) => a + +(totalToday * b).toFixed(1), 0)
        ).toFixed(1)
      : +(totalToday * w).toFixed(1),
  );
  const values = period === "week" ? week : hourly;
  const labels =
    period === "week"
      ? weekDays
      : ["00–04", "04–08", "08–12", "12–16", "16–20", "20–24"];
  const total = values.reduce((a, b) => a + b, 0);
  const sorted = [...equipment].sort((a, b) => b.energy - a.energy);
  const top = sorted[0];
  return (
    <>
      <PageHeading
        title="Energy"
        description="Understand consumption across your refrigeration equipment."
      >
        <button
          className="button secondary"
          onClick={() =>
            downloadCsv("briqon-energy-sample.csv", [
              ["Period", "Energy (kWh)", "Source"],
              ...values.map((v, i) => [
                labels[i],
                v.toFixed(1),
                "Sample historical data",
              ]),
            ])
          }
        >
          <Download size={15} />
          Export report
        </button>
      </PageHeading>
      <div className="metrics-strip energy-metrics">
        <Metric
          label={
            period === "week" ? "Consumption this week" : "Consumption today"
          }
          value={total.toFixed(1)}
          unit="kWh"
          note={
            period === "week"
              ? "25–31 October 2026"
              : "31 October 2026 · full-day sample"
          }
        />
        <Metric
          label="Current power"
          value={equipment
            .filter((e) => e.connected)
            .reduce((a, b) => a + b.power, 0)
            .toFixed(2)}
          unit="kW"
          note="Connected equipment only"
        />
        <Metric
          label="Largest consumer today"
          value={top?.energy.toFixed(1) || "0.0"}
          unit="kWh"
          note={top?.name || "No equipment in scope"}
        />
      </div>
      <div className="energy-page-grid">
        <section className="panel">
          <PanelHeading title="Consumption over time">
            <div className="segmented">
              {[
                { id: "today", label: "Today" },
                { id: "week", label: "7 days" },
              ].map((p) => (
                <button
                  key={p.id}
                  aria-pressed={period === p.id}
                  onClick={() => setPeriod(p.id)}
                  className={period === p.id ? "selected" : ""}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </PanelHeading>
          <p className="chart-caption">
            {period === "week"
              ? "Daily energy · kWh"
              : "Four-hour energy totals · kWh"}
          </p>
          <EnergyChart values={values} labels={labels} />
          <div className="chart-footer">
            <span>Sample historical readings</span>
            <span>{period === "week" ? "25–31 Oct 2026" : "31 Oct 2026"}</span>
          </div>
        </section>
        <section className="panel">
          <PanelHeading
            title="Consumption by outlet"
            description="Today's share of total energy"
          />
          <div className="outlet-breakdown">
            {outlets
              .filter((o) => equipment.some((e) => e.outletId === o.id))
              .map((o) => {
                const value = sumEnergy(
                  equipment.filter((e) => e.outletId === o.id),
                );
                return (
                  <div key={o.id}>
                    <div className="breakdown-label">
                      <span>{o.name}</span>
                      <strong>
                        {value.toFixed(1)} <small>kWh</small>
                      </strong>
                    </div>
                    <div className="bar-track">
                      <span
                        style={{
                          width: `${totalToday ? (value / totalToday) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="muted small">
                      {totalToday
                        ? ((value / totalToday) * 100).toFixed(1)
                        : "0.0"}
                      % of today's energy
                    </span>
                  </div>
                );
              })}
          </div>
        </section>
      </div>
      <section className="panel">
        <PanelHeading
          title="Equipment consumption"
          description="Ranked by today's measured energy"
        />
        <div className="energy-ranking">
          {sorted.map((e, i) => (
            <div key={e.id} className="energy-ranking-row">
              <span className="rank">{i + 1}</span>
              <div>
                <Link href={`/equipment/${e.id}`} className="equipment-name">
                  {e.name}
                </Link>
                <span className="row-meta">{outletName(e.outletId)}</span>
              </div>
              <div className="ranking-track">
                <span
                  style={{
                    width: `${top?.energy ? (e.energy / top.energy) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="num">
                <strong>
                  {e.energy.toFixed(1)} <small>kWh</small>
                </strong>
                <span className="row-meta">
                  {totalToday
                    ? ((e.energy / totalToday) * 100).toFixed(1)
                    : "0.0"}
                  % of total
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function NotificationsScreen() {
  const { state, acknowledge, notify, ready } = useWorkspace();
  const equipment = useScopedEquipment();
  const [tab, setTab] = useState(
    state.preferences.showAcknowledged ? "all" : "unreviewed",
  );
  const [type, setType] = useState("all");
  useEffect(() => {
    if (ready)
      setTab(state.preferences.showAcknowledged ? "all" : "unreviewed");
  }, [ready, state.preferences.showAcknowledged]);
  const notifications = state.notifications.filter((n) =>
    equipment.some((e) => e.id === n.equipmentId),
  );
  const unreviewed = notifications.filter((n) => !n.acknowledged);
  const rows = notifications.filter(
    (n) =>
      (tab === "all" ||
        (tab === "unreviewed" && !n.acknowledged) ||
        (tab === "acknowledged" && n.acknowledged)) &&
      (type === "all" || n.severity === type),
  );
  return (
    <>
      <PageHeading
        title="Notifications"
        description="Review conditions, record follow-up, and stay informed."
      >
        <button
          className="button secondary"
          disabled={!unreviewed.length}
          onClick={() => {
            unreviewed.forEach((n) => acknowledge(n.id));
            notify("All notifications in this outlet view acknowledged.");
          }}
        >
          <Check size={15} />
          Acknowledge all
        </button>
      </PageHeading>
      <section className="panel">
        <div className="notification-toolbar">
          <div
            className="underline-tabs"
            role="group"
            aria-label="Notification status"
          >
            {[
              { id: "all", label: "All", count: notifications.length },
              {
                id: "unreviewed",
                label: "Unacknowledged",
                count: unreviewed.length,
              },
              {
                id: "acknowledged",
                label: "Acknowledged",
                count: notifications.length - unreviewed.length,
              },
            ].map((t) => (
              <button
                aria-pressed={tab === t.id}
                className={tab === t.id ? "selected" : ""}
                key={t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                <span>{t.count}</span>
              </button>
            ))}
          </div>
          <select
            aria-label="Notification type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="warning">Temperature</option>
            <option value="offline">Connection</option>
            <option value="resolved">Returned to range</option>
          </select>
        </div>
        <NotificationFeed notifications={rows} />
      </section>
      <div className="info-note">
        <CircleAlert size={16} />
        <span>
          Acknowledged means reviewed. Inspect the equipment to confirm that the
          underlying condition has been resolved.
        </span>
      </div>
    </>
  );
}

export function ActivityScreen() {
  const { state } = useWorkspace();
  const equipment = useScopedEquipment();
  const [filter, setFilter] = useState("all");
  const commands = state.commands.filter(
    (c) =>
      equipment.some((e) => e.id === c.equipmentId) &&
      (filter === "all" || c.status === filter),
  );
  return (
    <>
      <PageHeading
        title="Activity log"
        description="A traceable record of equipment control and device responses."
      >
        <button
          className="button secondary"
          onClick={() =>
            downloadCsv("briqon-control-history-sample.csv", [
              [
                "Command",
                "Equipment",
                "Target relay state",
                "Result",
                "Created at (UTC)",
                "Evidence",
              ],
              ...commands.map((c) => [
                c.id,
                c.equipmentId,
                c.target ? "On" : "Off",
                c.status,
                c.createdAt,
                c.status === "confirmed"
                  ? "Simulated device-reported relay state"
                  : "No confirmation",
              ]),
            ])
          }
        >
          <Download size={15} />
          Export log
        </button>
      </PageHeading>
      <section className="panel">
        <PanelHeading
          title="Control history"
          description={`${commands.length} ${commands.length === 1 ? "command" : "commands"} in this view`}
        >
          <select
            aria-label="Command result"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All results</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
          </select>
        </PanelHeading>
        {commands.length ? (
          <div className="activity-list">
            {commands.map((c) => {
              const e = state.equipment.find((e) => e.id === c.equipmentId)!;
              return (
                <article key={c.id}>
                  <div className={`activity-marker ${c.status}`}>
                    {c.status === "confirmed" ? (
                      <Check size={16} />
                    ) : c.status === "pending" ? (
                      <RefreshCw size={16} />
                    ) : (
                      <CircleAlert size={16} />
                    )}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">
                      <Link href={`/equipment/${e.id}`}>{e.name}</Link>
                      <Status
                        status={c.status[0].toUpperCase() + c.status.slice(1)}
                      />
                    </div>
                    <p>
                      Set relay {c.target ? "on" : "off"} ·{" "}
                      {outletName(e.outletId)}
                    </p>
                    <span className="row-meta">
                      {c.status === "confirmed"
                        ? "Simulated device reported the requested relay state. Physical operation is not verified."
                        : c.status === "pending"
                          ? "Waiting for a simulated device response. Relay state has not been changed."
                          : "No device confirmation received. Last reported relay state is retained."}
                    </span>
                    <span className="activity-id">{c.id}</span>
                  </div>
                  <time dateTime={c.createdAt}>
                    {dateTime(c.createdAt)} WIB
                  </time>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No matching commands"
            description="Control actions and their responses will appear here. Open an equipment detail to send a simulated command."
          >
            <Link href="/equipment" className="button secondary">
              Browse equipment
              <ArrowRight size={14} />
            </Link>
          </EmptyState>
        )}
      </section>
    </>
  );
}

export function SettingsScreen() {
  const { state, savePreferences, paused, setPaused, ready } = useWorkspace();
  const [draft, setDraft] = useState<Preferences>(state.preferences);
  useEffect(() => {
    if (ready) setDraft(state.preferences);
  }, [ready, state.preferences]);
  const [error, setError] = useState("");
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.workspace.trim()) {
      setError("Enter a workspace name.");
      return;
    }
    savePreferences({ ...draft, workspace: draft.workspace.trim() });
    setError("");
  }
  return (
    <>
      <PageHeading
        title="Settings"
        description="Make this workspace work for your day-to-day operations."
      />
      <form onSubmit={save} className="settings-form">
        <section className="settings-section">
          <div>
            <h2>Workspace</h2>
            <p>
              The name and measurement units used throughout your dashboard.
            </p>
          </div>
          <div className="settings-fields">
            <label>
              Workspace name
              <input
                maxLength={40}
                value={draft.workspace}
                onChange={(e) =>
                  setDraft({ ...draft, workspace: e.target.value })
                }
                aria-invalid={!!error}
                aria-describedby={error ? "workspace-error" : undefined}
              />
            </label>
            {error && (
              <p className="form-error" id="workspace-error" role="alert">
                {error}
              </p>
            )}
            <label>
              Temperature unit
              <select
                value={draft.unit}
                onChange={(e) =>
                  setDraft({ ...draft, unit: e.target.value as "C" | "F" })
                }
              >
                <option value="C">Celsius (°C)</option>
                <option value="F">Fahrenheit (°F)</option>
              </select>
            </label>
          </div>
        </section>
        <section className="settings-section">
          <div>
            <h2>Monitoring preferences</h2>
            <p>
              Set the sample reading interval and your preferred notification
              view.
            </p>
          </div>
          <div className="settings-fields">
            <label>
              Sample refresh interval
              <select
                value={draft.interval}
                onChange={(e) =>
                  setDraft({ ...draft, interval: +e.target.value })
                }
              >
                <option value={5}>Every 5 seconds</option>
                <option value={10}>Every 10 seconds</option>
                <option value={30}>Every 30 seconds</option>
              </select>
            </label>
            <div className="switch-row">
              <div>
                <strong>Include acknowledged notifications</strong>
                <p>Show reviewed notifications when opening the history.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.showAcknowledged}
                aria-label="Include acknowledged notifications"
                className={`toggle ${draft.showAcknowledged ? "on" : ""}`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    showAcknowledged: !draft.showAcknowledged,
                  })
                }
              >
                <span />
              </button>
            </div>
          </div>
        </section>
        <div className="settings-save">
          <span>Preferences are saved in this browser.</span>
          <button className="button primary" type="submit">
            Save changes
            <Check size={15} />
          </button>
        </div>
      </form>
      <section className="settings-section data-source-settings">
        <div>
          <h2>Data source</h2>
          <p>
            Sample equipment and historical readings for exploring the
            workspace.
          </p>
        </div>
        <div className="settings-fields">
          <div className="source-status">
            <Radio size={18} />
            <div>
              <strong>Simulation adapter</strong>
              <p>No physical devices connected</p>
            </div>
            <Status status={paused ? "Paused" : "Running"} />
          </div>
          <button
            className="button secondary"
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Radio size={15} /> : <Pause size={15} />}{" "}
            {paused ? "Resume sample playback" : "Pause sample playback"}
          </button>
        </div>
      </section>
    </>
  );
}
