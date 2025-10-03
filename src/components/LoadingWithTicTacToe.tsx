import { TicTacToeModal } from './TicTacToeModal';

interface LoadingWithTicTacToeProps {
  isLoading: boolean;
  title?: string;
}

export function LoadingWithTicTacToe({ isLoading, title = 'Loading...' }: LoadingWithTicTacToeProps) {
  const shouldPlayTicTacToe = localStorage.getItem('play_tictactoe_loading') === 'true';
  
  if (!isLoading || !shouldPlayTicTacToe) return null;
  
  return (
    <TicTacToeModal
      open={isLoading}
      onClose={() => {}}
      title={title}
    />
  );
}
