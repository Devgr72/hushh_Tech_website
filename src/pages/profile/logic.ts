import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import axios from 'axios';
import config from '../../resources/config/config';

export function useProfileLogic() {
  const toast = useToast();
  const navigate = useNavigate();

  const [session, setSession] = useState<any>(null);
  const [ndaStatus, setNdaStatus] = useState<string>('Not Applied');
  const [ndaMetadata, setNdaMetadata] = useState<any>(null);
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [showNdaDocModal, setShowNdaDocModal] = useState(false);
  const [ndaApproved, setNdaApproved] = useState(false);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const metadataFetchedRef = useRef<boolean>(false);

  // Onboarding status state
  const [onboardingStatus, setOnboardingStatus] = useState<{
    hasProfile: boolean;
    isCompleted: boolean;
    currentStep: number;
    loading: boolean;
  }>({
    hasProfile: false,
    isCompleted: false,
    currentStep: 1,
    loading: true,
  });

  useEffect(() => {
    config.supabaseClient?.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = config.supabaseClient?.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    }) ?? { data: { subscription: null } };
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Check user's onboarding status
  useEffect(() => {
    async function checkUserStatus() {
      if (!session?.user?.id || !config.supabaseClient) {
        setOnboardingStatus((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Check if investor_profile exists
        const { data: profile, error: profileError } = await config.supabaseClient
          .from('investor_profiles')
          .select('id, user_confirmed')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // Check onboarding_data status
        const { data: onboarding } = await config.supabaseClient
          .from('onboarding_data')
          .select('is_completed, current_step')
          .eq('user_id', session.user.id)
          .maybeSingle();

        setOnboardingStatus({
          hasProfile: !!profile && !profileError,
          isCompleted: onboarding?.is_completed || false,
          currentStep: onboarding?.current_step || 1,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking user status:', error);
        setOnboardingStatus((prev) => ({ ...prev, loading: false }));
      }
    }

    if (session?.user?.id) {
      checkUserStatus();
    }
  }, [session?.user?.id]);

  const fetchNdaMetadata = useCallback(async () => {
    if (
      isMetadataLoading ||
      (ndaMetadata && Object.keys(ndaMetadata).length > 0) ||
      metadataFetchedRef.current
    ) {
      return;
    }

    setIsMetadataLoading(true);
    try {
      const ndaResponse = await axios.post(
        'https://gsqmwxqgqrgzhlhmbscg.supabase.co/rest/v1/rpc/get_nda_metadata',
        {},
        {
          headers: {
            apikey: config.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (ndaResponse.data.status === 'success') {
        const metadata = ndaResponse.data.metadata;
        setNdaMetadata(metadata);

        if (metadata && Object.keys(metadata).length > 0) {
          metadataFetchedRef.current = true;
        }

        if (metadata && ndaStatus === 'Pending: Waiting for NDA Process') {
          setShowNdaDocModal(true);
        }
      }
    } catch (error) {
      metadataFetchedRef.current = false;
    } finally {
      setIsMetadataLoading(false);
    }
  }, [session, ndaMetadata, isMetadataLoading, ndaStatus]);

  const checkNdaStatus = useCallback(async () => {
    if (!session) return;
    try {
      const response = await axios.post(
        'https://gsqmwxqgqrgzhlhmbscg.supabase.co/rest/v1/rpc/check_access_status',
        {},
        {
          headers: {
            apikey: config.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const newStatus = response.data;
      setNdaStatus(newStatus);

      if (newStatus === 'Approved') {
        setNdaApproved(true);
      }

      if (newStatus === 'Pending: Waiting for NDA Process' && !metadataFetchedRef.current) {
        fetchNdaMetadata();
      }
    } catch (error) {
      metadataFetchedRef.current = false;
      console.warn('Failed to check NDA access status', error);
    }
  }, [session, fetchNdaMetadata]);

  useEffect(() => {
    if (session) {
      checkNdaStatus();
      const intervalId = setInterval(() => {
        checkNdaStatus();
      }, 5000);
      return () => clearInterval(intervalId);
    }
  }, [session, checkNdaStatus]);

  useEffect(() => {
    if (ndaStatus !== 'Pending: Waiting for NDA Process') {
      metadataFetchedRef.current = false;
    }
  }, [ndaStatus]);

  // Get primary CTA text and action
  const getPrimaryCTAContent = () => {
    if (onboardingStatus.loading) {
      return { text: 'Loading...', action: () => {} };
    }
    if (onboardingStatus.hasProfile || onboardingStatus.isCompleted) {
      return {
        text: 'View Your Profile',
        action: () => navigate('/hushh-user-profile'),
      };
    }
    if (onboardingStatus.currentStep > 1) {
      return {
        text: `Continue Onboarding (Step ${onboardingStatus.currentStep})`,
        action: () => navigate(`/onboarding/step-${onboardingStatus.currentStep}`),
      };
    }
    return {
      text: 'Complete Your Hushh Profile',
      action: () => navigate('/onboarding/financial-link'),
    };
  };

  const primaryCTA = getPrimaryCTAContent();

  const handleDiscoverFundA = () => navigate('/discover-fund-a');

  const handleNdaModalClose = () => setShowNdaModal(false);

  const handleNdaSubmit = (result: string) => {
    setNdaStatus(result);
    setShowNdaModal(false);

    if (result === 'Pending: Waiting for NDA Process') {
      fetchNdaMetadata();
    }
  };

  const handleNdaDocModalClose = () => setShowNdaDocModal(false);

  const handleNdaAccept = () => {
    setNdaApproved(true);
    setShowNdaDocModal(false);
    setNdaStatus('Approved');
    localStorage.setItem('communityFilter', 'nda');
  };

  return {
    session,
    ndaMetadata,
    showNdaModal,
    showNdaDocModal,
    ndaApproved,
    onboardingStatus,
    primaryCTA,
    handleDiscoverFundA,
    handleNdaModalClose,
    handleNdaSubmit,
    handleNdaDocModalClose,
    handleNdaAccept,
  };
}
