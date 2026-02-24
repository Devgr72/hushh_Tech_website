/**
 * Step 9 - SSN + Date of Birth (iOS-native design) — UI Component
 *
 * Pure presentation component. All logic lives in ./logic.ts
 */
import { useStep9Logic, PROGRESS_PCT, DISPLAY_STEP, TOTAL_STEPS, MONTH_NAMES } from './logic';

export default function OnboardingStep9() {
  const {
    ssn,
    dob,
    dobMonth,
    setDobMonth,
    dobDay,
    setDobDay,
    dobYear,
    setDobYear,
    loading,
    error,
    showInfo,
    isFormValid,
    isFooterVisible,
    dateInputRef,
    yearOptions,
    dayOptions,
    handleSSNChange,
    handleDobChange,
    handleNativeDateChange,
    openDatePicker,
    handleContinue,
    handleSkip,
    handleBack,
    handleShowInfoToggle,
  } = useStep9Logic();

  return (
    <div
      className="bg-white min-h-[100dvh] flex flex-col"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", WebkitFontSmoothing: 'antialiased' }}
    >
      {/* ═══ iOS Navigation Bar ═══ */}
      <nav
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#C6C6C8]/30 flex items-end justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 4px)', minHeight: '48px' }}
      >
        <button onClick={handleBack} className="text-[#007AFF] flex items-center -ml-2 active:opacity-50 transition-opacity" aria-label="Go back">
          <span className="material-symbols-outlined text-3xl -mr-1" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>chevron_left</span>
          <span className="text-[17px] leading-none pb-[2px]">Back</span>
        </button>
        <span className="font-semibold text-[17px] text-black">Setup</span>
        <button onClick={handleSkip} className="text-[17px] text-[#007AFF] font-normal active:opacity-50 transition-opacity">Skip</button>
      </nav>

      <main className="flex-1 overflow-y-auto max-w-md mx-auto w-full px-4 pb-48">
        {/* ─── Progress Bar ─── */}
        <div className="mt-6 mb-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide">Onboarding Progress</span>
            <span className="text-[13px] text-[#8E8E93]">Step {DISPLAY_STEP} of {TOTAL_STEPS}</span>
          </div>
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#007AFF] rounded-full transition-all duration-500" style={{ width: `${PROGRESS_PCT}%` }} />
          </div>
          <p className="mt-1.5 text-[13px] font-medium text-[#007AFF]">{PROGRESS_PCT}% complete</p>
        </div>

        {/* ─── Title ─── */}
        <div className="mb-8">
          <h1 className="text-[34px] leading-tight font-bold text-black tracking-tight mb-3">
            We just need a few more details
          </h1>
          <p className="text-[17px] leading-snug text-[#8E8E93]">
            Federal law requires us to collect this info for tax reporting.
          </p>
        </div>

        {/* ─── Error ─── */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">{error}</div>
        )}

        {/* ─── SSN Section ─── */}
        <div className="mb-6">
          <h2 className="ml-4 mb-2 text-[13px] uppercase text-[#8E8E93] font-normal">Social Security Number</h2>
          <div className="bg-white rounded-xl overflow-hidden ring-1 ring-black/5">
            {/* SSN Input */}
            <div className="flex items-center px-4 py-3 bg-white">
              <input
                type="text"
                value={ssn}
                onChange={handleSSNChange}
                placeholder="000-00-0000"
                maxLength={11}
                inputMode="numeric"
                className="flex-1 bg-transparent border-none p-0 text-[17px] text-black placeholder-gray-400 focus:ring-0 outline-none tracking-widest"
              />
              <span className="material-symbols-outlined text-gray-400 text-xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>lock</span>
            </div>

            {/* Hairline separator */}
            <div className="ml-4 h-[0.5px] bg-[#C6C6C8]/50" />

            {/* Why SSN expandable */}
            <details
              className="group"
              open={showInfo}
              onToggle={(e) => handleShowInfoToggle((e.target as HTMLDetailsElement).open)}
            >
              <summary className="w-full flex items-center justify-between px-4 py-3.5 bg-white active:bg-gray-50 transition-colors cursor-pointer list-none">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#007AFF] text-xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>info</span>
                  <span className="text-[15px] text-[#007AFF] font-medium">Why do we need your SSN?</span>
                </div>
                <span className="material-symbols-outlined text-gray-300 text-base transform transition-transform group-open:rotate-180" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>expand_more</span>
              </summary>
              <div className="px-4 pb-4 pt-1">
                <p className="text-[13px] leading-relaxed text-[#8E8E93]">
                  We are required by federal law to collect this information to prevent fraud and verify your identity before opening an investment account.
                </p>
              </div>
            </details>
          </div>
        </div>

        {/* ─── DOB Section — 3 iOS Dropdown Selectors ─── */}
        <div className="mb-8">
          <h2 className="ml-4 mb-2 text-[13px] uppercase text-[#8E8E93] font-normal">Date of birth</h2>
          <div className="bg-white rounded-xl overflow-hidden ring-1 ring-black/5">
            {/* Month selector */}
            <div className="flex items-center px-4 py-3 relative">
              <span className="text-[15px] text-[#8E8E93] w-16 shrink-0">Month</span>
              <select
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                aria-label="Birth month"
                className="flex-1 bg-transparent border-none p-0 text-[17px] text-black focus:ring-0 outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>Select month</option>
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={String(idx + 1).padStart(2, '0')}>
                    {name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[#C7C7CC] text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>expand_more</span>
            </div>

            {/* Hairline */}
            <div className="ml-4 h-[0.5px] bg-[#C6C6C8]/50" />

            {/* Day selector */}
            <div className="flex items-center px-4 py-3 relative">
              <span className="text-[15px] text-[#8E8E93] w-16 shrink-0">Day</span>
              <select
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                aria-label="Birth day"
                className="flex-1 bg-transparent border-none p-0 text-[17px] text-black focus:ring-0 outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>Select day</option>
                {dayOptions.map((d) => (
                  <option key={d} value={d}>{parseInt(d)}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[#C7C7CC] text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>expand_more</span>
            </div>

            {/* Hairline */}
            <div className="ml-4 h-[0.5px] bg-[#C6C6C8]/50" />

            {/* Year selector */}
            <div className="flex items-center px-4 py-3 relative">
              <span className="text-[15px] text-[#8E8E93] w-16 shrink-0">Year</span>
              <select
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                aria-label="Birth year"
                className="flex-1 bg-transparent border-none p-0 text-[17px] text-black focus:ring-0 outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>Select year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[#C7C7CC] text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>expand_more</span>
            </div>
          </div>
          {/* Confirmation text when all selected */}
          {isFormValid && (
            <p className="ml-4 mt-2 text-[13px] text-[#34C759] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>check_circle</span>
              {MONTH_NAMES[parseInt(dobMonth) - 1]} {parseInt(dobDay)}, {dobYear}
            </p>
          )}
        </div>
      </main>

      {/* ═══ Fixed Footer — Skip + Continue ═══ */}
      {!isFooterVisible && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#C6C6C8]/30 px-4 pt-4 z-40"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          data-onboarding-footer
        >
          <div className="max-w-md mx-auto flex gap-4">
            <button
              onClick={handleSkip}
              className="flex-1 h-[50px] rounded-xl bg-gray-200/80 text-[#007AFF] font-semibold text-[17px] active:scale-[0.98] transition-transform flex items-center justify-center"
            >
              Skip
            </button>
            <button
              onClick={handleContinue}
              disabled={!isFormValid || loading}
              data-onboarding-cta
              className={`flex-1 h-[50px] rounded-xl font-semibold text-[17px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center ${
                isFormValid && !loading
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
