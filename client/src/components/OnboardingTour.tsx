import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useOnboardingTour } from '@/contexts/OnboardingTourContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { X, Play, RotateCcw } from 'lucide-react';

interface TourStep {
  target: string;
  content: string;
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  disableBeacon?: boolean;
}

const OnboardingTour: React.FC = () => {
  const { user } = useAuth();
  const {
    isOnboardingActive,
    stopOnboarding,
    markTourCompleted,
    skipTour,
    currentTourStep,
    setCurrentTourStep,
  } = useOnboardingTour();

  const [run, setRun] = useState(false);

  useEffect(() => {
    setRun(isOnboardingActive);
  }, [isOnboardingActive]);

  // Define tour steps based on user role
  const getTourSteps = (): TourStep[] => {
    const commonSteps: TourStep[] = [
      {
        target: 'body',
        content: `Welcome to ProficiencyAI! ${user?.firstName || 'User'}, let me show you around the platform and help you get started.`,
        title: 'Welcome to ProficiencyAI',
        placement: 'center',
        disableBeacon: true,
      },
      {
        target: '.sidebar',
        content: 'This is your navigation sidebar. All the main features are organized here for easy access.',
        title: 'Navigation Sidebar',
        placement: 'right',
      },
      {
        target: '[data-tour="dashboard"]',
        content: 'Your dashboard shows an overview of your activity, statistics, and recent items.',
        title: 'Dashboard Overview',
        placement: 'bottom',
      },
      {
        target: '[data-tour="notifications"]',
        content: 'Check your notifications here for important updates and alerts.',
        title: 'Notifications',
        placement: 'bottom',
      },
    ];

    // Add role-specific steps
    if (user?.role === 'super_admin') {
      return [
        ...commonSteps,
        {
          target: '[data-tour="item-banks"]',
          content: 'Item Banks are where you organize and manage your question collections.',
          title: 'Item Banks',
          placement: 'right',
        },
        {
          target: '[data-tour="quiz-manager"]',
          content: 'Create and manage quizzes here. You can build comprehensive assessments.',
          title: 'Quiz Manager',
          placement: 'right',
        },
        {
          target: '[data-tour="analytics"]',
          content: 'View detailed analytics and performance insights for your assessments.',
          title: 'Analytics Dashboard',
          placement: 'right',
        },
        {
          target: '[data-tour="user-management"]',
          content: 'As a super admin, you can manage users, accounts, and system settings.',
          title: 'User Management',
          placement: 'right',
        },
        {
          target: '[data-tour="settings"]',
          content: 'Access advanced settings, prompt management, and accessibility options.',
          title: 'Settings & Configuration',
          placement: 'right',
        },
      ];
    } else if (user?.role === 'admin') {
      return [
        ...commonSteps,
        {
          target: '[data-tour="item-banks"]',
          content: 'Item Banks are where you organize and manage your question collections.',
          title: 'Item Banks',
          placement: 'right',
        },
        {
          target: '[data-tour="quiz-manager"]',
          content: 'Create and manage quizzes here. You can build comprehensive assessments.',
          title: 'Quiz Manager',
          placement: 'right',
        },
        {
          target: '[data-tour="analytics"]',
          content: 'View detailed analytics and performance insights for your assessments.',
          title: 'Analytics Dashboard',
          placement: 'right',
        },
        {
          target: '[data-tour="user-management"]',
          content: 'Manage users within your account and assign roles.',
          title: 'User Management',
          placement: 'right',
        },
      ];
    } else if (user?.role === 'teacher') {
      return [
        ...commonSteps,
        {
          target: '[data-tour="item-banks"]',
          content: 'Item Banks are where you organize and manage your question collections.',
          title: 'Item Banks',
          placement: 'right',
        },
        {
          target: '[data-tour="quiz-manager"]',
          content: 'Create and manage quizzes here. You can build comprehensive assessments.',
          title: 'Quiz Manager',
          placement: 'right',
        },
        {
          target: '[data-tour="live-exams"]',
          content: 'Monitor live exams and proctoring sessions in real-time.',
          title: 'Live Exam Monitoring',
          placement: 'right',
        },
        {
          target: '[data-tour="analytics"]',
          content: 'View detailed analytics and performance insights for your assessments.',
          title: 'Analytics Dashboard',
          placement: 'right',
        },
      ];
    } else {
      // Student role
      return [
        ...commonSteps,
        {
          target: '[data-tour="study-aids"]',
          content: 'Access study materials and AI-generated learning aids to help you prepare.',
          title: 'Study Aids',
          placement: 'right',
        },
        {
          target: '[data-tour="analytics"]',
          content: 'Track your progress and performance with detailed analytics.',
          title: 'Your Analytics',
          placement: 'right',
        },
      ];
    }
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, action, index } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      if (status === STATUS.FINISHED) {
        markTourCompleted();
      } else if (status === STATUS.SKIPPED) {
        skipTour();
      }
      setRun(false);
    } else if (type === EVENTS.STEP_AFTER) {
      setCurrentTourStep(index + 1);
    }
  };

  const tourSteps = getTourSteps();

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      stepIndex={currentTourStep}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2563eb',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 14,
          padding: 20,
          maxWidth: 400,
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 10,
        },
        tooltipContent: {
          lineHeight: 1.5,
        },
        buttonNext: {
          backgroundColor: '#2563eb',
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 10,
          padding: '8px 16px',
          fontSize: 14,
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: 14,
        },
        buttonClose: {
          height: 24,
          width: 24,
          padding: 0,
          right: 16,
          top: 16,
        },
        spotlight: {
          borderRadius: 8,
        },
        beacon: {
          borderRadius: '50%',
          height: 36,
          width: 36,
        },
        beaconInner: {
          backgroundColor: '#2563eb',
        },
        beaconOuter: {
          backgroundColor: '#2563eb',
          borderColor: '#2563eb',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default OnboardingTour;