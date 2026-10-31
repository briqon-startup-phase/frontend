"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { outletName, statusOf, temperatureText, clock } from "@/lib/domain";
import type { Equipment } from "@/lib/types";
import { useWorkspace } from "./workspace-provider";
import { Status, EmptyState } from "./ui";

export function EquipmentTable({
  equipment,
  compact = false,
}: {
  equipment: Equipment[];
  compact?: boolean;
}) {
  const { state, paused } = useWorkspace();
  const unit = state.preferences.unit;
  if (!equipment.length)
    return (
      <EmptyState
        title="No equipment found"
        description="Try another name, outlet, or condition filter."
      />
    );
  return (
    <div className="equipment-table-wrap">
      <table className={`equipment-table ${compact ? "compact" : ""}`}>
        <thead>
          <tr>
            <th>Equipment</th>
            <th className="num">Temperature</th>
            {!compact && <th className="num">Power</th>}
            <th>Condition</th>
            <th aria-label="Equipment details" />
          </tr>
        </thead>
        <tbody>
          {equipment.map((e) => {
            const status = statusOf(e);
            return (
              <tr key={e.id}>
                <td>
                  <Link className="equipment-name" href={`/equipment/${e.id}`}>
                    {e.name}
                  </Link>
                  <div className="row-meta">
                    {e.zone} · {outletName(e.outletId)}
                  </div>
                  <div className="mobile-equipment-meta">
                    <span>{status}</span>
                    <span>
                      {e.connected
                        ? `${e.power.toFixed(2)} kW`
                        : `Last seen ${clock(e.lastSeen)} WIB`}
                    </span>
                  </div>
                </td>
                <td
                  className={`num temp-cell ${status === "Needs attention" ? "attention-number" : ""}`}
                >
                  <strong>
                    {e.connected ? temperatureText(e.temperature, unit) : "—"}
                  </strong>
                  <span className="row-meta">
                    {e.connected
                      ? `${temperatureText(e.min, unit)} to ${temperatureText(e.max, unit)}`
                      : `Last ${temperatureText(e.temperature, unit)}`}
                  </span>
                  <div
                    className={`range-track ${!e.connected ? "range-offline" : ""}`}
                    aria-hidden="true"
                  >
                    <span
                      style={{
                        left: `${Math.max(4, Math.min(96, ((e.temperature - e.min) / (e.max - e.min)) * 70 + 15))}%`,
                      }}
                    />
                  </div>
                </td>
                {!compact && (
                  <td className="num power-cell">
                    {e.connected ? e.power.toFixed(2) : "—"}
                    <span className="row-meta">
                      {e.connected ? "kW" : `Last seen ${clock(e.lastSeen)}`}
                    </span>
                  </td>
                )}
                <td className="condition-cell">
                  <Status status={status} />
                  <span className="row-meta">
                    {!e.connected
                      ? "Readings are stale"
                      : paused
                        ? "Playback paused"
                        : "Simulated telemetry"}
                  </span>
                </td>
                <td className="row-action">
                  <Link
                    className="icon-button"
                    href={`/equipment/${e.id}`}
                    aria-label={`View ${e.name}`}
                  >
                    <ArrowUpRight size={16} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
