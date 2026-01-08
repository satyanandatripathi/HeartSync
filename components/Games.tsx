'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Trophy, Users } from 'lucide-react';
import { useWebRTCStore } from '@/store/webrtcStore';

interface GameState {
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  winner: string | null;
  isMyTurn: boolean;
}

export default function Games() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [ticTacToeState, setTicTacToeState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    isMyTurn: true,
  });
  const { dataChannel } = useWebRTCStore();

  useEffect(() => {
    if (!dataChannel) return;

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'game-move') {
          handleGameMove(data.game, data.move, data.state);
        }
      } catch (error) {
        console.error('Error parsing game data:', error);
      }
    };
  }, [dataChannel]);

  const sendGameMove = (game: string, move: any, state: any) => {
    if (dataChannel && dataChannel.readyState === 'open') {
      try {
        dataChannel.send(JSON.stringify({
          type: 'game-move',
          game,
          move,
          state,
        }));
      } catch (error) {
        console.error('Error sending game move:', error);
      }
    }
  };

  const handleGameMove = (game: string, move: any, state: any) => {
    if (game === 'tic-tac-toe') {
      setTicTacToeState(state);
    }
  };

  const handleTicTacToeMove = (index: number) => {
    if (!ticTacToeState.isMyTurn || ticTacToeState.winner || ticTacToeState.board[index]) {
      return;
    }

    const newBoard = [...ticTacToeState.board];
    newBoard[index] = ticTacToeState.currentPlayer;

    const winner = checkWinner(newBoard);
    const newState: GameState = {
      board: newBoard,
      currentPlayer: ticTacToeState.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      isMyTurn: false,
    };

    setTicTacToeState(newState);
    sendGameMove('tic-tac-toe', { index, player: ticTacToeState.currentPlayer }, newState);
  };

  const checkWinner = (board: (string | null)[]): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    if (board.every(cell => cell !== null)) {
      return 'draw';
    }

    return null;
  };

  const resetTicTacToe = () => {
    const newState: GameState = {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      isMyTurn: true,
    };
    setTicTacToeState(newState);
    sendGameMove('tic-tac-toe', { reset: true }, newState);
  };

  const games = [
    {
      id: 'tic-tac-toe',
      name: 'Tic Tac Toe',
      description: 'Classic game of Xs and Os',
      icon: Gamepad2,
      color: 'from-blue-500 to-purple-500',
    },
    {
      id: 'coming-soon',
      name: 'More Games',
      description: 'Coming soon!',
      icon: Trophy,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  if (activeGame === 'tic-tac-toe') {
    return (
      <div className="h-screen flex flex-col bg-slate-900">
        <div className="glass border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gradient">Tic Tac Toe</h2>
              <p className="text-sm text-purple-200">
                {ticTacToeState.winner
                  ? ticTacToeState.winner === 'draw'
                    ? "It's a draw!"
                    : `Winner: ${ticTacToeState.winner}`
                  : ticTacToeState.isMyTurn
                  ? 'Your turn!'
                  : "Partner's turn"}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveGame(null)}
              className="px-4 py-2 glass rounded-lg hover:glass-strong"
            >
              Back
            </motion.button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-8">
            <div className="grid grid-cols-3 gap-2 w-80 h-80">
              {ticTacToeState.board.map((cell, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTicTacToeMove(index)}
                  disabled={!!cell || !ticTacToeState.isMyTurn || !!ticTacToeState.winner}
                  className="glass-strong rounded-xl text-4xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500/20 transition-colors"
                >
                  {cell}
                </motion.button>
              ))}
            </div>

            {ticTacToeState.winner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetTicTacToe}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-semibold"
                >
                  Play Again
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="glass border-b border-white/10 p-4">
        <h2 className="text-2xl font-bold text-gradient">Games</h2>
        <p className="text-sm text-purple-200">Play together and have fun!</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => game.id !== 'coming-soon' && setActiveGame(game.id)}
                className={`glass rounded-2xl p-8 cursor-pointer card-hover ${
                  game.id === 'coming-soon' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">{game.name}</h3>
                <p className="text-purple-200">{game.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

