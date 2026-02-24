import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../resources/config/config';
import { upsertOnboardingData } from '../../../services/onboarding/upsertOnboardingData';
import { useFooterVisibility } from '../../../utils/useFooterVisibility';

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

export const DISPLAY_STEP = 6;
export const TOTAL_STEPS = 12;
export const PROGRESS_PCT = Math.round((DISPLAY_STEP / TOTAL_STEPS) * 100);

/* ═══════════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════════ */

export function useStep7Logic() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFooterVisible = useFooterVisibility();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  /* ─── Load user + existing data ─── */
  useEffect(() => {
    const loadData = async () => {
      if (!config.supabaseClient) return;

      const { data: { user } } = await config.supabaseClient.auth.getUser();
      if (!user) { navigate('/login'); return; }

      // Extract name from OAuth provider metadata
      const meta = user.user_metadata || {};
      const oauthFirst = meta.given_name || meta.first_name || (meta.full_name?.split(' ')[0]) || (meta.name?.split(' ')[0]) || '';
      const oauthLast = meta.family_name || meta.last_name || (meta.full_name?.split(' ').slice(1).join(' ')) || (meta.name?.split(' ').slice(1).join(' ')) || '';

      // Check saved data — priority: DB > OAuth
      const { data } = await config.supabaseClient
        .from('onboarding_data')
        .select('legal_first_name, legal_last_name')
        .eq('user_id', user.id)
        .maybeSingle();

      setFirstName(data?.legal_first_name || oauthFirst);
      setLastName(data?.legal_last_name || oauthLast);
    };
    loadData();
  }, [navigate]);

  /* ─── Handlers ─── */
  const handleContinue = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first and last name');
      return;
    }

    setIsLoading(true);
    setError(null);

    if (!config.supabaseClient) { setError('Configuration error'); setIsLoading(false); return; }

    const { data: { user } } = await config.supabaseClient.auth.getUser();
    if (!user) { setError('Not authenticated'); setIsLoading(false); return; }

    const { error: upsertError } = await upsertOnboardingData(user.id, {
      legal_first_name: firstName.trim(),
      legal_last_name: lastName.trim(),
      current_step: 7,
    });

    if (upsertError) { setError('Failed to save data'); setIsLoading(false); return; }
    navigate('/onboarding/step-8');
  };

  const handleBack = () => navigate('/onboarding/step-5');

  const handleSkip = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      if (config.supabaseClient) {
        const { data: { user } } = await config.supabaseClient.auth.getUser();
        if (user) await upsertOnboardingData(user.id, { current_step: 7 });
      }
      navigate('/onboarding/step-8');
    } catch { navigate('/onboarding/step-8'); }
    finally { setIsLoading(false); }
  };

  const isValid = Boolean(firstName.trim() && lastName.trim());

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    if (error) setError(null);
  };

  const handleLastNameChange = (value: string) => {
    setLastName(value);
    if (error) setError(null);
  };

  return {
    // State
    firstName,
    lastName,
    isLoading,
    error,
    isFooterVisible,

    // Derived
    isValid,

    // Handlers
    handleFirstNameChange,
    handleLastNameChange,
    handleContinue,
    handleBack,
    handleSkip,
  };
}
