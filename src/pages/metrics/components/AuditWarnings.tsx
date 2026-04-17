/**
 * Audit Warnings — shows data freshness alerts when sources are stale.
 */
import React from "react";

interface AuditWarningsProps {
  warnings: string[];
}

const AuditWarnings: React.FC<AuditWarningsProps> = ({ warnings }) => {
  if (!warnings.length) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-full border border-amber-200 bg-white text-amber-500 flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-[20px]">warning</span>
        </span>
        <div>
          <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
            Data Freshness Warnings
          </h4>
          <ul className="space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-amber-800/80">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuditWarnings;
