/**
 * Step 1 — All UI / Presentation
 * Share class selection, recurring investment, iOS-styled layout
 */
import { useStep1Logic, SHARE_CLASSES, TOTAL_STEPS, FREQ_OPTIONS, AMOUNT_PRESETS, formatCurrency } from './logic';
import { useNavigate } from 'react-router-dom';

export default function OnboardingStep1() {
  const navigate = useNavigate();
  const {
    units, frequency, investmentDay, selectedAmount, customAmount, customAmountError,
    error, isLoading, isFooterVisible, totalInvestment, hasSelection,
    handleUnitChange, handleAmountClick, handleCustomAmountChange,
    setFrequency, setInvestmentDay, handleNext, handleBack,
  } = useStep1Logic();

  return (
    <div className="bg-white min-h-[100dvh] pb-52" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      {/* iOS Navigation Bar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#C6C6C8]/30 flex items-end justify-between px-4 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 4px)', minHeight: '48px' }}>
        <button onClick={handleBack} className="text-[#007AFF] flex items-center -ml-2 active:opacity-50 transition-opacity" aria-label="Go back">
          <span className="material-symbols-outlined text-3xl -mr-1" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>chevron_left</span>
          <span className="text-[17px] leading-none pb-[2px]">Back</span>
        </button>
        <span className="font-semibold text-[17px] text-black">Setup</span>
        <button onClick={() => navigate('/dashboard')} className="text-[#007AFF] text-[17px] font-normal active:opacity-50 transition-opacity">Skip</button>
      </nav>

      <main className="px-4 pt-4 max-w-md mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-medium text-[#8E8E93] uppercase tracking-wide">Onboarding Progress</span>
            <span className="text-[13px] text-[#8E8E93]">Step 1/{TOTAL_STEPS}</span>
          </div>
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#007AFF] rounded-full transition-all duration-500" style={{ width: `${Math.round((1 / TOTAL_STEPS) * 100)}%` }} />
          </div>
          <p className="mt-2 text-[13px] font-medium text-[#007AFF]">{Math.round((1 / TOTAL_STEPS) * 100)}% complete</p>
        </div>

        {/* Title Block */}
        <div className="mb-6">
          <h2 className="text-[13px] font-semibold text-[#3C3C4399] uppercase tracking-wider mb-1">Institutional Series</h2>
          <h1 className="text-[34px] leading-tight font-bold tracking-tight text-black">
            Hushh Fund A<br /><span className="text-[#007AFF]">Multi-Strategy Alpha</span>
          </h1>
          <p className="mt-2 text-[17px] leading-snug text-[#3C3C4399]">Select unit allocation for each share class. Our inaugural fund leverages AI-driven value investing.</p>
        </div>

        {/* Error */}
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* Share Class Cards */}
        <div className="space-y-4 mb-8">
          {SHARE_CLASSES.map((sc) => {
            const count = units[sc.id];
            const isSelected = count > 0;
            return (
              <div key={sc.id} className={`bg-white rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${isSelected ? 'ring-2 ring-[#007AFF]/40' : ''}`}>
                <div className="p-4 border-b border-[#C6C6C8]/20">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[17px] font-semibold text-black">{sc.name}</h3>
                      {sc.tierLabel && <span className={`${sc.tierBg} ${sc.tierText} text-[11px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide`}>{sc.tierLabel}</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-[17px] font-semibold text-black">{sc.displayPrice}</div>
                      <div className="text-[11px] text-[#3C3C4399] uppercase">Per Unit</div>
                    </div>
                  </div>
                  <p className="text-[15px] text-[#3C3C4399] leading-snug pr-8">{sc.description}</p>
                </div>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-[15px] font-medium text-[#3C3C4399] uppercase tracking-wide">Units</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleUnitChange(sc.id, -1)} disabled={count === 0} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 disabled:opacity-50 transition active:bg-gray-100" aria-label={`Decrease ${sc.name} units`}>
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>remove</span>
                    </button>
                    <span className="text-[20px] font-medium w-4 text-center text-black">{count}</span>
                    <button onClick={() => handleUnitChange(sc.id, 1)} className="w-8 h-8 rounded-full border border-[#007AFF] text-[#007AFF] flex items-center justify-center transition active:bg-blue-50" aria-label={`Increase ${sc.name} units`}>
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recurring Investment */}
        <div className="mb-4">
          <div className="text-center mb-4 px-4">
            <h3 className="text-[20px] font-semibold text-black">Recurring Investment</h3>
            <p className="text-[15px] text-[#3C3C4399] mt-1">Configure automated contributions to streamline future capital calls.</p>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="px-4 py-3 border-b border-[#C6C6C8]/20 flex justify-between items-center">
              <span className="text-[13px] font-medium text-[#3C3C4399] uppercase tracking-wide">Frequency</span>
              <span className="bg-gray-100 text-[#3C3C4399] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Optional</span>
            </div>
            <div className="p-4 border-b border-[#C6C6C8]/20">
              <div className="grid grid-cols-2 gap-3">
                {FREQ_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setFrequency(opt.value)} className={`py-2.5 px-2 text-[15px] font-medium rounded-lg border text-center transition ${frequency === opt.value ? 'bg-blue-50 text-[#007AFF] border-[#007AFF]/20' : 'bg-white text-black border-gray-200 hover:bg-gray-50'}`}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div className="px-4 py-4 border-b border-[#C6C6C8]/20">
              <label className="text-[13px] font-medium text-[#3C3C4399] uppercase tracking-wide mb-2 block">Investment Day</label>
              <div className="relative">
                <select value={investmentDay} onChange={(e) => setInvestmentDay(e.target.value)} className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-2.5 px-3 pr-8 text-[17px] text-black focus:outline-none focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]">
                  <option>1st of the month</option><option>15th of the month</option><option>Last day of the month</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#3C3C4399]">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>expand_more</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <label className="text-[13px] font-medium text-[#3C3C4399] uppercase tracking-wide mb-3 block">Recurring Amount</label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {AMOUNT_PRESETS.map((amt) => (
                  <button key={amt} onClick={() => handleAmountClick(amt)} className={`py-2.5 px-2 text-[15px] font-medium rounded-lg border text-center transition ${selectedAmount === amt ? 'bg-blue-50 text-[#007AFF] border-[#007AFF]/20' : 'bg-white text-black border-gray-200 hover:bg-gray-50'}`}>${(amt / 1000).toLocaleString()}k</button>
                ))}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-[#3C3C4399] text-[17px]">$</span></div>
                <input type="text" inputMode="numeric" value={customAmount} onChange={handleCustomAmountChange} placeholder="Enter custom amount" className={`block w-full pl-7 pr-3 py-2.5 border rounded-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-1 text-[17px] ${customAmountError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#007AFF] focus:border-[#007AFF]'}`} />
              </div>
              {customAmountError && <p className="text-red-500 text-[12px] mt-1.5 px-1">{customAmountError}</p>}
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
      {!isFooterVisible && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-[#C6C6C8]/30 z-40 pt-4 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[13px] font-bold text-[#3C3C4399] uppercase tracking-wide">Total Investment</span>
              <span className="text-[22px] font-bold text-black">{formatCurrency(totalInvestment)}</span>
            </div>
            <button onClick={handleNext} disabled={!hasSelection || isLoading || !!customAmountError} data-onboarding-cta className={`w-full font-semibold text-[17px] py-3.5 rounded-xl transition duration-200 shadow-md ${!hasSelection || isLoading || !!customAmountError ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#007AFF] hover:bg-blue-600 text-white active:scale-[0.98]'}`}>
              {isLoading ? 'Saving...' : 'Next'}
            </button>
            <p className="text-[11px] text-center text-[#3C3C4399] mt-3">Minimum investment per unit • Units can be adjusted later</p>
          </div>
        </footer>
      )}
    </div>
  );
}
