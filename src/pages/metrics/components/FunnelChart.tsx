/**
 * Funnel Chart — vertical funnel visualization from signup to confirmation.
 * Pure CSS, no chart library needed.
 */
import React from "react";
import type { FunnelStage } from "../types";
import { formatNumber } from "../metricsService";
import { metricsSectionTitleClass, metricsSurfaceClass, playfair, withAlpha } from "../theme";

interface FunnelChartProps {
  stages: FunnelStage[];
}

/* Color gradient for funnel stages (top = widest, bottom = narrowest) */
const STAGE_COLORS = [
  "#00A9E0",
  "#2563EB",
  "#475569",
  "#10B981",
  "#8B5CF6",
  "#0F766E",
];

const FunnelChart: React.FC<FunnelChartProps> = ({ stages }) => {
  if (!stages.length) return null;

  const maxCount = stages[0]?.count || 1;

  return (
    <div className={`${metricsSurfaceClass} p-6 md:p-7`}>
      <h3 className={`${metricsSectionTitleClass} mb-6 text-[1.45rem]`} style={playfair}>
        Conversion Funnel
      </h3>

      <div className="flex flex-col items-center gap-2">
        {stages.map((stage, idx) => {
          // Width proportional to count (min 20% for readability)
          const widthPercent = maxCount > 0
            ? Math.max((stage.count / maxCount) * 100, 20)
            : 20;

          // Drop-off from previous stage
          const prevCount = idx > 0 ? stages[idx - 1].count : stage.count;
          const dropOff = prevCount > 0
            ? ((prevCount - stage.count) / prevCount * 100).toFixed(0)
            : "0";

          return (
            <div key={stage.stage} className="w-full flex flex-col items-center">
              {/* Stage bar */}
              <div
                className="relative flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border
                           transition-all duration-500 ease-out cursor-default"
                style={{
                  width: `${widthPercent}%`,
                  background: `linear-gradient(90deg, ${withAlpha(
                    STAGE_COLORS[idx % STAGE_COLORS.length],
                    "16"
                  )} 0%, ${withAlpha(
                    STAGE_COLORS[idx % STAGE_COLORS.length],
                    "08"
                  )} 100%)`,
                  borderColor: withAlpha(
                    STAGE_COLORS[idx % STAGE_COLORS.length],
                    "2A"
                  ),
                  minWidth: "220px",
                }}
              >
                <div
                  className="absolute left-0 inset-y-0 w-1.5 rounded-l-2xl"
                  style={{ background: STAGE_COLORS[idx % STAGE_COLORS.length] }}
                />
                <span className="pl-3 text-sm font-medium text-gray-900 truncate">
                  {stage.stage}
                </span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums ml-2">
                  {formatNumber(stage.count)}
                </span>
              </div>

              {/* Drop-off indicator (between stages) */}
              {idx < stages.length - 1 && (
                <div className="flex items-center gap-2 py-1">
                  <div className="w-px h-3 bg-gray-200" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-[0.14em]">
                    -{dropOff}% drop
                  </span>
                  <div className="w-px h-3 bg-gray-200" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FunnelChart;
