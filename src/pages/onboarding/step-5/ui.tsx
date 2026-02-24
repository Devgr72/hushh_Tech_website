import React from 'react';
import ReactCountryFlag from 'react-country-flag';
import {
  useStep5Logic,
  CURRENT_STEP,
  TOTAL_STEPS,
  PROGRESS_PCT,
  PHONE_DIAL_CODES,
  ACCOUNT_TYPE_OPTIONS,
} from './logic';

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export default function OnboardingStep5() {
  const {
    selectedAccountType,
    setSelectedAccountType,
    phoneNumber,
    countryCode,
    selectedDialCountryIso,
    isAutoDetectingDialCode,
    isLoading,
    showDialPicker,
    setShowDialPicker,
    isFooterVisible,
    canContinue,
    selectedDialOption,
    formatPhoneNumber,
    handlePhoneChange,
    handleContinue,
    handleBack,
    handleSkip,
    handleSelectDialCode,
  } = useStep5Logic();

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div
      className="bg-white min-h-[100dvh] flex flex-col relative"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", WebkitFontSmoothing: 'antialiased' }}
    >
      {/* ═══ iOS Navigation Bar ═══ */}
      <nav
        className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#C6C6C8]/30 flex items-end justify-between px-4 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 4px)', minHeight: '48px' }}
      >
        <button onClick={handleBack} className="text-[#007AFF] flex items-center -ml-2 active:opacity-50 transition-opacity" aria-label="Go back">
          <span className="material-symbols-outlined text-3xl -mr-1" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
            chevron_left
          </span>
          <span className="text-[17px] leading-none pb-[2px]">Back</span>
        </button>
        <span className="font-semibold text-[17px] text-black">Setup</span>
        <button onClick={handleSkip} className="text-[#007AFF] font-normal text-[17px] active:opacity-50 transition-opacity">
          Skip
        </button>
      </nav>

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-4 pt-4 pb-48">
        {/* ─── Progress Bar ─── */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide">Onboarding Progress</span>
            <span className="text-[13px] text-[#8E8E93]">Step {CURRENT_STEP}/{TOTAL_STEPS}</span>
          </div>
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#007AFF] rounded-full transition-all duration-500" style={{ width: `${PROGRESS_PCT}%` }} />
          </div>
          <p className="mt-2 text-[13px] font-medium text-[#007AFF]">{PROGRESS_PCT}% complete</p>
        </div>

        {/* ─── Title ─── */}
        <div className="mb-8">
          <h1 className="text-[34px] leading-[41px] font-bold text-black tracking-tight mb-2">
            A few more details
          </h1>
          <p className="text-[17px] text-[#8E8E93] leading-relaxed">
            This helps us personalize your account and keep your profile secure.
          </p>
        </div>

        {/* ─── Account Type — iOS Grouped Table ─── */}
        <div className="mb-8">
          <h2 className="text-[13px] uppercase text-[#8E8E93] font-medium mb-2 pl-4">
            Account type
          </h2>
          <div className="bg-[#F2F2F7] rounded-[10px] overflow-hidden">
            {ACCOUNT_TYPE_OPTIONS.map((option, index) => {
              const isSelected = selectedAccountType === option.value;
              const isLast = index === ACCOUNT_TYPE_OPTIONS.length - 1;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedAccountType(option.value)}
                  className={`w-full flex items-center justify-between pl-4 pr-4 py-3.5 bg-white active:bg-gray-100 transition-colors ${
                    !isLast ? 'border-b border-[#C6C6C8]/40 ml-0' : ''
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Select ${option.label} account`}
                >
                  <span className="text-[17px] text-black">{option.label}</span>
                  {isSelected && (
                    <span
                      className="material-symbols-outlined text-[#007AFF] text-xl"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}
                    >
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Phone Number ─── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[22px] leading-[28px] font-bold text-black">Phone number</h2>
            {isAutoDetectingDialCode && (
              <span className="text-xs font-medium text-[#8E8E93]">Detecting...</span>
            )}
          </div>
          <p className="text-[13px] text-[#8E8E93] mb-4">
            We&apos;ll use this to verify your identity when needed.
          </p>

          {/* iOS-style phone input */}
          <div className="bg-[#F2F2F7] rounded-[10px] flex items-center overflow-hidden h-[50px] ring-1 ring-transparent focus-within:ring-[#007AFF] transition-all">
            {/* Country code selector */}
            <button
              onClick={() => setShowDialPicker(true)}
              className="flex items-center pl-4 pr-3 h-full border-r border-[#C6C6C8]/40 bg-white active:bg-gray-100 transition-colors"
            >
              <ReactCountryFlag
                countryCode={selectedDialOption.iso}
                svg
                style={{ width: '1.25em', height: '1.25em', borderRadius: 2, flexShrink: 0 }}
                aria-label={selectedDialOption.country}
              />
              <span className="text-[17px] font-medium text-black ml-2">{selectedDialOption.code}</span>
              <span className="material-symbols-outlined text-[#8E8E93] text-lg ml-1" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                expand_more
              </span>
            </button>

            {/* Phone input */}
            <input
              type="tel"
              value={formatPhoneNumber(phoneNumber)}
              onChange={handlePhoneChange}
              placeholder="(000) 000-0000"
              className="flex-1 h-full bg-white border-none focus:ring-0 text-[17px] text-black placeholder-gray-400 px-4 outline-none"
            />
          </div>

          <p className="text-xs text-[#8E8E93] mt-2 ml-4">
            Standard message and data rates may apply.
          </p>
        </div>
      </main>

      {/* ═══ Fixed Footer — 2-column ═══ */}
      {!isFooterVisible && (
        <div
          className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-[#C6C6C8]/30 z-40"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          data-onboarding-footer
        >
          <div className="max-w-md mx-auto flex gap-4">
            <button
              onClick={handleSkip}
              className="flex-1 bg-[#E5E5EA] text-[#007AFF] font-semibold text-[17px] py-[14px] rounded-xl active:opacity-70 transition-opacity flex items-center justify-center"
            >
              Skip
            </button>
            <button
              onClick={handleContinue}
              disabled={!canContinue || isLoading}
              data-onboarding-cta
              className={`flex-1 font-semibold text-[17px] py-[14px] rounded-xl shadow-sm transition-all flex items-center justify-center ${
                canContinue && !isLoading
                  ? 'bg-[#007AFF] text-white active:opacity-80'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ Dial Code Picker Modal ═══ */}
      {showDialPicker && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowDialPicker(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[60vh] flex flex-col"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#C6C6C8]/30">
              <h3 className="text-[17px] font-semibold text-black">Select Country Code</h3>
              <button onClick={() => setShowDialPicker(false)} className="text-[#007AFF] font-medium text-[17px]">Done</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {PHONE_DIAL_CODES.map((option) => (
                <button
                  key={option.iso}
                  onClick={() => handleSelectDialCode(option)}
                  className={`w-full flex items-center justify-between px-4 py-3 border-b border-[#C6C6C8]/20 active:bg-gray-100 transition-colors ${
                    option.code === countryCode && option.iso === selectedDialCountryIso ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ReactCountryFlag
                      countryCode={option.iso}
                      svg
                      style={{ width: '1.25em', height: '1.25em', borderRadius: 2 }}
                      aria-label={option.country}
                    />
                    <span className="text-[17px] text-black">{option.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-medium text-[#8E8E93]">{option.code}</span>
                    {option.code === countryCode && option.iso === selectedDialCountryIso && (
                      <span className="material-symbols-outlined text-[#007AFF] text-xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}>check</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
