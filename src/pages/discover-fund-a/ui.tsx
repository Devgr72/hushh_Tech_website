import React from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  SimpleGrid,
  Grid,
  GridItem,
  Table,
  Tbody,
  Tr,
  Td,
  VStack,
  Button,
} from '@chakra-ui/react'
import { useDiscoverFundALogic } from './logic'

const FundA = () => {
  const {
    heroTitle,
    heroSubtitle,
    heroDescription,
    targetIRRLabel,
    targetIRRValue,
    targetIRRPeriod,
    targetIRRDisclaimer,
    philosophySectionTitle,
    philosophyCards,
    edgeSectionTitle,
    sellTheWallHref,
    edgeCards,
    assetFocusSectionTitle,
    assetFocusDescription,
    assetPillars,
    alphaStackSectionTitle,
    alphaStackSubtitle,
    alphaStackRows,
    riskSectionTitle,
    riskCards,
    keyTermsSectionTitle,
    keyTermsSubtitle,
    keyTerms,
    shareClasses,
    joinSectionTitle,
    joinSectionDescription,
    joinButtonLabel,
    handleCompleteProfile,
  } = useDiscoverFundALogic()

  return (
    <Box bg="white">
      {/* Hero Section */}
      <Box pt={{ base: 16, md: 8 }} px={4} textAlign="center">
        <Container maxW="container.lg" mt={{ md: 16, base: 8 }}>
          <Heading
            as="h1"
            fontSize={{ base: '3xl', md: '6xl' }}
            fontWeight="400"
            mb={{ md: 2, base: 1 }}
            lineHeight="1.2"
            color="#1D1D1F"
          >
            {heroTitle}
          </Heading>

          <Heading
            as="h2"
            fontSize={{ base: '4xl', md: '7xl' }}
            fontWeight="500"
            mb={{ md: 10, base: 6 }}
            lineHeight="1.1"
            bgGradient="linear(to-r, #00A9E0, #4BC0C8)"
            bgClip="text"
          >
            {heroSubtitle}
          </Heading>

          <Text
            fontSize={{ base: 'lg', md: '2xl' }}
            color="#6E6E73"
            maxW="4xl"
            mx="auto"
            mb={16}
            fontWeight="light"
            lineHeight="tall"
          >
            {heroDescription}
          </Text>

          {/* Stats Card */}
          <Box
            maxW="md"
            mx="auto"
            bgGradient="linear(to-r, #00A9E0, #4BC0C8)"
            borderRadius="xl"
            p={8}
            color="white"
            mb={16}
          >
            <Text fontSize="xl" fontWeight="500" mb={4}>
              {targetIRRLabel}
            </Text>

            <Heading as="h3" fontSize="7xl" fontWeight="500" mb={2}>
              {targetIRRValue}
            </Heading>

            <Text fontSize="lg" mb={4}>
              {targetIRRPeriod}
            </Text>

            <Text fontSize="xs" fontStyle="italic" maxW="xs" mx="auto">
              {targetIRRDisclaimer}
            </Text>
          </Box>
        </Container>
      </Box>

      {/* Investment Philosophy Section */}
      <Box
        py={{ base: 12, md: 16 }}
        px={0}
        background="rgb(249 250 251 / var(--tw-bg-opacity, 1))"
      >
        <Container maxW="container.lg">
          <Heading
            as="h2"
            fontSize={{ base: '2xl', md: '5xl' }}
            fontWeight="300"
            mb={{ md: 16, base: 10 }}
            lineHeight="1.2"
            textAlign="center"
            color="#1D1D1F"
          >
            {philosophySectionTitle}
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 1 }} spacing={6} maxW="container.lg" mx="auto">
            {philosophyCards.map((card) => (
              <Box
                key={card.title}
                bg="white"
                p={8}
                borderRadius="xl"
                border="1px"
                borderColor="gray.100"
                transition="all 0.3s"
                _hover={{ boxShadow: 'sm' }}
              >
                <Flex alignItems="flex-start" gap={6}>
                  <Box flex="1">
                    <Heading
                      as="h3"
                      fontSize={{ base: 'xl', md: '2xl' }}
                      fontWeight="500"
                      color="#1D1D1F"
                      mb={4}
                    >
                      {card.title}
                    </Heading>
                    <Text
                      color="#6E6E73"
                      fontWeight="light"
                      lineHeight="tall"
                      fontSize={{ base: 'md', md: 'lg' }}
                    >
                      {card.description}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Sell the Wall Options Framework Section */}
      <Box py={{ base: 12, md: 20 }} px={0} bg="white">
        <Container maxW="container.lg">
          <Heading
            as="h2"
            fontSize={{ base: '2xl', md: '5xl' }}
            fontWeight="300"
            mb={{ md: 16, base: 10 }}
            lineHeight="1.2"
            textAlign="center"
            color="#1D1D1F"
          >
            {edgeSectionTitle}{' '}
            <Text
              as="a"
              href={sellTheWallHref}
              target="_blank"
              rel="noopener noreferrer"
              display="inline"
              color="#00A9E0"
              textDecoration="underline"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                color: '#4BC0C8',
                textDecoration: 'none',
              }}
            >
              "Sell the Wall"
            </Text>{' '}
            Options Framework
          </Heading>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={8}>
            {edgeCards.map((card) => (
              <GridItem key={card.title}>
                <Box
                  bg="white"
                  p={8}
                  borderRadius="xl"
                  border="1px"
                  borderColor="gray.100"
                  h="full"
                  transition="all 0.3s"
                  _hover={{ boxShadow: 'sm' }}
                >
                  <Heading
                    as="h3"
                    fontSize={{ base: 'xl', md: '2xl' }}
                    fontWeight="500"
                    color="#1D1D1F"
                    mb={4}
                  >
                    {card.title}
                  </Heading>
                  <Text
                    color="#6E6E73"
                    fontWeight="light"
                    lineHeight="tall"
                    fontSize={{ base: 'md', md: 'lg' }}
                  >
                    {card.description}
                  </Text>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Asset Focus Section */}
      <Box
        py={{ base: 12, md: 20 }}
        px={0}
        bg="rgb(249 250 251 / var(--tw-bg-opacity, 1))"
      >
        <Container maxW="container.xl">
          <Heading
            as="h2"
            fontSize={{ base: '2xl', md: '5xl' }}
            fontWeight="300"
            mb={6}
            lineHeight="1.2"
            textAlign="center"
            color="#1D1D1F"
          >
            {assetFocusSectionTitle}
          </Heading>

          <Text
            fontSize={{ base: 'md', md: 'xl' }}
            color="#6E6E73"
            fontWeight="light"
            lineHeight="tall"
            textAlign="center"
            maxW="4xl"
            mx="auto"
            mb={16}
          >
            {assetFocusDescription}
          </Text>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={8}>
            {assetPillars.map((pillar) => (
              <GridItem key={pillar.title}>
                <Box
                  bg="white"
                  p={8}
                  borderRadius="xl"
                  border="1px"
                  borderColor="gray.100"
                  h="full"
                  transition="all 0.3s"
                  _hover={{ boxShadow: 'sm' }}
                >
                  <Heading
                    as="h3"
                    fontSize={{ base: 'xl', md: '2xl' }}
                    fontWeight="500"
                    color="#1D1D1F"
                    mb={4}
                    textAlign="center"
                  >
                    {pillar.title}
                  </Heading>
                  <Text
                    color="#6E6E73"
                    fontWeight="light"
                    lineHeight="tall"
                    fontSize={{ base: 'md', md: 'lg' }}
                    textAlign="center"
                  >
                    {pillar.description}
                  </Text>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Targeted Alpha Stack Section */}
      <Box py={{ base: 12, md: 20 }} px={0} bg="white">
        <Container maxW="container.xl">
          <Heading
            as="h2"
            fontSize={{ base: '2xl', md: '5xl' }}
            fontWeight="300"
            mb={2}
            lineHeight="1.2"
            textAlign="center"
            color="#1D1D1F"
          >
            {alphaStackSectionTitle}
          </Heading>

          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            color="#6E6E73"
            fontWeight="light"
            fontStyle="italic"
            textAlign="center"
            mb={16}
          >
            {alphaStackSubtitle}
          </Text>

          <Box
            maxW="4xl"
            mx="auto"
            p={{ base: 0, md: 8 }}
            borderRadius="xl"
            border="1px"
            borderColor="gray.100"
          >
            <Table variant="simple">
              <Tbody>
                {alphaStackRows.map((row, index) => (
                  <Tr
                    key={row.label}
                    borderBottom={
                      index < alphaStackRows.length - 1 ? '1px solid' : undefined
                    }
                    borderColor="gray.100"
                  >
                    <Td
                      fontSize={
                        row.isTotalRow
                          ? { base: 'xl', md: '2xl' }
                          : { base: 'md', md: 'lg' }
                      }
                      fontWeight="500"
                      color="#1D1D1F"
                      py={6}
                    >
                      {row.label}
                    </Td>
                    <Td
                      fontSize={
                        row.isTotalRow
                          ? { base: 'xl', md: '2xl' }
                          : { base: 'md', md: 'lg' }
                      }
                      fontWeight="500"
                      color="#00A9E0"
                      textAlign="right"
                      py={6}
                      whiteSpace="nowrap"
                    >
                      {row.value}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Container>
      </Box>

      {/* Risk Management Section */}
      <Box
        py={{ base: 12, md: 20 }}
        px={0}
        bg="rgb(249 250 251 / var(--tw-bg-opacity, 1))"
      >
        <Container maxW="container.xl">
          <Heading
            as="h2"
            fontSize={{ base: '2xl', md: '5xl' }}
            fontWeight="300"
            mb={16}
            lineHeight="1.2"
            textAlign="center"
            color="#1D1D1F"
          >
            {riskSectionTitle}
          </Heading>

          <Grid
            mx="2em"
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            gap={8}
          >
            {riskCards.map((card) => (
              <GridItem key={card.title}>
                <Box
                  bg="white"
                  p={8}
                  borderRadius="xl"
                  border="1px"
                  borderColor="gray.100"
                  h="full"
                  transition="all 0.3s"
                  _hover={{ boxShadow: 'sm' }}
                >
                  <Heading
                    as="h3"
                    fontSize={{ base: 'xl', md: '2xl' }}
                    fontWeight="500"
                    color="#1D1D1F"
                    mb={4}
                  >
                    {card.title}
                  </Heading>
                  <Text
                    color="#6E6E73"
                    fontWeight="light"
                    lineHeight="tall"
                    fontSize={{ base: 'md', md: 'lg' }}
                  >
                    {card.description}
                  </Text>
                </Box>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Key Terms Section */}
      <Box py={{ base: 12, md: 20 }} px={0} bg="white">
        <Container maxW="container.xl">
          <Heading
            as="h2"
            fontSize={{ base: '2xl', md: '5xl' }}
            fontWeight="300"
            mb={2}
            lineHeight="1.2"
            textAlign="center"
            color="#1D1D1F"
          >
            {keyTermsSectionTitle}
          </Heading>

          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            color="#6E6E73"
            fontWeight="light"
            fontStyle="italic"
            textAlign="center"
            mb={16}
          >
            {keyTermsSubtitle}
          </Text>

          <Box
            maxW="4xl"
            mx="auto"
            p={{ base: 4, md: 8 }}
            borderRadius="xl"
            border="1px"
            borderColor="gray.100"
          >
            <VStack spacing={8} align="stretch">
              {keyTerms.slice(0, 2).map((term) => (
                <Box key={term.title}>
                  <Heading
                    as="h3"
                    fontSize={{ base: 'lg', md: 'xl' }}
                    fontWeight="500"
                    color="#1D1D1F"
                    mb={2}
                  >
                    {term.title}
                  </Heading>
                  <Text
                    color="#6E6E73"
                    fontWeight="light"
                    fontSize={{ base: 'md', md: 'lg' }}
                  >
                    {term.content}
                  </Text>
                </Box>
              ))}

              {/* Share Classes Table */}
              <Box>
                <Heading
                  as="h3"
                  fontSize={{ base: 'lg', md: 'xl' }}
                  fontWeight="500"
                  color="#1D1D1F"
                  mb={4}
                >
                  Share Classes (Min. Investment / Fees - Mgmt/Perf./Hurdle)
                </Heading>

                <Box
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  overflow="hidden"
                  bg="#111"
                >
                  <Table variant="unstyled" size="md">
                    <thead>
                      <Tr borderBottomWidth="1px" borderColor="gray.700">
                        <Td fontWeight="500" color="white" py={4}>
                          Share Class
                        </Td>
                        <Td fontWeight="500" color="white" py={4}>
                          Min. Investment
                        </Td>
                        <Td fontWeight="500" color="white" py={4}>
                          Management Fee
                        </Td>
                        <Td fontWeight="500" color="white" py={4}>
                          Performance Fee
                        </Td>
                        <Td fontWeight="500" color="white" py={4}>
                          Hurdle Rate
                        </Td>
                      </Tr>
                    </thead>
                    <Tbody>
                      {shareClasses.map((sc, index) => (
                        <Tr
                          key={sc.shareClass}
                          borderBottomWidth={
                            index < shareClasses.length - 1 ? '1px' : undefined
                          }
                          borderColor="gray.700"
                        >
                          <Td color="white" py={4}>
                            {sc.shareClass}
                          </Td>
                          <Td color="white" py={4}>
                            {sc.minInvestment}
                          </Td>
                          <Td color="white" py={4}>
                            {sc.managementFee}
                          </Td>
                          <Td color="white" py={4}>
                            {sc.performanceFee}
                          </Td>
                          <Td color="white" py={4}>
                            {sc.hurdleRate}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>

              {keyTerms.slice(2).map((term) => (
                <Box key={term.title}>
                  <Heading
                    as="h3"
                    fontSize={{ base: 'lg', md: 'xl' }}
                    fontWeight="500"
                    color="#1D1D1F"
                    mb={2}
                  >
                    {term.title}
                  </Heading>
                  <Text
                    color="#6E6E73"
                    fontWeight="light"
                    fontSize={{ base: 'md', md: 'lg' }}
                  >
                    {term.content}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
        </Container>
      </Box>

      {/* Join Us Section */}
      <Box py={{ base: 16, md: 24 }} px={0} bg="gray.50">
        <Container maxW="container.xl">
          <Heading
            as="h2"
            fontSize={{ base: '3xl', md: '5xl' }}
            fontWeight="400"
            mb={6}
            lineHeight="1.2"
            textAlign="center"
            color="#1D1D1F"
          >
            {joinSectionTitle}
          </Heading>

          <Text
            fontSize={{ base: 'lg', md: '2xl' }}
            color="#6E6E73"
            fontWeight="light"
            lineHeight="tall"
            textAlign="center"
            maxW="4xl"
            mx="auto"
            mb={12}
            whiteSpace="pre-line"
          >
            {joinSectionDescription}
          </Text>

          <Flex justify="center" mb={8}>
            <Button
              size="lg"
              px={12}
              py={7}
              borderRadius="full"
              background="linear-gradient(to right, #00A9E0, #4BC0C8)"
              color="white"
              _hover={{
                background: 'linear-gradient(to right, #00A9E0, #4BC0C8)',
              }}
              fontWeight="500"
              onClick={handleCompleteProfile}
            >
              {joinButtonLabel}
            </Button>
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}

export default FundA
