import { useState, useEffect, useCallback } from 'react';
import '../styles/Tetris.css';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const TETROMINOS = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#00f0f0'
  },
  J: {
    shape: [[1, 0, 0], [1, 1, 1]],
    color: '#0000f0'
  },
  L: {
    shape: [[0, 0, 1], [1, 1, 1]],
    color: '#f0a000'
  },
  O: {
    shape: [[1, 1], [1, 1]],
    color: '#f0f000'
  },
  S: {
    shape: [[0, 1, 1], [1, 1, 0]],
    color: '#00f000'
  },
  T: {
    shape: [[0, 1, 0], [1, 1, 1]],
    color: '#a000f0'
  },
  Z: {
    shape: [[1, 1, 0], [0, 1, 1]],
    color: '#f00000'
  }
};

const createBoard = () => 
  Array.from(Array(BOARD_HEIGHT), () => Array(BOARD_WIDTH).fill(0));

const Tetris = () => {
  const [board, setBoard] = useState(createBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const getRandomTetromino = () => {
    const tetrominos = Object.keys(TETROMINOS);
    const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
    return TETROMINOS[randTetromino];
  };

  const isColliding = useCallback((piece, pos) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          
          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  const mergePieceToBoard = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = board.map(row => [...row]);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const newY = position.y + y;
          if (newY >= 0) {
            newBoard[newY][position.x + x] = currentPiece.color;
          }
        }
      });
    });

    setBoard(newBoard);
    setCurrentPiece(null);
    
    // Check for completed rows
    const completedRows = newBoard.reduce((acc, row, i) => {
      if (row.every(cell => cell !== 0)) acc.push(i);
      return acc;
    }, []);

    if (completedRows.length) {
      const newScore = score + (completedRows.length * 100);
      setScore(newScore);
      
      const filteredBoard = newBoard.filter((_, i) => !completedRows.includes(i));
      const newRows = Array.from(Array(completedRows.length), () => Array(BOARD_WIDTH).fill(0));
      setBoard([...newRows, ...filteredBoard]);
    }
  }, [board, currentPiece, position, score]);

  const moveDown = useCallback(() => {
    if (!currentPiece) return;
    
    const newPos = { ...position, y: position.y + 1 };
    if (isColliding(currentPiece, newPos)) {
      if (position.y < 1) {
        setGameOver(true);
        return;
      }
      mergePieceToBoard();
    } else {
      setPosition(newPos);
    }
  }, [currentPiece, position, isColliding, mergePieceToBoard]);

  const moveHorizontally = useCallback((dir) => {
    if (!currentPiece) return;
    
    const newPos = { ...position, x: position.x + dir };
    if (!isColliding(currentPiece, newPos)) {
      setPosition(newPos);
    }
  }, [currentPiece, position, isColliding]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece) return;

    const rotatedShape = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );
    
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    if (!isColliding(rotatedPiece, position)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, position, isColliding]);

  useEffect(() => {
    if (gameOver) return;

    if (!currentPiece) {
      const newPiece = getRandomTetromino();
      setCurrentPiece(newPiece);
      setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    }

    const interval = setInterval(moveDown, 1000);
    return () => clearInterval(interval);
  }, [currentPiece, gameOver, moveDown]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          moveHorizontally(-1);
          break;
        case 'ArrowRight':
          moveHorizontally(1);
          break;
        case 'ArrowDown':
          moveDown();
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [moveHorizontally, moveDown, rotatePiece, gameOver]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    if (currentPiece) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value && position.y + y >= 0) {
            displayBoard[position.y + y][position.x + x] = currentPiece.color;
          }
        });
      });
    }

    return displayBoard.map((row, y) => (
      row.map((cell, x) => (
        <div
          key={`${y}-${x}`}
          className="cell"
          style={{ backgroundColor: cell || '#333' }}
        />
      ))
    ));
  };

  const resetGame = () => {
    setBoard(createBoard());
    setCurrentPiece(null);
    setPosition({ x: 0, y: 0 });
    setGameOver(false);
    setScore(0);
  };

  return (
    <div className="tetris-container">
      <div className="game-area">
        <div className="board">
          {renderBoard()}
        </div>
        <div className="game-info">
          <p>Score: {score}</p>
          {gameOver && (
            <div>
              <p>Game Over!</p>
              <button onClick={resetGame}>New Game</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tetris;