"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Power,
  Radio,
  ShieldCheck,
  RefreshCw,
  Check,
  Clock3,
  CircleAlert,
} from "lucide-react";
import { useWorkspace } from "./workspace-provider";
import { PageHeading, PanelHeading, Status, Modal } from "./ui";
import { TemperatureChart } from "./charts";
import { NotificationFeed } from "./notification-feed";
import {
  statusOf,
  temperatureText,
  outletName,
  clock,
  canSend,
  dateTime,
} from "@/lib/domain";
export function EquipmentDetail({ id }: { id: string }) {
  const { state, sendCommand, paused, refresh, notify } = useWorkspace();
  const [confirm, setConfirm] = useState(false);
  const [outcome, setOutcome] = useState<"respond" | "timeout">("respond");
  const [period, setPeriod] = useState("24h");
  const equipment = state.equipment.find((e) => e.id === id);
  const unit = state.preferences.unit;
  if (!equipment)
    return (
      <>
        <PageHeading
          title="Equipment not found"
          description="This equipment ID does not exist in the sample workspace."
        />
        <Link href="/equipment" className="button secondary">
          <ArrowLeft size={15} />
          Back to equipment
        </Link>
      </>
    );
  const commands = state.commands.filter((c) => c.equipmentId === id);
  const latest = commands[0];
  const pending = latest?.status === "pending";
  const allowed = canSend(equipment, state.commands);
  const target = !equipment.relay;
  return (
    <>
      <Link href="/equipment" className="back-link">
        <ArrowLeft size={14} />
        All equipment
      </Link>
      <PageHeading
        title={equipment.name}
        description={`${id} · ${outletName(equipment.outletId)} · ${equipment.zone}`}
      >
        <Status status={statusOf(equipment)} />
        <button
          className="button secondary"
          onClick={() => {
            refresh();
            notify(
              equipment.connected
                ? "Sample reading refreshed."
                : "Device is offline. Last known reading retained.",
            );
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </PageHeading>
      {!equipment.connected && (
        <div className="info-note">
          <CircleAlert size={17} />
          <span>
            This equipment is offline. Last reading:{" "}
            {dateTime(equipment.lastSeen)} WIB. Displayed temperatures are
            stale; remote control is unavailable.
          </span>
        </div>
      )}
      <div className="metrics-strip">
        <div className="metric">
          <span className="metric-label">
            {equipment.connected
              ? "Current temperature"
              : "Last known temperature"}
          </span>
          <div className="metric-value">
            {temperatureText(equipment.temperature, unit)}
          </div>
          <span className="metric-note">
            Range {temperatureText(equipment.min, unit)} to{" "}
            {temperatureText(equipment.max, unit)}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Current power</span>
          <div className="metric-value">
            {equipment.connected ? equipment.power.toFixed(2) : "—"}
            <span>kW</span>
          </div>
          <span className="metric-note">
            {equipment.connected
              ? "Sample instantaneous reading"
              : "No current reading available"}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Energy today</span>
          <div className="metric-value">
            {equipment.energy.toFixed(1)}
            <span>kWh</span>
          </div>
          <span className="metric-note">31 October · sample total</span>
        </div>
        <div className="metric">
          <span className="metric-label">Device connection</span>
          <div className="metric-value connection-value">
            {equipment.connected ? "Connected" : "Offline"}
          </div>
          <span className="metric-note">
            {paused && equipment.connected
              ? "Playback paused"
              : `Last seen ${clock(equipment.lastSeen)} WIB`}
          </span>
        </div>
      </div>
      <div className="detail-grid">
        <section className="panel">
          <PanelHeading title="Temperature history">
            <div className="segmented">
              {["6h", "24h"].map((p) => (
                <button
                  key={p}
                  className={period === p ? "selected" : ""}
                  aria-pressed={period === p}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </PanelHeading>
          <p className="chart-caption">
            {temperatureText(equipment.min, unit)} to{" "}
            {temperatureText(equipment.max, unit)} configured range ·{" "}
            {equipment.connected ? "sample history" : "last available history"}
          </p>
          <TemperatureChart equipment={equipment} unit={unit} period={period} />
          <div className="chart-footer">
            <span>Sample historical readings</span>
            <span>31 Oct 2026 · WIB</span>
          </div>
        </section>
        <section className="panel control-panel">
          <PanelHeading title="Relay control" />
          <div className="relay-state">
            <Power size={22} />
            <div>
              <strong>Relay {equipment.relay ? "on" : "off"}</strong>
              <span>Last reported output state</span>
            </div>
            <span
              className={`tiny-dot ${!equipment.relay || !equipment.connected ? "paused" : ""}`}
            />
          </div>
          <p className="control-description">
            Send a control command and wait for the device to report its output
            state.
          </p>
          <label className="response-select">
            Simulation response
            <select
              value={outcome}
              onChange={(e) =>
                setOutcome(e.target.value as "respond" | "timeout")
              }
              disabled={pending}
            >
              <option value="respond">Device responds</option>
              <option value="timeout">No response (timeout)</option>
            </select>
          </label>
          <button
            className="button primary relay-button"
            disabled={!allowed}
            onClick={() => setConfirm(true)}
          >
            {pending ? (
              <>
                <RefreshCw size={15} className="spin" />
                Waiting for response…
              </>
            ) : (
              <>
                <Power size={15} />
                Turn relay {target ? "on" : "off"}
              </>
            )}
          </button>
          {!equipment.connected && (
            <span className="control-disabled-reason">
              Reconnect the device before sending a command.
            </span>
          )}
          <div className="control-simulation-note">
            Simulated control · no physical equipment connected
          </div>
        </section>
      </div>
      {latest && (
        <section
          className={`command-result ${latest.status}`}
          aria-live="polite"
        >
          <div>
            {latest.status === "confirmed" ? (
              <Check size={18} />
            ) : latest.status === "pending" ? (
              <Clock3 size={18} />
            ) : (
              <CircleAlert size={18} />
            )}
            <div>
              <strong>
                {latest.status === "confirmed"
                  ? `Device reported relay ${latest.target ? "on" : "off"}`
                  : latest.status === "pending"
                    ? "Command sent. Awaiting device response."
                    : "Command failed. No device response received."}
              </strong>
              <p>
                {latest.status === "confirmed"
                  ? "Simulated device confirmation received. Physical equipment operation has not been verified."
                  : latest.status === "pending"
                    ? "The last reported relay state is retained until the device confirms a change."
                    : "The last reported relay state is retained. Check connectivity before trying again."}
              </p>
            </div>
          </div>
          <Link href="/activity" className="text-link">
            View activity
            <ArrowRight size={14} />
          </Link>
        </section>
      )}
      <div className="detail-grid lower-detail">
        <section className="panel">
          <PanelHeading title="Equipment notifications" href="/notifications" />
          <NotificationFeed
            notifications={state.notifications.filter(
              (n) => n.equipmentId === id,
            )}
          />
        </section>
        <section className="panel">
          <PanelHeading title="Connection & evidence" />
          <dl className="evidence-list">
            <div>
              <dt>Device platform</dt>
              <dd>ESP32-S3</dd>
            </div>
            <div>
              <dt>Equipment ID</dt>
              <dd>{id}</dd>
            </div>
            <div>
              <dt>Connection</dt>
              <dd>{equipment.connected ? "Simulated online" : "Offline"}</dd>
            </div>
            <div>
              <dt>Reported relay</dt>
              <dd>{equipment.relay ? "On" : "Off"}</dd>
            </div>
            <div>
              <dt>Physical operation</dt>
              <dd>Not verified</dd>
            </div>
          </dl>
          <div className="evidence-note">
            <ShieldCheck size={16} />
            <span>
              A relay response confirms the reported output. Independent
              feedback is needed to verify physical operation.
            </span>
          </div>
        </section>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Turn relay ${target ? "on" : "off"}?`}
      >
        <div className="confirm-content">
          <div className="confirm-equipment">
            <strong>{equipment.name}</strong>
            <span>
              {id} · {outletName(equipment.outletId)}
            </span>
          </div>
          <p>
            {target
              ? "The device will be asked to turn its relay on. Confirm that the equipment is ready to resume operation."
              : "The device will be asked to turn its relay off. Turning off cooling may affect stored goods; confirm that an operator is ready to check the equipment."}
          </p>
          <div className="info-note">
            <Radio size={16} />
            <span>
              This action is simulated. No physical equipment will be
              controlled.
            </span>
          </div>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              onClick={() => {
                sendCommand(id, target, outcome);
                setConfirm(false);
              }}
            >
              Confirm relay {target ? "on" : "off"}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
