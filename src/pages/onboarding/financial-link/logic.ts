/**
 * FinancialLink — All Business Logic
 * Pre-onboarding financial verification via Plaid
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../resources/config/config';
import type { FinancialVerificationResult } from '../../../types/kyc';

export interface FinancialLinkLogic {
  userId: string;
  userEmail: string | undefined;
  isReady: boolean;
  handleContinue: (result: FinancialVerificationResult) => void;
  handleSkip: () => void;
}

export const useFinancialLinkLogic = (): FinancialLinkLogic => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);
  const hasInitialized = useRef(false);

  /* Scroll to top */
  useEffect(() => { window.scrollTo(0, 0); }, []);

  /* Get authenticated user — runs only once */
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const getUser = async () => {
      if (!config.supabaseClient) { navigate('/login'); return; }
      const { data: { user } } = await config.supabaseClient.auth.getUser();
      if (!user) { navigate('/login'); return; }

      setUserId(user.id);
      setUserEmail(user.email || undefined);

      // Check if user already completed financial link
      try {
        const { data: financialData, error: fetchError } = await config.supabaseClient
          .from('user_financial_data').select('status').eq('user_id', user.id).maybeSingle();
        if (fetchError) console.warn('[FinancialLink] Supabase query error (ignoring):', fetchError.message);
      } catch (err) {
        console.warn('[FinancialLink] Error checking financial data (ignoring):', err);
      }

      setIsReady(true);
    };

    getUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Verification complete → go to Step 1 */
  const handleContinue = (result: FinancialVerificationResult) => {
    console.log('[FinancialLink] Verification complete:', result);
    sessionStorage.setItem('financial_verification_complete', 'true');
    navigate('/onboarding/step-1', { replace: true });
  };

  /* Skip — let user proceed without linking bank */
  const handleSkip = () => {
    sessionStorage.setItem('financial_link_skipped', 'true');
    console.log('[FinancialLink] User skipped financial verification');
    navigate('/onboarding/step-1', { replace: true });
  };

  return { userId, userEmail, isReady, handleContinue, handleSkip };
};
