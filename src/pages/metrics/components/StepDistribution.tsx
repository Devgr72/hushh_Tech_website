/**
 * Step Distribution — shows how many users are at each onboarding step.
 * Helps identify where users drop off in the onboarding flow.
 */
import React from "react";
import type { StepDistributionEntry } from "../types";
import { formatNumber } from "../metricsService";
import { metricsSectionTitleClass, metricsSurfaceClass, playfair } from "../theme";

interface StepDistributionProps {
  data: StepDistributionEntry[];
}

/* Step labels matching the onboarding flow */
const STEP_LABELS: Record<number, string> = {
  1: "Account Type",
  2: "Referral Source",
  3: "Fund Selection",
  4: "Personal Info",
  5: "Address",
  6: "Citizenship",
  7: "Account Structure",
  8: "Review",
  9: "Bank Details",
  10: "Verify Identity",
  11: "Verify Complete",
  12: "Meet CEO",
  13: "Investment",
  14: "Recurring Setup",
};

const StepDistribution: React.FC<StepDistributionProps> = ({ data }) => {
  if (!data.length) {
    return (
      <div className={`${metricsSurfaceClass} p-6 md:p-7`}>
        <h3 className={`${metricsSectionTitleClass} mb-4 text-[1.45rem]`} style={playfair}>
          Onboarding Step Distribution
        </h3>
        <p className="text-gray-500 text-sm">No onboarding data available</p>
      </div>
    );
  }

  // Merge completed and in-progress for same step
  const stepMap = new Map<number, { inProgress: number; completed: number }>();
  for (const entry of data) {
    const existing = stepMap.get(entry.step) || { inProgress: 0, completed: 0 };
    if (entry.is_completed) {
      existing.completed += entry.count;
    } else {
      existing.inProgress += entry.count;
    }
    stepMap.set(entry.step, existing);
  }

  // Sort by step number
  const steps = Array.from(stepMap.entries()).sort((a, b) => a[0] - b[0]);
  const maxCount = Math.max(1, ...steps.map(([, v]) => v.inProgress + v.completed));

  return (
    <div className={`${metricsSurfaceClass} p-6 md:p-7`}>
      <h3 className={`${metricsSectionTitleClass} mb-2 text-[1.45rem]`} style={playfair}>
        Onboarding Step Distribution
      </h3>
      <p className="text-xs text-gray-500 mb-5">
        Where users currently are in the onboarding flow
      </p>

      <div className="space-y-3">
        {steps.map(([stepNum, counts]) => {
          const total = counts.inProgress + counts.completed;
          const widthPercent = Math.max((total / maxCount) * 100, 14);
          const completedPercent = total > 0 ? (counts.completed / total) * 100 : 0;

          return (
            <div
              key={stepNum}
              className="group rounded-2xl border border-gray-200/80 bg-gray-50/80 p-3 sm:p-4"
            >
              <div className="flex items-center gap-3">
                {/* Step number badge */}
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
                  {stepNum}
                </div>

                {/* Step label + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-700 truncate font-medium">
                      {STEP_LABELS[stepNum] || `Step ${stepNum}`}
                    </span>
                    <span className="text-xs text-gray-500 tabular-nums ml-2 flex-shrink-0">
                      {formatNumber(total)}
                      {counts.completed > 0 && (
                        <span className="text-emerald-600 ml-1">
                          ({counts.completed} ✓)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Stacked bar */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full flex rounded-full" style={{ width: `${widthPercent}%` }}>
                      {/* Completed portion */}
                      {counts.completed > 0 && (
                        <div
                          className="h-full bg-emerald-500/75"
                          style={{ width: `${completedPercent}%` }}
                        />
                      )}
                      {/* In-progress portion */}
                      <div
                        className="h-full bg-hushh-blue/75"
                        style={{ width: `${100 - completedPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-2 h-2 rounded-full bg-hushh-blue/75" />
          In Progress
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500/75" />
          Completed
        </div>
      </div>
    </div>
  );
};

export default StepDistribution;
