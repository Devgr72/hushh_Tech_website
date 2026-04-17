/**
 * KPI Card — displays a single metric with value, label, and total context.
 */
import React from "react";
import { formatNumber } from "../metricsService";
import { metricsSurfaceClass, playfair, withAlpha } from "../theme";

interface KpiCardProps {
  label: string;
  value: number;
  total: number;
  icon: string;
  color: string;
  description: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  total,
  icon,
  color,
  description,
}) => {
  return (
    <div
      className={`${metricsSurfaceClass} group relative overflow-hidden p-5 transition-all duration-200 hover:border-gray-300`}
      title={description}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: color }}
      />

      {/* Icon + Label */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <span
          className="w-11 h-11 rounded-full border flex items-center justify-center shrink-0"
          style={{
            backgroundColor: withAlpha(color, "12"),
            borderColor: withAlpha(color, "28"),
            color,
          }}
          aria-hidden="true"
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: "'wght' 400" }}
          >
            {icon}
          </span>
        </span>
        <span className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-[0.16em] leading-relaxed">
          {label}
        </span>
      </div>

      {/* Value */}
      <div
        className="text-[2rem] leading-none font-normal text-black tracking-tight tabular-nums"
        style={playfair}
      >
        {formatNumber(value)}
      </div>

      {/* All-time total context */}
      <div className="text-xs text-gray-500 mt-2">
        {formatNumber(total)} all-time
      </div>
    </div>
  );
};

export default KpiCard;
