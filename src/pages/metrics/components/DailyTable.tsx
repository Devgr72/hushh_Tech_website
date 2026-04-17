/**
 * Daily Table — appendix-style raw data table with all daily numbers.
 * Responsive: horizontal scroll on mobile.
 */
import React, { useState } from "react";
import type { DailyRow } from "../types";
import { formatDate, formatNumber } from "../metricsService";
import { metricsSectionTitleClass, metricsSurfaceClass, playfair } from "../theme";

interface DailyTableProps {
  data: DailyRow[];
}

const COLUMNS = [
  { key: "date" as const, label: "Date" },
  { key: "signups" as const, label: "Signups" },
  { key: "persisted" as const, label: "Persisted" },
  { key: "onboarding_started" as const, label: "OB Started" },
  { key: "onboarding_completed" as const, label: "OB Completed" },
  { key: "profiles_created" as const, label: "Profiles" },
  { key: "profiles_confirmed" as const, label: "Confirmed" },
];

const DailyTable: React.FC<DailyTableProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data.length) return null;

  // Show last 5 rows by default, all when expanded
  const displayData = isExpanded ? data : data.slice(-5);

  // Calculate totals for the visible window
  const totals = data.reduce(
    (acc, row) => ({
      signups: acc.signups + row.signups,
      persisted: acc.persisted + row.persisted,
      onboarding_started: acc.onboarding_started + row.onboarding_started,
      onboarding_completed: acc.onboarding_completed + row.onboarding_completed,
      profiles_created: acc.profiles_created + row.profiles_created,
      profiles_confirmed: acc.profiles_confirmed + row.profiles_confirmed,
    }),
    {
      signups: 0,
      persisted: 0,
      onboarding_started: 0,
      onboarding_completed: 0,
      profiles_created: 0,
      profiles_confirmed: 0,
    }
  );

  return (
    <div className={`${metricsSurfaceClass} p-6 md:p-7`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`${metricsSectionTitleClass} text-[1.45rem]`} style={playfair}>
          Daily Appendix
        </h3>
        {data.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-hushh-blue hover:text-black transition-colors"
            aria-label={isExpanded ? "Show less" : "Show all"}
            tabIndex={0}
          >
            {isExpanded ? "Show less" : `Show all ${data.length} days`}
          </button>
        )}
      </div>

      {/* Scrollable table wrapper */}
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-2 px-2 text-gray-500 font-medium uppercase tracking-wider first:pl-0 last:pr-0"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row) => (
              <tr
                key={row.date}
                className="border-b border-gray-100 hover:bg-hushh-blue/5 transition-colors"
              >
                <td className="py-2.5 px-2 text-gray-500 first:pl-0">
                  {formatDate(row.date)}
                </td>
                <td className="py-2.5 px-2 text-gray-900 tabular-nums font-medium">
                  {formatNumber(row.signups)}
                </td>
                <td className="py-2.5 px-2 text-gray-900 tabular-nums font-medium">
                  {formatNumber(row.persisted)}
                </td>
                <td className="py-2.5 px-2 text-gray-900 tabular-nums font-medium">
                  {formatNumber(row.onboarding_started)}
                </td>
                <td className="py-2.5 px-2 text-gray-900 tabular-nums font-medium">
                  {formatNumber(row.onboarding_completed)}
                </td>
                <td className="py-2.5 px-2 text-gray-900 tabular-nums font-medium">
                  {formatNumber(row.profiles_created)}
                </td>
                <td className="py-2.5 px-2 text-gray-900 tabular-nums font-medium last:pr-0">
                  {formatNumber(row.profiles_confirmed)}
                </td>
              </tr>
            ))}

            {/* Totals row */}
            <tr className="border-t-2 border-gray-200 font-bold">
              <td className="py-2.5 px-2 text-gray-700 first:pl-0">Total</td>
              <td className="py-2.5 px-2 text-gray-900 tabular-nums">
                {formatNumber(totals.signups)}
              </td>
              <td className="py-2.5 px-2 text-gray-900 tabular-nums">
                {formatNumber(totals.persisted)}
              </td>
              <td className="py-2.5 px-2 text-gray-900 tabular-nums">
                {formatNumber(totals.onboarding_started)}
              </td>
              <td className="py-2.5 px-2 text-gray-900 tabular-nums">
                {formatNumber(totals.onboarding_completed)}
              </td>
              <td className="py-2.5 px-2 text-gray-900 tabular-nums">
                {formatNumber(totals.profiles_created)}
              </td>
              <td className="py-2.5 px-2 text-gray-900 tabular-nums last:pr-0">
                {formatNumber(totals.profiles_confirmed)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyTable;
