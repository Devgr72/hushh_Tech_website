import axios from "axios";

// API configuration
// NOTE: Configure via env to avoid committing keys.
const API_KEY = import.meta.env.VITE_REGISTRATION_SUPABASE_ANON_KEY || "";
const API_BASE_URL = import.meta.env.VITE_REGISTRATION_SUPABASE_URL || "";

const API_HEADERS = {
  apikey: API_KEY,
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

export interface RegistrationStatus {
  isRegistered: boolean;
  hasHushhId: boolean;
  userData?: any;
}

/**
 * Check if a user has completed their profile registration
 * @param email - User's email to check registration status
 * @returns RegistrationStatus object indicating registration state
 */
export default async function checkRegistrationStatus(email: string): Promise<RegistrationStatus> {
  try {
    if (!API_KEY || !API_BASE_URL) {
      // If not configured, fail closed (treat as not registered).
      return {
        isRegistered: false,
        hasHushhId: false,
        userData: null,
      };
    }
    // Search for user by email using the search API
    const response = await axios.get(
      `${API_BASE_URL}/users?or=(email.ilike.*${email}*)`,
      { headers: API_HEADERS }
    );
    
    if (response.data && response.data.length > 0) {
      const userData = response.data[0];
      
      // User exists in database
      // Check if user has hushh_id (indicating complete registration)
      const hasHushhId = !!(userData.hushh_id && userData.hushh_id.trim() !== '');
      
      return {
        isRegistered: hasHushhId,
        hasHushhId: hasHushhId,
        userData: userData
      };
    } else {
      // User doesn't exist in database at all
      return {
        isRegistered: false,
        hasHushhId: false,
        userData: null
      };
    }
  } catch (error) {
    console.error("Error checking registration status:", error);
    // In case of API error, assume user needs to register to be safe
    return {
      isRegistered: false,
      hasHushhId: false,
      userData: null
    };
  }
} 
