import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FiX, FiCircle } from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface TicTacToeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
}

type Player = 'X' | 'O' | null;
type Board = Player[];

export function TicTacToeModal({ open, onClose, title = 'Loading...' }: TicTacToeModalProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [neverPlayAgain, setNeverPlayAgain] = useState(
    localStorage.getItem('ticTacToe_neverPlayAgain') === 'true'
  );

  const checkWinner = (currentBoard: Board): Player | 'draw' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6], // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }

    if (currentBoard.every(cell => cell !== null)) {
      return 'draw';
    }

    return null;
  };

  const getAIMove = (currentBoard: Board): number => {
    const emptyIndices = currentBoard
      .map((cell, index) => cell === null ? index : -1)
      .filter(index => index !== -1);

    // Simple AI: Try to win, block player, or pick random
    for (const index of emptyIndices) {
      const testBoard = [...currentBoard];
      testBoard[index] = 'O';
      if (checkWinner(testBoard) === 'O') return index;
    }

    for (const index of emptyIndices) {
      const testBoard = [...currentBoard];
      testBoard[index] = 'X';
      if (checkWinner(testBoard) === 'X') return index;
    }

    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner && open) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(board);
        if (aiMove !== undefined) {
          const newBoard = [...board];
          newBoard[aiMove] = 'O';
          setBoard(newBoard);
          const result = checkWinner(newBoard);
          if (result) {
            setWinner(result);
          } else {
            setIsPlayerTurn(true);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, board, winner, open]);

  const handleCellClick = (index: number) => {
    if (board[index] || !isPlayerTurn || winner) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result);
    } else {
      setIsPlayerTurn(false);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
  };

  const handleNeverPlayAgain = () => {
    localStorage.setItem('ticTacToe_neverPlayAgain', 'true');
    setNeverPlayAgain(true);
    onClose();
  };

  // Check if should show modal
  if (neverPlayAgain) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 mx-auto w-64 h-64">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={!!cell || !isPlayerTurn || !!winner}
                className={cn(
                  "w-full h-full border-2 border-border rounded-lg flex items-center justify-center text-4xl font-bold transition-all",
                  "hover:bg-muted disabled:cursor-not-allowed",
                  cell === 'X' && "text-primary",
                  cell === 'O' && "text-destructive"
                )}
              >
                {cell === 'X' && <FiX className="h-12 w-12" />}
                {cell === 'O' && <FiCircle className="h-12 w-12" />}
              </button>
            ))}
          </div>

          <div className="text-center space-y-2">
            {winner ? (
              <>
                <p className="text-lg font-semibold">
                  {winner === 'X' && '🎉 You Won!'}
                  {winner === 'O' && '🤖 AI Won!'}
                  {winner === 'draw' && "🤝 It's a Draw!"}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={resetGame} variant="outline">
                    Play Again
                  </Button>
                  <Button onClick={handleNeverPlayAgain} variant="secondary">
                    Never Play Again
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                {isPlayerTurn ? 'Your turn (X)' : 'AI is thinking (O)...'}
              </p>
            )}
          </div>
          
          <div className="text-center pt-4 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNeverPlayAgain}
              className="text-xs text-muted-foreground"
            >
              Don't show this again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
