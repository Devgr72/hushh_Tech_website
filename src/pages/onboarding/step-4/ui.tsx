/**
 * Step 4 — All UI / Presentation
 * Country selection, location detection, iOS-styled layout
 */
import { useStep4Logic, countries, CURRENT_STEP, TOTAL_STEPS, PROGRESS_PCT } from './logic';
import PermissionHelpModal from '../../../components/PermissionHelpModal';

export default function OnboardingStep4() {
  const s = useStep4Logic();

  return (
    <div className="bg-white min-h-[100dvh] flex flex-col relative overflow-hidden" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* Background layer (blurs when modal is open) */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${s.showLocationModal ? 'scale-[0.98] blur-[2px] opacity-60' : ''}`}>
        {/* iOS Navigation Bar */}
        <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#C6C6C8]/30 flex items-end justify-between px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 4px)', minHeight: '48px' }}>
          <button onClick={s.handleBack} className="text-[#007AFF] flex items-center -ml-2 active:opacity-50 transition-opacity" aria-label="Go back">
            <span className="material-symbols-outlined text-3xl -mr-1" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>chevron_left</span>
            <span className="text-[17px] leading-none pb-[2px]">Back</span>
          </button>
          <h1 className="text-[17px] font-semibold text-black absolute left-1/2 transform -translate-x-1/2">Setup</h1>
          <button onClick={s.handleSkip} className="text-[#007AFF] font-medium text-[17px]">Skip</button>
        </nav>

        <main className="flex-1 flex flex-col max-w-md mx-auto w-full px-4 pt-4 pb-52">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide">Onboarding Progress</span>
              <span className="text-[13px] text-[#8E8E93]">Step {CURRENT_STEP}/{TOTAL_STEPS}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div className="bg-[#007AFF] h-1 rounded-full transition-all duration-500" style={{ width: `${PROGRESS_PCT}%` }} />
            </div>
            <p className="mt-2 text-[13px] font-medium text-[#007AFF]">{PROGRESS_PCT}% complete</p>
          </div>

          {/* Title */}
          <h1 className="text-[34px] leading-[41px] font-bold text-black mb-2 tracking-tight">Confirm your residence</h1>
          <p className="text-[17px] text-[#8E8E93] mb-8 leading-snug">We need to know where you live and pay taxes to open your investment account.</p>

          {/* Status Banners */}
          {s.locationStatus === 'detecting' && (
            <div className="flex items-center gap-3 p-3 mb-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="animate-spin h-5 w-5 border-2 border-[#007AFF] border-t-transparent rounded-full shrink-0" />
              <p className="text-sm font-medium text-[#007AFF]">Detecting your location...</p>
            </div>
          )}
          {s.isSuccessStatus && (
            <div className="flex items-start gap-3 p-4 mb-8 bg-green-50 rounded-xl">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm font-bold" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700", fontSize: '14px' }}>check</span>
              </div>
              <p className="text-[15px] leading-snug text-black"><span className="font-semibold">Location detected:</span> {s.detectedLocation}</p>
            </div>
          )}
          {s.isErrorStatus && (
            <div className="mb-4">
              <div className="flex items-center justify-between gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>error</span>
                  <p className="text-sm font-medium text-red-700">{s.locationStatus === 'denied' ? 'Location access denied' : 'Could not detect location'}</p>
                </div>
                <button onClick={s.handleRetry} className="text-[#007AFF] text-sm font-semibold shrink-0">Retry</button>
              </div>
              {s.locationStatus === 'denied' && (
                <button onClick={(e) => { e.preventDefault(); s.setShowPermissionHelp(true); }} className="mt-2 ml-1 text-xs font-semibold text-[#007AFF]">How to enable location</button>
              )}
            </div>
          )}

          {/* Country Selection */}
          {s.shouldShowForm && (
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="px-4 text-[13px] uppercase text-[#8E8E93] font-normal">Country of Citizenship</span>
                <div className="bg-white rounded-xl overflow-hidden border border-[#C6C6C8]/50">
                  <label className="flex items-center justify-between pl-4 pr-3 py-3 cursor-pointer active:bg-gray-100 transition-colors relative">
                    <span className="text-[17px] text-black">{s.citizenshipCountry || 'Select country'}</span>
                    <span className="material-symbols-outlined text-gray-400" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>chevron_right</span>
                    <select value={s.citizenshipCountry} onChange={(e) => s.handleCitizenshipChange(e.target.value)} disabled={s.isDetectingLocation} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                      <option disabled value="">Select country</option>
                      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <span className="px-4 text-[13px] uppercase text-[#8E8E93] font-normal">Country of Residence</span>
                <div className="bg-white rounded-xl overflow-hidden border border-[#C6C6C8]/50">
                  <label className="flex items-center justify-between pl-4 pr-3 py-3 cursor-pointer active:bg-gray-100 transition-colors relative">
                    <span className="text-[17px] text-black">{s.residenceCountry || 'Select country'}</span>
                    <span className="material-symbols-outlined text-gray-400" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>chevron_right</span>
                    <select value={s.residenceCountry} onChange={(e) => s.handleResidenceChange(e.target.value)} disabled={s.isDetectingLocation} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                      <option disabled value="">Select country</option>
                      {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              {!s.locationDetected && s.canConfirmSelection && !s.userConfirmedManual && (
                <button onClick={s.handleConfirmManualSelection} className="w-full py-2.5 rounded-xl bg-[#007AFF]/10 text-[#007AFF] font-semibold text-[15px] active:scale-[0.98] transition-all">Confirm Selection</button>
              )}
            </div>
          )}

          {/* Detect Location Button */}
          {!s.showLocationModal && !s.isDetectingLocation && !s.isSuccessStatus && (
            <button onClick={s.handleAllowLocation} className="w-full py-3 rounded-xl border border-[#007AFF]/20 bg-blue-50 text-[#007AFF] font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>my_location</span>
              Detect My Location
            </button>
          )}
        </main>
      </div>

      {/* Dark Overlay */}
      {s.showLocationModal && <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[1px]" />}

      {/* iOS System Alert Dialog */}
      {s.showLocationModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-8">
          <div className="w-[270px] overflow-hidden rounded-[14px] shadow-2xl" style={{ backgroundColor: 'rgba(245, 245, 245, 0.85)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}>
            <div className="px-4 pt-5 pb-4 text-center">
              <h3 className="text-[17px] font-semibold leading-[22px] text-black mb-1">Allow &ldquo;Hushh&rdquo; to use your location?</h3>
              <p className="text-[13px] leading-[16px] font-normal text-black px-1">Your location is used to automatically determine your country and streamline the verification process.</p>
            </div>
            <div className="flex flex-col border-t" style={{ borderColor: 'rgba(60,60,67,0.2)' }}>
              <button onClick={s.handleAllowLocation} className="h-[44px] w-full text-[17px] leading-[22px] text-[#007AFF] font-normal active:bg-gray-200/50 transition-colors border-b" style={{ borderColor: 'rgba(60,60,67,0.2)' }}>Allow Once</button>
              <button onClick={s.handleAllowLocation} className="h-[44px] w-full text-[17px] leading-[22px] text-[#007AFF] font-normal active:bg-gray-200/50 transition-colors border-b" style={{ borderColor: 'rgba(60,60,67,0.2)' }}>Allow While Using App</button>
              <button onClick={s.handleDontAllow} className="h-[44px] w-full text-[17px] leading-[22px] text-[#007AFF] font-semibold active:bg-gray-200/50 transition-colors">Don&apos;t Allow</button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Footer */}
      {!s.isFooterVisible && !s.showLocationModal && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-[#C6C6C8]/30 z-40" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }} data-onboarding-footer>
          <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
            <button onClick={s.handleSkip} className="h-[50px] w-full rounded-xl bg-[#F2F2F7] text-[#007AFF] font-semibold text-[17px] active:bg-gray-200 transition-colors flex items-center justify-center">Skip</button>
            <button onClick={s.handleContinue} disabled={!s.canContinue || s.isLoading || s.isDetectingLocation} data-onboarding-cta className={`h-[50px] w-full rounded-xl font-semibold text-[17px] shadow-sm transition-all flex items-center justify-center ${s.canContinue && !s.isLoading && !s.isDetectingLocation ? 'bg-[#007AFF] text-white active:opacity-90 active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {s.isDetectingLocation ? (<><div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />Detecting...</>) : s.isLoading ? 'Saving...' : 'Next'}
            </button>
          </div>
        </div>
      )}

      <PermissionHelpModal isOpen={s.showPermissionHelp} onClose={() => s.setShowPermissionHelp(false)} />
    </div>
  );
}
