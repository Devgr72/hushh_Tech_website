/**
 * Deprecated bridge retained only to fail closed.
 *
 * Browser-direct OpenAI calls were removed to keep vendor credentials
 * server-side. Use apiClient.ts for investor profile generation.
 */

import type {
  DerivedContext,
  InvestorProfile,
  InvestorProfileInput,
} from "../../types/investorProfile";

export async function generateInvestorProfile(
  _input: InvestorProfileInput,
  _context: DerivedContext
): Promise<InvestorProfile> {
  throw new Error(
    "Direct browser OpenAI calls were removed. Use the secure investor profile API client instead."
  );
}
