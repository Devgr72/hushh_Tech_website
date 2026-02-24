/**
 * Step 11 — All UI / Presentation
 * Investment summary, share class editing modal, recurring investment config
 */
import {
  useStep11Logic,
  SHARE_CLASSES,
  FREQUENCY_OPTIONS,
  AMOUNT_PRESETS,
  DAY_OPTIONS,
  DISPLAY_STEP,
  PROG_TOTAL,
  PROG_PCT,
  formatCurrency,
  formatFullCurrency,
  parseFormattedNumber,
  type RecurringFrequency,
} from './logic';

// ─── SVG Icon Components ───

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

const WalletIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-20 text-[#2b8cee]">
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
    <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
  </svg>
);

const RemoveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const AddIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function OnboardingStep11() {
  const {
    loading,
    error,
    isFooterVisible,
    shareUnits,
    frequency,
    investmentDay,
    selectedAmount,
    customAmount,
    customAmountError,
    showRecurringEditor,
    isModalOpen,
    localShareUnits,
    savingModal,
    totalInvestment,
    modalTotalInvestment,
    hasModalChanges,
    hasAnyUnits,
    recurringAmount,
    isFormValid,
    recurringSummaryTitle,
    recurringSummarySubtitle,
    getUnits,
    getModalUnits,
    getUnitsSummary,
    handleBack,
    handleSkip,
    handleContinue,
    handleOpenModal,
    handleCloseModal,
    handleIncrement,
    handleDecrement,
    handleSaveChanges,
    handleAmountClick,
    handleCustomAmountChange,
    setFrequency,
    setInvestmentDay,
    setShowRecurringEditor,
  } = useStep11Logic();

  return (
    <div
      className="bg-white min-h-[100dvh]"
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

      <main className="max-w-lg mx-auto w-full px-4 pt-4 pb-48">
        {/* ─── Title ─── */}
        <h1 className="text-[34px] leading-[41px] font-bold text-black tracking-tight mb-4">Investment Summary</h1>

        {/* ─── Progress Bar ─── */}
        <div className="space-y-2 mb-8">
          <div className="flex justify-between items-end text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide">
            <span>Onboarding Progress</span>
            <span>Step {DISPLAY_STEP}/{PROG_TOTAL}</span>
          </div>
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#007AFF] rounded-full transition-all duration-500" style={{ width: `${PROG_PCT}%` }} />
          </div>
          <p className="text-[13px] text-[#8E8E93]">{PROG_PCT}% complete</p>
        </div>

          {/* Error Message */}
          {error && (
            <div className="mx-5 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Section Title */}
          <div className="px-5 mb-3">
            <h2 className="text-lg font-bold text-slate-900">Share Class Units</h2>
          </div>

          {/* Share Class Cards */}
          <div className="flex flex-col gap-4 px-5">
            {SHARE_CLASSES.map((shareClass) => {
              const units = getUnits(shareClass.id);
              const subtotal = units * shareClass.unitPrice;
              const hasUnits = units > 0;

              return (
                <div
                  key={shareClass.id}
                  className={`flex flex-col rounded-xl border p-4 shadow-sm relative overflow-hidden ${
                    hasUnits
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200 opacity-70'
                  }`}
                >
                  {/* Colored left border */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    hasUnits ? shareClass.borderGradient : 'bg-slate-200'
                  }`} />

                  <div className="pl-3">
                    {/* Header row */}
                    <div className="flex justify-between items-center">
                      <h3 className={`text-lg font-bold ${hasUnits ? 'text-slate-900' : 'text-slate-400'}`}>
                        {shareClass.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-bold rounded border ${
                        hasUnits
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {hasUnits ? 'active' : 'disabled'}
                      </span>
                    </div>

                    {/* Price and units row */}
                    <div className={`flex justify-between items-center text-sm mt-2 ${hasUnits ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span>{formatCurrency(shareClass.unitPrice)}/unit</span>
                      <span>units {units}</span>
                    </div>

                    {/* Subtotal (only if has units) */}
                    {hasUnits && (
                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <p className="text-slate-900 font-bold">
                          Subtotal: {formatCurrency(subtotal)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Edit link - now opens modal */}
            <div className="mt-2">
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 text-[#2b8cee] hover:text-blue-600 transition-colors font-bold text-sm"
              >
                <EditIcon />
                <span>Edit share class selection</span>
              </button>
            </div>
          </div>

          {/* Total Investment Card */}
          <div className="px-5 mt-8 mb-6">
            <div className="relative bg-[#2b8cee]/5 rounded-xl p-6 border-2 border-[#2b8cee]/20 flex flex-col items-center justify-center gap-2 text-center">
              {/* Wallet icon in corner */}
              <div className="absolute top-3 right-3">
                <WalletIcon />
              </div>

              <span className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                Total Investment
              </span>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {hasAnyUnits ? formatFullCurrency(totalInvestment) : '$0'}
              </span>

              {/* Blue divider */}
              <div className="h-1 w-16 bg-[#2b8cee] rounded-full mt-2 mb-2" />

              {hasAnyUnits && (
                <span className="text-sm font-medium text-slate-500">
                  {getUnitsSummary()}
                </span>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="px-5 mb-8">
            <div className="bg-slate-50 rounded-lg p-4 flex gap-3 items-start border border-slate-100">
              <span className="text-slate-500 shrink-0 mt-0.5">
                <InfoIcon />
              </span>
              <p className="text-sm text-slate-500 leading-normal">
                We are currently accepting investments of $1 million or greater for Hushh Fund A.
              </p>
            </div>
          </div>

          {/* Recurring Investment */}
          <div className="px-5 mb-3">
            <h2 className="text-lg font-bold text-slate-900">Recurring Investment</h2>
            <p className="text-xs text-slate-500 mt-1">
              Optional. Review now and edit only if needed.
            </p>
          </div>

          {/* Collapsed summary + edit */}
          <div className="mx-5 mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{recurringSummaryTitle}</p>
                  <p className="text-xs text-slate-500 mt-1">{recurringSummarySubtitle}</p>
                </div>
                <button
                  onClick={() => setShowRecurringEditor((prev) => !prev)}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {showRecurringEditor ? 'Hide' : 'Edit'}
                </button>
              </div>
            </div>
          </div>

          {showRecurringEditor && (
            <>
              {/* Frequency Section */}
              <div className="mx-5 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Frequency</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {FREQUENCY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFrequency(option.value as RecurringFrequency)}
                        className={`flex h-11 items-center justify-center rounded-xl text-xs font-semibold transition-all ${
                          frequency === option.value
                            ? 'bg-[#2b8cee] text-white shadow-sm ring-2 ring-[#2b8cee] ring-offset-1'
                            : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <label className="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-slate-500">
                      Investment day
                    </label>
                    <select
                      value={investmentDay}
                      onChange={(e) => setInvestmentDay(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-300 bg-white text-slate-900 px-3 text-sm font-medium focus:border-[#2b8cee] focus:ring-1 focus:ring-[#2b8cee] outline-none appearance-none"
                    >
                      {DAY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recurring Amount Section */}
              <div className="mx-5 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Recurring Amount</h3>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {AMOUNT_PRESETS.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleAmountClick(amount)}
                        className={`relative flex flex-col items-center justify-center py-3 rounded-xl transition-all ${
                          selectedAmount === amount
                            ? 'border-2 border-[#2b8cee] bg-[#2b8cee]/5'
                            : 'border border-slate-200 bg-white hover:border-[#2b8cee]/50 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-sm font-bold ${
                          selectedAmount === amount ? 'text-[#2b8cee]' : 'text-slate-900'
                        }`}>
                          ${amount.toLocaleString()}
                        </span>
                        {selectedAmount === amount && (
                          <div className="absolute -top-2 -right-2 bg-[#2b8cee] text-white rounded-full p-0.5">
                            <CheckIcon />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <span className={`absolute inset-y-0 left-0 pl-3 flex items-center font-medium text-lg ${
                        customAmountError ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        $
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        placeholder="Other Amount"
                        className={`w-full h-12 rounded-xl border bg-white text-slate-900 pl-8 pr-3 text-lg font-bold outline-none transition-all placeholder:text-slate-300 ${
                          customAmountError
                            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                            : 'border-slate-300 focus:border-[#2b8cee] focus:ring-1 focus:ring-[#2b8cee]'
                        }`}
                      />
                    </div>

                    {customAmountError && (
                      <p className="text-red-500 text-xs font-medium px-1">{customAmountError}</p>
                    )}
                    {!customAmountError && customAmount && (
                      <p className="text-green-600 text-xs font-medium px-1">
                        Amount: ${parseFormattedNumber(customAmount).toLocaleString()}
                      </p>
                    )}
                    {!customAmount && selectedAmount === null && (
                      <p className="text-slate-400 text-xs px-1">
                        Leave empty if you want to set recurring later.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

        </main>

        {/* ═══ iOS Fixed Footer ═══ */}
        {!isFooterVisible && (
          <div
            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#C6C6C8]/30 px-4 pt-3 z-50"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            data-onboarding-footer
          >
            <div className="max-w-lg mx-auto flex flex-col gap-3">
              {/* Total row */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Total Investment</span>
                <span className="text-[20px] font-bold text-black tracking-tight">{formatCurrency(totalInvestment)}</span>
              </div>
              {/* Buttons */}
              <div className="flex gap-4 h-12">
                <button onClick={handleBack} className="flex-1 bg-gray-200 text-black font-semibold text-[17px] rounded-xl active:bg-gray-300 transition-colors">Back</button>
                <button
                  onClick={handleContinue}
                  disabled={!isFormValid || loading}
                  data-onboarding-cta
                  className={`flex-[2] rounded-xl font-semibold text-[17px] flex items-center justify-center gap-1 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 ${
                    isFormValid && !loading ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Saving...' : 'Continue'}
                  {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Share Class Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50">
            <div
              className="relative w-full max-w-[500px] bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden flex flex-col"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              {/* iOS Modal Header — Cancel | Title | Done */}
              <header className="flex items-center justify-between px-4 h-[56px] border-b border-[#C6C6C8]/30 bg-white sticky top-0 z-10">
                <button onClick={handleCloseModal} className="text-[#007AFF] text-[17px] font-normal active:opacity-50 transition-opacity">Cancel</button>
                <h2 className="text-[17px] font-semibold text-black absolute left-1/2 -translate-x-1/2">Edit Units</h2>
                <button
                  onClick={handleSaveChanges}
                  disabled={!hasModalChanges || savingModal}
                  className={`text-[17px] font-semibold active:opacity-50 transition-opacity ${hasModalChanges ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}
                >
                  {savingModal ? '...' : 'Done'}
                </button>
              </header>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 pb-48">
                {/* Share Class Cards */}
                <div className="flex flex-col gap-4">
                  {SHARE_CLASSES.map((shareClass) => {
                    const units = getModalUnits(shareClass.id);

                    return (
                      <div
                        key={shareClass.id}
                        className="flex flex-col rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden bg-white"
                      >
                        {/* Colored left border */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${shareClass.borderGradient}`} />

                        <div className="pl-3">
                          {/* Header row with name and badge */}
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">
                              {shareClass.name}
                            </h3>
                            {shareClass.badge && (
                              <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                                shareClass.tier === 'platinum'
                                  ? 'bg-gradient-to-r from-gray-200 to-gray-100 text-gray-600 border border-gray-200'
                                  : 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200'
                              }`}>
                                {shareClass.badge}
                              </span>
                            )}
                          </div>

                          {/* Price per unit */}
                          <p className="text-sm text-slate-500 mt-1">
                            {formatCurrency(shareClass.unitPrice)}/unit
                          </p>

                          {/* Unit controls */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                            <span className="text-sm font-medium text-slate-500">Allocation</span>
                            <div className="flex items-center gap-3">
                              {/* Decrement button */}
                              <button
                                onClick={() => handleDecrement(shareClass.id)}
                                disabled={units === 0}
                                className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
                                  units === 0
                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                    : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 active:scale-95'
                                }`}
                                aria-label="Decrease units"
                              >
                                <RemoveIcon />
                              </button>

                              {/* Unit count */}
                              <span className="text-xl font-bold text-slate-900 min-w-[40px] text-center">
                                {units}
                              </span>

                              {/* Increment button */}
                              <button
                                onClick={() => handleIncrement(shareClass.id)}
                                className="flex items-center justify-center w-9 h-9 rounded-full border border-[#2b8cee] text-[#2b8cee] hover:bg-blue-50 active:scale-95 transition-all"
                                aria-label="Increase units"
                              >
                                <AddIcon />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total Investment Card */}
                <div className="mt-6">
                  <div className="bg-[#2b8cee]/5 rounded-xl p-5 border-2 border-[#2b8cee]/20 flex flex-col items-center justify-center gap-1 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Total Investment
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900">
                      {formatFullCurrency(modalTotalInvestment)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
