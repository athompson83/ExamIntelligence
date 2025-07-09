import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingTourContextType {
  isOnboardingActive: boolean;
  startOnboarding: () => void;
  stopOnboarding: () => void;
  isFirstVisit: boolean;
  markTourCompleted: () => void;
  currentTourStep: number;
  setCurrentTourStep: (step: number) => void;
  skipTour: () => void;
  restartTour: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextType | undefined>(undefined);

export const useOnboardingTour = () => {
  const context = useContext(OnboardingTourContext);
  if (!context) {
    throw new Error('useOnboardingTour must be used within an OnboardingTourProvider');
  }
  return context;
};

interface OnboardingTourProviderProps {
  children: React.ReactNode;
}

export const OnboardingTourProvider: React.FC<OnboardingTourProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Storage keys for tour state
  const TOUR_COMPLETED_KEY = 'onboarding_tour_completed';
  const TOUR_SKIPPED_KEY = 'onboarding_tour_skipped';

  useEffect(() => {
    if (isAuthenticated && user) {
      const userSpecificKey = `${TOUR_COMPLETED_KEY}_${user.id}`;
      const userSpecificSkipKey = `${TOUR_SKIPPED_KEY}_${user.id}`;
      const userFirstLoginKey = `onboarding_first_login_${user.id}`;
      
      const tourCompleted = localStorage.getItem(userSpecificKey);
      const tourSkipped = localStorage.getItem(userSpecificSkipKey);
      const hasLoggedInBefore = localStorage.getItem(userFirstLoginKey);
      
      // Only show tour if this is truly the first time the user has logged in
      if (!tourCompleted && !tourSkipped && !hasLoggedInBefore) {
        setIsFirstVisit(true);
        // Mark that user has logged in before
        localStorage.setItem(userFirstLoginKey, 'true');
        // Auto-start tour for first-time users after a brief delay
        setTimeout(() => {
          setIsOnboardingActive(true);
        }, 1000);
      } else if (!hasLoggedInBefore) {
        // If user has completed/skipped tour but this is still marked as first login,
        // mark as not first login to prevent future auto-starts
        localStorage.setItem(userFirstLoginKey, 'true');
      }
    }
  }, [isAuthenticated, user]);

  const startOnboarding = () => {
    setIsOnboardingActive(true);
    setCurrentTourStep(0);
  };

  const stopOnboarding = () => {
    setIsOnboardingActive(false);
    setCurrentTourStep(0);
  };

  const markTourCompleted = () => {
    if (user) {
      const userSpecificKey = `${TOUR_COMPLETED_KEY}_${user.id}`;
      localStorage.setItem(userSpecificKey, 'true');
      setIsFirstVisit(false);
      stopOnboarding();
    }
  };

  const skipTour = () => {
    if (user) {
      const userSpecificKey = `${TOUR_SKIPPED_KEY}_${user.id}`;
      localStorage.setItem(userSpecificKey, 'true');
      setIsFirstVisit(false);
      stopOnboarding();
    }
  };

  const restartTour = () => {
    if (user) {
      const userSpecificKey = `${TOUR_COMPLETED_KEY}_${user.id}`;
      const userSpecificSkipKey = `${TOUR_SKIPPED_KEY}_${user.id}`;
      const userFirstLoginKey = `onboarding_first_login_${user.id}`;
      
      // Clear all tour-related storage for manual restart
      localStorage.removeItem(userSpecificKey);
      localStorage.removeItem(userSpecificSkipKey);
      // Note: We don't remove userFirstLoginKey to prevent auto-start on future logins
      
      setIsFirstVisit(true);
      startOnboarding();
    }
  };

  const value: OnboardingTourContextType = {
    isOnboardingActive,
    startOnboarding,
    stopOnboarding,
    isFirstVisit,
    markTourCompleted,
    currentTourStep,
    setCurrentTourStep,
    skipTour,
    restartTour,
  };

  return (
    <OnboardingTourContext.Provider value={value}>
      {children}
    </OnboardingTourContext.Provider>
  );
};