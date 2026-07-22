"use client";

import { useState } from "react";
import { fromCents } from "@/lib/money";

const WIDTH = 480;
const HEIGHT = 160;
const PADDING = 24;

export function TrendChart({
  title,
  points,
  currency,
}: {
  title: string;
  points: { label: string; cents: number }[];
  currency: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
        <p className="text-sm text-zinc-400 dark:text-zinc-600">No data yet.</p>
      </div>
    );
  }

  const max = Math.max(...points.map((p) => p.cents), 1);
  const plotWidth = WIDTH - PADDING * 2;
  const plotHeight = HEIGHT - PADDING * 2;

  const coords = points.map((p, i) => ({
    x: PADDING + (points.length === 1 ? plotWidth / 2 : (i / (points.length - 1)) * plotWidth),
    y: PADDING + plotHeight - (p.cents / max) * plotHeight,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${HEIGHT - PADDING} L ${coords[0].x} ${HEIGHT - PADDING} Z`;

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredCoord = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <line
            x1={PADDING}
            y1={HEIGHT - PADDING}
            x2={WIDTH - PADDING}
            y2={HEIGHT - PADDING}
            stroke="currentColor"
            strokeWidth={1}
            className="text-zinc-300 dark:text-zinc-700"
          />
          <path d={areaPath} fill="#2a78d6" opacity={0.1} />
          <path d={linePath} fill="none" stroke="#2a78d6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {coords.map((c, i) => (
            <rect
              key={i}
              x={c.x - plotWidth / points.length / 2}
              y={0}
              width={Math.max(plotWidth / points.length, 4)}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onClick={() => setHoverIndex(i)}
            />
          ))}
          {hoveredCoord && (
            <>
              <line
                x1={hoveredCoord.x}
                y1={PADDING}
                x2={hoveredCoord.x}
                y2={HEIGHT - PADDING}
                stroke="currentColor"
                strokeWidth={1}
                className="text-zinc-300 dark:text-zinc-700"
              />
              <circle cx={hoveredCoord.x} cy={hoveredCoord.y} r={4} fill="#2a78d6" stroke="#fcfcfb" strokeWidth={2} />
            </>
          )}
        </svg>
        {hovered && hoveredCoord && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            style={{ left: `${(hoveredCoord.x / WIDTH) * 100}%`, top: `${(hoveredCoord.y / HEIGHT) * 100}%` }}
          >
            {hovered.label}: {fromCents(hovered.cents)} {currency}
          </div>
        )}
      </div>
    </div>
  );
}
