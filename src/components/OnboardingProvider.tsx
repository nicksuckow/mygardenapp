"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import OnboardingModal from "./OnboardingModal";

const ONBOARDING_KEY = "garden-planner-onboarding-complete";

export default function OnboardingProvider() {
  const { data: session } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only show onboarding for logged-in users who haven't completed it
    if (session?.user) {
      const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
      if (!hasCompletedOnboarding) {
        // Small delay to let the page render first
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [session]);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  // Don't render anything on server or if not showing
  if (!mounted || !showOnboarding) {
    return null;
  }

  return <OnboardingModal onComplete={handleComplete} onDismiss={handleDismiss} />;
}
