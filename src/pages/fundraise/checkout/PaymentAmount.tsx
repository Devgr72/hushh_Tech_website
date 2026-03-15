import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FundriseShell from '../../../components/FundriseShell';
import { useFundrise } from '../../../contexts/FundriseContext';

const DocIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C8479" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function PaymentAmount() {
    const navigate = useNavigate();
    const { state, update } = useFundrise();
    const [amount, setAmount] = useState(state.investmentAmount || '');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only digits and one decimal point, max 2 decimal places
        const raw = e.target.value.replace(/[^\d.]/g, '');
        setAmount(raw);
    };

    const numVal = parseFloat(amount);
    const isValid = !isNaN(numVal) && numVal >= 10;

    const handleContinue = () => {
        if (!isValid) return;
        update({ investmentAmount: amount });
        navigate('/reits/checkout/auto-invest');
    };

    return (
        <FundriseShell
            onBack={() => navigate(-1 as any)}
            onClose={() => navigate('/')}
        >
            <div className="bg-white rounded-xl border border-[#EEE9E0] shadow-[0_2px_20px_rgba(21,21,19,0.06)] px-6 py-8 sm:px-10">
                <h1
                    className="text-[1.75rem] font-semibold text-[#151513] mb-6 leading-tight"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                    Initial investment amount
                </h1>

                {/* Amount input */}
                <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-medium text-[#8C8479] select-none">
                        $
                    </span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={handleInput}
                        placeholder="Enter an amount..."
                        className="w-full pl-9 pr-4 py-3.5 border border-[#C4BFB5] rounded-lg text-[18px] font-medium text-[#151513]
              bg-white focus:outline-none focus:border-[#AA4528] focus:ring-2 focus:ring-[#AA4528]/20 transition-all
              placeholder:text-[#B0AAA3] placeholder:text-[16px] placeholder:font-normal"
                    />
                </div>

                {/* Info box */}
                <div className="bg-[#F7F5F0] rounded-lg p-4 border border-[#EEE9E0] mb-6">
                    <div className="flex gap-3">
                        <span className="flex-shrink-0 mt-0.5"><DocIcon /></span>
                        <div>
                            <p className="text-[13px] font-semibold text-[#151513] mb-1">How do redemptions work at Hushh?</p>
                            <p className="text-[13px] text-[#5C564D] leading-relaxed mb-2">
                                You can request to redeem (withdraw) from our Flagship funds at any time without penalty. Requests are then processed quarterly - in January, April, July, and October.
                            </p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-[13px] font-semibold text-[#AA4528] hover:text-[#8C3720] transition-colors"
                            >
                                Learn more
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleContinue}
                    disabled={!isValid}
                    className={`w-full py-4 rounded-lg text-[15px] font-semibold transition-all ${isValid
                        ? 'bg-[#AA4528] text-white hover:bg-[#8C3720] active:scale-[0.99]'
                        : 'bg-[#EEE9E0] text-[#C4BFB5] cursor-not-allowed'
                        }`}
                >
                    Continue
                </button>
            </div>

            {/* Learn More Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                    <div className="bg-white rounded-xl w-full max-w-[600px] shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-[#EEE9E0]">
                            <h2
                                className="text-[1.5rem] font-semibold text-[#151513]"
                                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                            >
                                Redemptions at Hushh
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-[#5C564D] hover:text-[#151513] transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-8 py-6 overflow-y-auto">
                            <p className="text-[15px] text-[#2B2925] leading-relaxed mb-6">
                                While Hushh investments are intended to be long-term (5+ years), we recognize life is unpredictable and investors may want to withdraw their investments early.
                            </p>
                            <p className="text-[15px] text-[#2B2925] leading-relaxed mb-6">
                                Private market investments typically offer no liquidity or ability to sell, but <strong>our Flagship funds process redemption requests on a quarterly basis</strong> (4x per year in January, April, July, and October), and <strong>you can request redemption at any time.</strong>
                            </p>
                            <p className="text-[15px] text-[#2B2925] leading-relaxed">
                                Furthermore, our Flagship Funds do not charge any penalty or fee to redeem early. For more information on our smaller, more advanced offerings, please see any fund&apos;s offering circular.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 flex justify-end pb-8">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-3 bg-[#B04A2F] text-white text-[15px] font-semibold rounded-lg hover:bg-[#923C24] transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </FundriseShell>
    );
}
