"use client";
import { useEffect, useRef, useState } from "react";
import type { Equipment } from "@/lib/types";
import { toTemperature, temperatureText } from "@/lib/domain";
import { weekDays } from "@/lib/sample-data";

function useChartsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.Charts) {
      setReady(true);
      return;
    }
    const onReady = () => setReady(true);
    window.addEventListener("briqon-charts-ready", onReady);
    return () => window.removeEventListener("briqon-charts-ready", onReady);
  }, []);
  return ready;
}

declare global {
  interface Window {
    Charts: {
      line: (el: HTMLElement, options: Record<string, unknown>) => unknown;
      bars: (el: HTMLElement, options: Record<string, unknown>) => unknown;
      destroy: (el: HTMLElement) => void;
    };
  }
}
export function TemperatureChart({
  equipment,
  unit,
  period = "24h",
}: {
  equipment: Equipment;
  unit: "C" | "F";
  period?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useChartsReady();
  const samples =
    period === "6h" ? equipment.history.slice(-13) : equipment.history;
  const signature = samples.join(",");
  useEffect(() => {
    if (!loaded || !ref.current || !window.Charts) return;
    const hours = period === "6h" ? 6 : 24;
    const labels = samples.map((_, i) => {
      const minutes =
        (14 * 60 +
          30 -
          (samples.length - 1 - i) * ((hours * 60) / (samples.length - 1)) +
          1440) %
        1440;
      return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(Math.round(minutes % 60)).padStart(2, "0")}`;
    });
    const el = ref.current;
    window.Charts.line(el, {
      labels,
      series: [
        {
          name: `${equipment.name} temperature`,
          values: samples.map((v) => toTemperature(v, unit)),
          colour: "#277E0C",
        },
      ],
      height: 170,
      xAt: [0, 1, 2, 3].map((i) => Math.round((i * (samples.length - 1)) / 3)),
      min: toTemperature(equipment.kind === "Freezer" ? -25 : 0, unit),
      format: (v: number) => `${v.toFixed(1)}°${unit}`,
      tickFormat: (v: number) => `${v.toFixed(0)}°`,
      reference: {
        value: toTemperature(equipment.max, unit),
        label: `Upper limit ${temperatureText(equipment.max, unit)}`,
      },
      annotations:
        equipment.id === "BRQ-001"
          ? [
              {
                at: samples.findIndex((v) => v > equipment.max),
                label: "Above temperature range",
                short: "Above range",
              },
            ]
          : undefined,
    });
    return () => window.Charts.destroy(el);
    // Chart helper owns resizing and redraws; sample signature avoids rebinding for freshness-only updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loaded,
    equipment.id,
    equipment.max,
    equipment.kind,
    equipment.name,
    unit,
    period,
    signature,
  ]);
  return (
    <>
      <div
        className={`chart temperature-chart ${!equipment.connected ? "stale-chart" : ""}`}
        ref={ref}
      />
      <details className="chart-data">
        <summary>View temperature readings</summary>
        <div className="readings-grid">
          {samples.map((value, i) => (
            <span key={i}>
              Reading {i + 1}
              <strong>{temperatureText(value, unit)}</strong>
            </span>
          ))}
        </div>
      </details>
    </>
  );
}
export function EnergyChart({
  values,
  compact = false,
  labels = weekDays,
}: {
  values: number[];
  compact?: boolean;
  labels?: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useChartsReady();
  const signature = values.join(",");
  const labelSignature = labels.join(",");
  useEffect(() => {
    if (!loaded || !ref.current || !window.Charts) return;
    const el = ref.current;
    window.Charts.bars(el, {
      labels: labelSignature.split(","),
      values: signature.split(",").map(Number),
      height: compact ? 160 : 240,
      format: (v: number) => `${v.toFixed(1)} kWh`,
      tickFormat: (v: number) => `${v.toFixed(0)}`,
      highlight: signature.split(",").length - 1,
      colour: "#277E0C",
      mutedColour: "#dce6d8",
    });
    return () => window.Charts.destroy(el);
  }, [loaded, signature, compact, labelSignature]);
  return (
    <>
      <div ref={ref} className="chart energy-chart" />
      <details className="chart-data">
        <summary>View energy readings</summary>
        <div className="readings-grid">
          {values.map((v, i) => (
            <span key={i}>
              {labels[i]}
              <strong>{v.toFixed(1)} kWh</strong>
            </span>
          ))}
        </div>
      </details>
    </>
  );
}
