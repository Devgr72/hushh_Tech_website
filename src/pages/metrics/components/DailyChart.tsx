/**
 * Daily Chart — pure CSS bar chart showing daily KPI trends.
 * No chart library dependency — lightweight and fast.
 */
import React, { useState } from "react";
import type { DailyRow } from "../types";
import { formatDate, formatNumber } from "../metricsService";
import { metricsSectionTitleClass, metricsSurfaceClass, playfair, withAlpha } from "../theme";

interface DailyChartProps {
  data: DailyRow[];
}

type MetricKey = "signups" | "persisted" | "onboarding_started" | "onboarding_completed" | "profiles_created" | "profiles_confirmed";

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: "signups", label: "Signups", color: "#00A9E0" },
  { key: "onboarding_started", label: "Onboarding", color: "#475569" },
  { key: "onboarding_completed", label: "Completed", color: "#10B981" },
  { key: "profiles_confirmed", label: "Confirmed", color: "#0F766E" },
];

const DailyChart: React.FC<DailyChartProps> = ({ data }) => {
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(
    new Set(["signups", "onboarding_started", "onboarding_completed", "profiles_confirmed"])
  );
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className={`${metricsSurfaceClass} p-6 md:p-7`}>
        <h3 className={`${metricsSectionTitleClass} mb-4 text-[1.45rem]`} style={playfair}>
          Daily Trend
        </h3>
        <p className="text-gray-500 text-sm">No daily data available</p>
      </div>
    );
  }

  // Find max value across all active metrics for scaling
  const maxVal = Math.max(
    1,
    ...data.flatMap((row) =>
      METRICS.filter((m) => activeMetrics.has(m.key)).map((m) => row[m.key])
    )
  );

  const handleToggleMetric = (key: MetricKey) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className={`${metricsSurfaceClass} p-6 md:p-7`}>
      {/* Header + Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className={`${metricsSectionTitleClass} text-[1.45rem]`} style={playfair}>
          Daily Trend
        </h3>
        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => handleToggleMetric(m.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border
                ${activeMetrics.has(m.key)
                  ? "text-black border-gray-200 shadow-sm"
                  : "text-gray-500 border-gray-200 hover:text-black"
                }`}
              style={{
                background: activeMetrics.has(m.key)
                  ? withAlpha(m.color, "12")
                  : "#ffffff",
              }}
              aria-label={`Toggle ${m.label}`}
              tabIndex={0}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ background: m.color }}
              />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="relative">
        {/* Y-axis scale lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 w-8 text-right tabular-nums">
                {formatNumber(Math.round(maxVal * (1 - i / 3)))}
              </span>
              <div className="flex-1 border-t border-gray-100" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div
          className="flex items-end gap-1 pl-10"
          style={{ height: "200px" }}
        >
          {data.map((row, dayIdx) => {
            const activeMetricList = METRICS.filter((m) => activeMetrics.has(m.key));
            const barWidth = `${100 / data.length}%`;

            return (
              <div
                key={row.date}
                className="flex-1 flex items-end justify-center gap-px relative group"
                style={{ maxWidth: barWidth }}
                onMouseEnter={() => setHoveredDay(dayIdx)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {activeMetricList.map((m) => {
                  const val = row[m.key];
                  const heightPercent = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  return (
                  <div
                      key={m.key}
                      className="rounded-t-lg transition-all duration-300 min-w-[4px]"
                      style={{
                        height: `${Math.max(heightPercent, 1)}%`,
                        background: m.color,
                        flex: 1,
                        opacity: hoveredDay === dayIdx ? 1 : 0.8,
                      }}
                      title={`${m.label}: ${val}`}
                    />
                  );
                })}

                {/* Tooltip on hover */}
                {hoveredDay === dayIdx && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full
                                  bg-white border border-gray-200 rounded-2xl px-3 py-2 
                                  shadow-xl z-10 whitespace-nowrap pointer-events-none">
                    <div className="text-[10px] text-gray-400 mb-1">
                      {formatDate(row.date)}
                    </div>
                    {activeMetricList.map((m) => (
                      <div key={m.key} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: m.color }}
                        />
                        <span className="text-gray-400">{m.label}:</span>
                        <span className="text-gray-900 font-medium tabular-nums">
                          {row[m.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-1 pl-10 mt-2">
          {data.map((row) => (
            <div
              key={row.date}
              className="flex-1 text-center text-[10px] text-gray-500 truncate"
            >
              {formatDate(row.date)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyChart;
