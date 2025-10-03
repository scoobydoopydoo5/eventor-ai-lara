import { useReward } from 'react-rewards';
import { Button, ButtonProps } from './ui/button';
import { useEffect, useRef } from 'react';

interface ConfettiButtonProps extends ButtonProps {
  rewardType?: 'confetti' | 'balloons' | 'emoji';
  emoji?: string[];
}

export const ConfettiButton = ({ 
  children, 
  onClick, 
  rewardType = 'confetti',
  emoji = ['🎉', '🎊', '🎈'],
  ...props 
}: ConfettiButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { reward } = useReward(buttonRef.current?.id || 'reward-button', rewardType, {
    emoji,
    spread: 90,
    elementCount: 100,
    startVelocity: 45,
    decay: 0.95,
    lifetime: 200,
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    reward();
    onClick?.(e);
  };

  return (
    <Button
      ref={buttonRef}
      id={`reward-button-${Math.random()}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};