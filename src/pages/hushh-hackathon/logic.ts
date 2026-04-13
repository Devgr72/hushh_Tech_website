/**
 * Hushh Hackathon Page — Logic hook
 * Handles navigation, section refs, and scroll-to-section behaviour.
 */
import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

/** Section IDs used for smooth scroll navigation */
export const SECTION_IDS = {
  hero: "hackathon-hero",
  window: "hackathon-window",
  tracks: "hackathon-tracks",
  steps: "hackathon-steps",
  lookFor: "hackathon-look-for",
  rules: "hackathon-rules",
  evaluation: "hackathon-evaluation",
  prizes: "hackathon-prizes",
  hiring: "hackathon-hiring",
  eligibility: "hackathon-eligibility",
  contact: "hackathon-contact",
} as const;

export const useHackathonLogic = () => {
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);

  /** Navigate back to home */
  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  /** Smooth-scroll to a section by ID */
  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  /** Open external link in new tab */
  const openExternal = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return {
    mainRef,
    handleBack,
    scrollToSection,
    openExternal,
  };
};
