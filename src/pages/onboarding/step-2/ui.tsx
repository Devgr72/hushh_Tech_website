/**
 * Step 2 — All UI / Presentation
 * Referral source selection, iOS-styled layout
 */
import { useStep2Logic, REFERRAL_OPTIONS, CURRENT_STEP, TOTAL_STEPS, PROGRESS_PCT } from './logic';

export default function OnboardingStep2() {
  const { selectedSource, isLoading, isFooterVisible, setSelectedSource, handleContinue, handleSkip, handleBack } = useStep2Logic();

  return (
    <div className="bg-white min-h-[100dvh] flex flex-col" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* iOS Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#C6C6C8]/30 flex items-end justify-between px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 4px)', minHeight: '48px' }}>
        <button onClick={handleBack} className="text-[#007AFF] flex items-center -ml-2 active:opacity-50 transition-opacity" aria-label="Go back">
          <span className="material-symbols-outlined text-3xl -mr-1" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>chevron_left</span>
          <span className="text-[17px] leading-none pb-[2px]">Back</span>
        </button>
        <span className="font-semibold text-[17px] text-black">Setup</span>
        <button onClick={handleSkip} className="text-[17px] text-[#007AFF] font-normal active:opacity-50 transition-opacity">Skip</button>
      </nav>

      <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-4 pt-4 pb-52">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-medium tracking-wide text-[#8E8E93] uppercase">Onboarding Progress</span>
            <span className="text-[13px] font-medium text-[#8E8E93]">Step {CURRENT_STEP}/{TOTAL_STEPS}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-[#007AFF] h-1 rounded-full transition-all duration-500" style={{ width: `${PROGRESS_PCT}%` }} />
          </div>
          <p className="text-[#007AFF] text-xs font-medium mt-2">{PROGRESS_PCT}% complete</p>
        </div>

        {/* Title */}
        <h1 className="text-[34px] leading-[41px] font-bold text-black mb-8 tracking-tight">How did you hear about Hushh Fund&nbsp;A?</h1>

        {/* iOS Grouped Table */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          {REFERRAL_OPTIONS.map((option, idx) => {
            const isSelected = selectedSource === option.value;
            const isLast = idx === REFERRAL_OPTIONS.length - 1;
            return (
              <label key={option.value} className={`group flex items-center p-4 cursor-pointer active:bg-gray-100 transition-colors relative ${!isLast ? 'border-b border-[#C6C6C8]/30' : ''}`}>
                <div className={`w-8 h-8 rounded-lg ${option.iconBg} flex items-center justify-center mr-4 shrink-0 ${option.iconColor}`}>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>{option.icon}</span>
                </div>
                <span className="text-[17px] font-medium text-black flex-grow">{option.label}</span>
                <input type="radio" name="referral-source" value={option.value} checked={isSelected} onChange={() => setSelectedSource(option.value)} className="sr-only" />
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${isSelected ? 'border-[#007AFF] bg-[#007AFF]' : 'border-gray-300'}`}>
                  {isSelected && <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>}
                </div>
              </label>
            );
          })}
        </div>
      </main>

      {/* Fixed Footer */}
      {!isFooterVisible && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-[#C6C6C8]/30 z-40" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} data-onboarding-footer>
          <div className="max-w-md mx-auto flex gap-3">
            <button onClick={handleSkip} className="flex-1 h-[50px] rounded-xl bg-gray-100 text-[#007AFF] font-semibold text-[17px] active:bg-gray-200 transition-colors flex items-center justify-center">Skip</button>
            <button onClick={handleContinue} disabled={!selectedSource || isLoading} data-onboarding-cta className={`flex-[2] h-[50px] rounded-xl font-semibold text-[17px] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center ${selectedSource && !isLoading ? 'bg-[#007AFF] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {isLoading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
