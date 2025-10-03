import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface WelcomeTourProps {
  run?: boolean;
  onFinish?: () => void;
  steps?: Step[];
}

const defaultSteps: Step[] = [
  {
    target: '[data-tour="dashboard"]',
    content: 'Welcome to eventor.ai! This is your dashboard where you can manage all your events.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="create-event"]',
    content: 'Click here to create your first event. Our AI will help you plan everything!',
  },
  {
    target: '[data-tour="balloons"]',
    content: 'These are your balloons! Use them to access AI features and unlock premium functionality.',
  },
  {
    target: '[data-tour="theme"]',
    content: 'Customize your experience with different themes and colors.',
  },
  {
    target: '[data-tour="profile"]',
    content: 'Access your profile and account settings here.',
  },
];

export function WelcomeTour({ run, onFinish, steps = defaultSteps }: WelcomeTourProps) {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (run !== undefined) {
      setRunTour(run);
    } else {
      // Auto-start tour on first visit
      const hasSeenTour = localStorage.getItem('hasSeenWelcomeTour');
      if (!hasSeenTour) {
        setTimeout(() => setRunTour(true), 1000);
      }
    }
  }, [run]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('hasSeenWelcomeTour', 'true');
      onFinish?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
          arrowColor: 'hsl(var(--card))',
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
        },
      }}
    />
  );
}