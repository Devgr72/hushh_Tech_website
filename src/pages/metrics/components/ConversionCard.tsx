/**
 * Conversion Card — displays a conversion rate percentage with visual bar.
 */
import React from "react";
import { formatPercent } from "../metricsService";
import { metricsSurfaceClass, playfair, withAlpha } from "../theme";

interface ConversionCardProps {
  label: string;
  value: number;
  fromLabel: string;
  toLabel: string;
  color: string;
}

const ConversionCard: React.FC<ConversionCardProps> = ({
  label,
  value,
  fromLabel,
  toLabel,
  color,
}) => {
  // Clamp value between 0-100 for visual bar
  const barWidth = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`${metricsSurfaceClass} p-5`}>
      {/* Label */}
      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.16em] mb-2">
        {label}
      </div>

      {/* Percentage */}
      <div
        className="text-[1.85rem] leading-none font-normal text-black tracking-tight mb-4 tabular-nums"
        style={playfair}
      >
        {formatPercent(value)}
      </div>

      {/* Visual progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${withAlpha(
              color,
              "B8"
            )} 100%)`,
          }}
        />
      </div>

      {/* From → To labels */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span>{fromLabel}</span>
        <span className="text-gray-300">→</span>
        <span>{toLabel}</span>
      </div>
    </div>
  );
};

export default ConversionCard;
