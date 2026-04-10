import { PreferenceSeedInput, UserPreferenceProfile } from "../../types/preferences";

interface EnrichPreferencesResponse {
  preferences: UserPreferenceProfile;
}

export default async function enrichPreferences(
  seed: PreferenceSeedInput
): Promise<UserPreferenceProfile> {
  const response = await fetch("/api/enrich-preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(seed),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to enrich preferences (${response.status}): ${errorText || "Unknown error"}`
    );
  }

  const data = (await response.json()) as EnrichPreferencesResponse;
  if (!data?.preferences) {
    throw new Error("Invalid response from enrichment service");
  }

  return data.preferences;
}
