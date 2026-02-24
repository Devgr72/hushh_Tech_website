/**
 * FinancialLink — All UI / Presentation
 * Plaid bank linking wrapper, loading state, Chakra UI
 */
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { useFinancialLinkLogic } from './logic';
import KycFinancialLinkScreen from '../../../components/kyc/screens/KycFinancialLinkScreen';

export default function OnboardingFinancialLink() {
  const { userId, userEmail, isReady, handleContinue, handleSkip } = useFinancialLinkLogic();

  /* Loading state — clean white screen */
  if (!isReady || !userId) {
    return (
      <Box minH="100dvh" bg="#FFFFFF" display="flex" alignItems="center" justifyContent="center" px={6}>
        <VStack spacing={3}>
          <Spinner size="lg" color="#2F80ED" thickness="3px" />
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Preparing your secure onboarding...
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <KycFinancialLinkScreen
      userId={userId}
      userEmail={userEmail}
      onContinue={handleContinue}
      onSkip={handleSkip}
      bankName="Hushh"
    />
  );
}
