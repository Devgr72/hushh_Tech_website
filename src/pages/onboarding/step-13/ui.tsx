/**
 * Step 13 — All UI / Presentation
 * Bank details form, Plaid account selector, iOS-styled layout
 */
import {
  useStep13Logic,
  SHARE_CLASSES,
  COUNTRIES,
  formatCurrency,
  type PlaidAccount,
  type TouchedFields,
} from './logic';

// ─── SVG Icon Components ───

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#D4AF37" stroke="#D4AF37" strokeWidth="1">
    <polygon points="12,2 15,8.5 22,9.3 17,14 18.2,21 12,17.5 5.8,21 7,14 2,9.3 9,8.5" />
  </svg>
);

const DiamondIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3H18L22 9L12 21L2 9L6 3Z" />
  </svg>
);

const VerifiedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2b8cee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L15 5L19 5L19 9L22 12L19 15L19 19L15 19L12 22L9 19L5 19L5 15L2 12L5 9L5 5L9 5L12 2Z" />
    <polyline points="9,12 11,14 15,10" />
  </svg>
);

const ICON_MAP: Record<string, React.ReactNode> = {
  diamond: <DiamondIcon />,
  star: <StarIcon />,
  verified: <VerifiedIcon />,
};

export default function OnboardingStep13() {
  const {
    loading,
    pageLoading,
    error,
    isFooterVisible,
    autoFillMessage,
    plaidAccounts,
    selectedAccountIdx,
    plaidInstitutionName,
    bankName,
    accountHolderName,
    accountNumber,
    confirmAccountNumber,
    routingNumber,
    bankCity,
    bankCountry,
    accountType,
    formattedOnboardingAccountType,
    touched,
    shareUnits,
    totalInvestment,
    hasAnyUnits,
    bankNameError,
    accountHolderNameError,
    accountNumberError,
    confirmAccountNumberError,
    bankCountryError,
    routingNumberError,
    isFormValid,
    getUnits,
    handleBlur,
    handleBack,
    handleSkip,
    handleContinue,
    setBankName,
    setAccountHolderName,
    setAccountNumber,
    setConfirmAccountNumber,
    setRoutingNumber,
    setBankCity,
    setBankCountry,
    setAccountType,
    setSelectedAccountIdx,
    applyAccountSelection,
    userModifiedFields,
  } = useStep13Logic();

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

      <main className="max-w-lg mx-auto w-full px-4 pt-2 pb-48">
        {/* ─── Progress ─── */}
        <div className="mb-6 mt-2">
          <div className="flex justify-between items-end mb-2 px-1">
            <span className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide">Onboarding Progress</span>
            <span className="text-[13px] text-[#8E8E93]">Step 12/12</span>
          </div>
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#007AFF] w-full rounded-full" />
          </div>
          <p className="mt-1.5 px-1 text-[12px] font-medium text-[#007AFF]">100% complete</p>
        </div>

        {/* ─── Title ─── */}
        <h1 className="text-[34px] leading-tight font-bold text-black tracking-tight mb-2 px-1">Bank Details</h1>
        <p className="text-[17px] leading-snug text-[#8E8E93] mb-8 px-1">
          Provide your banking information for investment transfers securely.
        </p>

        {/* ─── Page Loading Shimmer ─── */}
        {pageLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-[120px] bg-gray-100 rounded-xl" />
            <div className="space-y-0 rounded-[10px] overflow-hidden border border-gray-100">
              {[1,2,3,4].map(i => <div key={i} className="h-[44px] bg-gray-50 border-b border-gray-100" />)}
            </div>
            <div className="space-y-0 rounded-[10px] overflow-hidden border border-gray-100">
              {[1,2,3].map(i => <div key={i} className="h-[44px] bg-gray-50 border-b border-gray-100" />)}
            </div>
            <div className="flex justify-center pt-4">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-[#007AFF] rounded-full animate-spin" />
            </div>
            <p className="text-center text-[13px] text-[#8E8E93]">Loading your data...</p>
          </div>
        )}

        {/* ─── Form Content (hidden while loading) ─── */}
        {!pageLoading && <>
          {/* Error Message */}
          {error && (
            <div className="mx-5 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Plaid Auto-Fill Banner */}
          {autoFillMessage && (
            <div className="mx-5 mb-4 p-3 bg-[#F0F7FF] border border-[#2b8cee]/20 rounded-xl text-[#2b8cee] text-sm font-medium text-center animate-pulse">
              {autoFillMessage}
            </div>
          )}

          {/* Multi-Account Selector — shown when Plaid returns 2+ accounts */}
          {plaidAccounts.length > 1 && (
            <div className="mx-5 mb-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">
                  {plaidInstitutionName ? `${plaidInstitutionName} - ` : ''}SELECT ACCOUNT
                </p>
                <div className="space-y-2">
                  {plaidAccounts.map((acct, idx) => {
                    const isSelected = idx === selectedAccountIdx;
                    return (
                      <button
                        key={acct.accountId || idx}
                        type="button"
                        onClick={() => {
                          setSelectedAccountIdx(idx);
                          userModifiedFields.current.delete('accountNumber');
                          userModifiedFields.current.delete('confirmAccountNumber');
                          userModifiedFields.current.delete('routingNumber');
                          userModifiedFields.current.delete('accountType');
                          applyAccountSelection(acct);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'border-[#2b8cee] bg-[#F0F7FF] ring-1 ring-[#2b8cee]/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                        aria-label={`Select ${acct.name} ending in ${acct.mask}`}
                      >
                        {/* Radio indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#2b8cee]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#2b8cee]" />}
                        </div>
                        {/* Account info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{acct.name}</p>
                          <p className="text-xs text-slate-500">
                            {acct.subtype.charAt(0).toUpperCase() + acct.subtype.slice(1)} &middot; &bull;&bull;&bull;&bull;{acct.mask}
                          </p>
                        </div>
                        {/* Selected check */}
                        {isSelected && (
                          <span className="text-[#2b8cee] text-sm font-bold">*</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Investment Amount Card */}
          {hasAnyUnits && (
            <div className="mx-5 mb-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-1">
                  INVESTMENT AMOUNT
                </p>
                <div className="text-3xl font-bold text-slate-900 mb-4">
                  {formatCurrency(totalInvestment)}
                </div>

                {/* Share Class Pills */}
                <div className="flex flex-wrap gap-2">
                  {SHARE_CLASSES.map((shareClass) => {
                    const units = getUnits(shareClass.id);
                    if (units === 0) return null;

                    return (
                      <div
                        key={shareClass.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: shareClass.bgColor,
                          border: `1px solid ${shareClass.borderColor}`,
                        }}
                      >
                        {ICON_MAP[shareClass.iconType]}
                        <span
                          className="text-xs font-bold"
                          style={{ color: shareClass.color }}
                        >
                          {shareClass.name} —{units}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── BANKING INFORMATION — iOS Grouped Table ─── */}
          <div className="mb-8">
            <div className="uppercase text-[13px] text-[#8E8E93] mb-2 px-4 font-normal">Banking Information</div>
            <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] divide-y divide-[#C6C6C8]/50">
              {/* Bank Name */}
              <div className="flex items-center min-h-[44px] px-4 active:bg-gray-100 transition-colors">
                <label className="w-1/3 text-[17px] text-black py-3">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => { userModifiedFields.current.add('bankName'); setBankName(e.target.value); }}
                  onBlur={() => handleBlur('bankName')}
                  placeholder="Required"
                  className="w-2/3 bg-transparent border-none text-[17px] text-right text-black placeholder-[#8E8E93] focus:ring-0 p-0"
                />
              </div>
              {/* Holder Name */}
              <div className="flex items-center min-h-[44px] px-4 active:bg-gray-100 transition-colors">
                <label className="w-1/3 text-[17px] text-black py-3 whitespace-nowrap">Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  onBlur={() => handleBlur('accountHolderName')}
                  placeholder="Required"
                  className="w-2/3 bg-transparent border-none text-[17px] text-right text-black placeholder-[#8E8E93] focus:ring-0 p-0"
                />
              </div>
              {/* Account Type */}
              <div className="flex items-center justify-between min-h-[44px] px-4 cursor-pointer">
                <label className="text-[17px] text-black py-3">Account Type</label>
                <div className="flex items-center">
                  <span className="text-[17px] text-[#8E8E93] mr-2">{formattedOnboardingAccountType}</span>
                  <span className="material-symbols-outlined text-gray-400 text-lg">chevron_right</span>
                </div>
              </div>
              {/* Country */}
              <div className="flex items-center justify-between min-h-[44px] px-4 cursor-pointer relative">
                <label className="text-[17px] text-black py-3">Country</label>
                <div className="flex items-center">
                  <select
                    value={bankCountry}
                    onChange={(e) => { userModifiedFields.current.add('bankCountry'); setBankCountry(e.target.value); handleBlur('bankCountry'); }}
                    onBlur={() => handleBlur('bankCountry')}
                    className="appearance-none bg-transparent border-none text-[17px] text-[#8E8E93] text-right focus:ring-0 p-0 pr-6 cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} disabled={c.code === ''}>{c.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-gray-400 text-lg absolute right-4 pointer-events-none">chevron_right</span>
                </div>
              </div>
            </div>
            <p className="mt-2 px-4 text-[13px] text-[#8E8E93] leading-normal">Ensure the account holder name matches your ID exactly.</p>
            {touched.bankName && bankNameError && <p className="mt-1 px-4 text-[13px] text-red-500">{bankNameError}</p>}
            {touched.accountHolderName && accountHolderNameError && <p className="mt-1 px-4 text-[13px] text-red-500">{accountHolderNameError}</p>}
          </div>

          {/* ─── ACCOUNT DETAILS — iOS Grouped Table ─── */}
          <div className="mb-8">
            <div className="uppercase text-[13px] text-[#8E8E93] mb-2 px-4 font-normal">Account Details</div>
            <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] divide-y divide-[#C6C6C8]/50">
              {/* Routing # */}
              <div className="flex items-center min-h-[44px] px-4 active:bg-gray-100 transition-colors">
                <label className="w-1/3 text-[17px] text-black py-3">Routing #</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={routingNumber}
                  onChange={(e) => { userModifiedFields.current.add('routingNumber'); setRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, bankCountry === 'US' ? 9 : 15)); }}
                  onBlur={() => handleBlur('routingNumber')}
                  placeholder="9 digits"
                  maxLength={bankCountry === 'US' ? 9 : 15}
                  className="w-2/3 bg-transparent border-none text-[17px] text-right text-black placeholder-[#8E8E93] focus:ring-0 p-0 font-mono tracking-tight"
                />
              </div>
              {/* Account # */}
              <div className="flex items-center min-h-[44px] px-4 active:bg-gray-100 transition-colors">
                <label className="w-1/3 text-[17px] text-black py-3">Account #</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={(e) => { userModifiedFields.current.add('accountNumber'); setAccountNumber(e.target.value.replace(/\D/g, '')); }}
                  onBlur={() => handleBlur('accountNumber')}
                  placeholder="Required"
                  className="w-2/3 bg-transparent border-none text-[17px] text-right text-black placeholder-[#8E8E93] focus:ring-0 p-0 font-mono tracking-tight"
                />
              </div>
              {/* Confirm # */}
              <div className="flex items-center min-h-[44px] px-4 active:bg-gray-100 transition-colors">
                <label className="w-1/3 text-[17px] text-black py-3">Confirm #</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={confirmAccountNumber}
                  onChange={(e) => { userModifiedFields.current.add('confirmAccountNumber'); setConfirmAccountNumber(e.target.value.replace(/\D/g, '')); }}
                  onBlur={() => handleBlur('confirmAccountNumber')}
                  placeholder="Re-enter number"
                  className="w-2/3 bg-transparent border-none text-[17px] text-right text-black placeholder-[#8E8E93] focus:ring-0 p-0 font-mono tracking-tight"
                />
              </div>
            </div>
            <p className="mt-2 px-4 text-[13px] text-[#8E8E93] leading-normal">Routing number can be found on the bottom left of your check.</p>
            {touched.routingNumber && routingNumberError && <p className="mt-1 px-4 text-[13px] text-red-500">{routingNumberError}</p>}
            {touched.accountNumber && accountNumberError && <p className="mt-1 px-4 text-[13px] text-red-500">{accountNumberError}</p>}
            {touched.confirmAccountNumber && confirmAccountNumberError && <p className="mt-1 px-4 text-[13px] text-red-500">{confirmAccountNumberError}</p>}
          </div>

          {/* ─── Security Badge ─── */}
          <div className="flex flex-col items-center justify-center mt-6 mb-8 opacity-80">
            <div className="flex items-center space-x-1.5 text-[#8E8E93]">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span className="text-[13px] font-medium">Bank-level Security</span>
            </div>
            <p className="text-[11px] text-[#8E8E93] mt-1 text-center max-w-xs">
              Your data is encrypted with 256-bit SSL security.
            </p>
          </div>
        </>}
        </main>

        {/* ═══ iOS Fixed Footer ═══ */}
        {!isFooterVisible && (
          <div
            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#C6C6C8]/30 px-4 pt-3 z-50"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            data-onboarding-footer
          >
            <div className="max-w-lg mx-auto flex flex-col gap-3">
              <div className="flex gap-4 h-[50px]">
                <button onClick={handleBack} disabled={loading} className="flex-1 bg-gray-200 text-black font-semibold text-[17px] rounded-xl active:bg-gray-300 transition-colors">Back</button>
                <button
                  onClick={handleContinue}
                  disabled={loading || !isFormValid()}
                  data-onboarding-cta
                  className={`flex-1 rounded-xl font-semibold text-[17px] flex items-center justify-center gap-1 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 ${
                    isFormValid() && !loading ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Saving...' : 'Continue'}
                  {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
              </div>
              <button onClick={handleSkip} disabled={loading} className="text-[15px] font-medium text-[#8E8E93] active:text-[#007AFF] transition-colors text-center">
                I'll do this later
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
