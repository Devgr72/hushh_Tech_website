import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Spinner,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { 
  Shield, 
  FileText, 
  Camera, 
  Mail, 
  Phone, 
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useVerifyIdentityLogic } from './logic';

function VerifyIdentityPage() {
  const {
    loading,
    startingVerification,
    onboardingData,
    verificationStatus,
    startVerification,
    skipVerification,
    goBack,
  } = useVerifyIdentityLogic();

  if (loading) {
    return (
      <Box
        className="onboarding-shell"
        minH="100dvh"
        h="100dvh"
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        mx="auto"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="#2b8cee" thickness="4px" />
          <Text color="gray.600">Loading...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box className="onboarding-shell" minH="100dvh" h="100dvh" bg="white" display="flex" flexDirection="column" mx="auto">
      <Box as="main" flex="1" minH={0} overflowY="auto" px={{ base: 4, md: 5 }} pt={{ base: 6, md: 8 }} pb={8}>
      <Box maxW="500px" mx="auto">
        {/* Header */}
        <VStack spacing={4} textAlign="center" mb={8}>
          <Box
            w="80px"
            h="80px"
            borderRadius="full"
            bg="linear-gradient(135deg, #2b8cee 0%, #38bdf8 100%)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 10px 40px rgba(43, 140, 238, 0.3)"
          >
            <Icon as={Shield} boxSize={10} color="white" />
          </Box>
          
          <Text
            fontSize={{ base: '28px', md: '36px' }}
            fontWeight="500"
            color="#0B1120"
          >
            Verify Your Identity
          </Text>
          
          <Text fontSize="lg" color="gray.600" maxW="480px">
            Complete a quick verification to secure your account and unlock all features.
          </Text>
        </VStack>

        {/* Status Alert */}
        {verificationStatus.status === 'processing' && (
          <Alert status="info" borderRadius="xl" mb={6}>
            <AlertIcon as={RefreshCw} />
            <Box>
              <AlertTitle>Verification in Progress</AlertTitle>
              <AlertDescription>
                Your verification is being processed. This usually takes a few minutes.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {verificationStatus.status === 'requires_input' && (
          <Alert status="warning" borderRadius="xl" mb={6}>
            <AlertIcon />
            <Box>
              <AlertTitle>Additional Information Required</AlertTitle>
              <AlertDescription>
                Please complete the verification process. Some information may need to be resubmitted.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {verificationStatus.status === 'failed' && (
          <Alert status="error" borderRadius="xl" mb={6}>
            <AlertIcon />
            <Box>
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription>
                Your verification could not be completed. Please try again or contact support.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* What will be verified */}
        <Box
          bg="gray.50"
          borderRadius="2xl"
          p={6}
          mb={8}
          border="1px solid"
          borderColor="gray.200"
        >
          <Text fontWeight="500" color="#0B1120" mb={4}>
            What will be verified:
          </Text>
          
          <VStack spacing={4} align="stretch">
            <HStack spacing={4}>
              <Box
                w="48px"
                h="48px"
                borderRadius="xl"
                bg={verificationStatus.document_verified ? 'green.100' : 'gray.100'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon 
                  as={FileText} 
                  boxSize={6} 
                  color={verificationStatus.document_verified ? 'green.600' : 'gray.500'} 
                />
              </Box>
              <Box flex={1}>
                <HStack>
                  <Text fontWeight="500" color="#0B1120">Government ID</Text>
                  {verificationStatus.document_verified && (
                    <Badge colorScheme="green" borderRadius="full">Verified</Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Passport, Driver's License, or ID Card
                </Text>
              </Box>
            </HStack>

            <HStack spacing={4}>
              <Box
                w="48px"
                h="48px"
                borderRadius="xl"
                bg={verificationStatus.selfie_verified ? 'green.100' : 'gray.100'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon 
                  as={Camera} 
                  boxSize={6} 
                  color={verificationStatus.selfie_verified ? 'green.600' : 'gray.500'} 
                />
              </Box>
              <Box flex={1}>
                <HStack>
                  <Text fontWeight="500" color="#0B1120">Selfie Verification</Text>
                  {verificationStatus.selfie_verified && (
                    <Badge colorScheme="green" borderRadius="full">Verified</Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Live selfie matching your ID photo
                </Text>
              </Box>
            </HStack>

            <HStack spacing={4}>
              <Box
                w="48px"
                h="48px"
                borderRadius="xl"
                bg={verificationStatus.email_verified ? 'green.100' : 'gray.100'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon 
                  as={Mail} 
                  boxSize={6} 
                  color={verificationStatus.email_verified ? 'green.600' : 'gray.500'} 
                />
              </Box>
              <Box flex={1}>
                <HStack>
                  <Text fontWeight="500" color="#0B1120">Email</Text>
                  {verificationStatus.email_verified && (
                    <Badge colorScheme="green" borderRadius="full">Verified</Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  {onboardingData?.email || 'Your email address'}
                </Text>
              </Box>
            </HStack>

            <HStack spacing={4}>
              <Box
                w="48px"
                h="48px"
                borderRadius="xl"
                bg={verificationStatus.phone_verified ? 'green.100' : 'gray.100'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon 
                  as={Phone} 
                  boxSize={6} 
                  color={verificationStatus.phone_verified ? 'green.600' : 'gray.500'} 
                />
              </Box>
              <Box flex={1}>
                <HStack>
                  <Text fontWeight="500" color="#0B1120">Phone Number</Text>
                  {verificationStatus.phone_verified && (
                    <Badge colorScheme="green" borderRadius="full">Verified</Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  {onboardingData?.phone_country_code && onboardingData?.phone_number
                    ? `${onboardingData.phone_country_code} ${onboardingData.phone_number.replace(/(.{3})/g, '$1 ').trim()}`
                    : 'Your phone number'}
                </Text>
              </Box>
            </HStack>
          </VStack>
        </Box>

        {/* Security Note */}
        <Box
          bg="blue.50"
          borderRadius="xl"
          p={4}
          mb={8}
          border="1px solid"
          borderColor="blue.100"
        >
          <HStack spacing={3}>
            <Icon as={Shield} color="blue.500" boxSize={5} />
            <Box>
              <Text fontWeight="500" color="blue.700" fontSize="sm">
                Secure & Private
              </Text>
              <Text fontSize="xs" color="blue.600">
                Your documents are encrypted and processed securely by Stripe Identity. 
                We never store your raw document images.
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Action Buttons */}
        <VStack spacing={3}>
          <Button
            onClick={startVerification}
            isLoading={startingVerification}
            loadingText="Starting..."
            w="full"
            h="56px"
            borderRadius="full"
            bgGradient="linear(to-r, #2b8cee, #38bdf8)"
            color="white"
            fontWeight="600"
            fontSize="lg"
            rightIcon={<Icon as={ArrowRight} />}
            boxShadow="0 10px 25px rgba(43, 140, 238, 0.35)"
            _hover={{
              bgGradient: 'linear(to-r, #2070c0, #2b8cee)',
              boxShadow: '0 12px 30px rgba(43, 140, 238, 0.45)',
            }}
            _active={{
              transform: 'scale(0.98)',
            }}
          >
            {verificationStatus.status === 'requires_input' ? 'Continue Verification' : 'Start Verification'}
          </Button>

          <Button
            onClick={skipVerification}
            variant="ghost"
            w="full"
            h="48px"
            color="gray.500"
            fontWeight="500"
            _hover={{ color: 'gray.700', bg: 'gray.50' }}
          >
            I'll do this later
          </Button>
        </VStack>

        {/* Time estimate */}
        <Text textAlign="center" fontSize="sm" color="gray.500" mt={4}>
          This usually takes 2-3 minutes to complete
        </Text>

        {/* Back button */}
        <Button
          onClick={goBack}
          variant="link"
          color="orange.600"
          fontWeight="500"
          mt={6}
          display="block"
          mx="auto"
        >
          Back
        </Button>
      </Box>
      </Box>
    </Box>
  );
}

export default VerifyIdentityPage;
