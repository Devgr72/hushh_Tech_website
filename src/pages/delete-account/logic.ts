import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@chakra-ui/react';
import config from '../../resources/config/config';

export function useDeleteAccountLogic() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');

  // Check if user is logged in
  useEffect(() => {
    const checkSession = async () => {
      if (!config.supabaseClient) {
        setIsLoading(false);
        setIsLoggedIn(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await config.supabaseClient.auth.getSession();
        setIsLoggedIn(!!session);
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = config.supabaseClient?.auth.onAuthStateChange(
      (event: any, session: any) => {
        setIsLoggedIn(!!session);
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      }
    ) || { data: { subscription: null } };

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Handle successful account deletion
  const handleAccountDeleted = () => {
    onClose();
    // Redirect to home page after deletion
    navigate('/');
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    // Store the return URL
    sessionStorage.setItem('returnUrl', '/delete-account');
    navigate('/login');
  };

  return {
    isOpen,
    onOpen,
    onClose,
    isLoggedIn,
    isLoading,
    userEmail,
    handleAccountDeleted,
    handleLoginRedirect,
  };
}
