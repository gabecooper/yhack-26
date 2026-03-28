import { useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { useGameActions } from '@/context/GameContext';
import { GAME_CONFIG } from '@/constants/gameConfig';

interface JoinViewProps {
  onJoin: (playerId: string) => void;
}

export function JoinView({ onJoin }: JoinViewProps) {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const { joinRoom } = useGameActions();

  const canJoin = roomCode.length === GAME_CONFIG.roomCodeLength && playerName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canJoin) return;
    const id = joinRoom(roomCode.toUpperCase(), playerName.trim());
    onJoin(id);
  };

  return (
    <PhoneLayout>
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h1 className="font-title text-5xl text-vault-gold">HEIST!</h1>
          <p className="font-ui text-gray-400 mt-1">Enter the room code to join</p>
        </motion.div>

        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          onSubmit={handleSubmit}
          className="w-full max-w-xs flex flex-col gap-4"
        >
          <div>
            <label className="font-ui text-sm text-gray-400 uppercase tracking-wider mb-1 block">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase().slice(0, GAME_CONFIG.roomCodeLength))}
              placeholder="ABCD"
              maxLength={GAME_CONFIG.roomCodeLength}
              className="w-full text-center font-title text-4xl tracking-[0.3em] bg-vault-dark border-2 border-vault-steel rounded-xl px-4 py-4 text-vault-gold placeholder:text-vault-steel/50 focus:border-vault-gold focus:outline-none transition-colors"
              autoFocus
              autoComplete="off"
            />
          </div>

          <div>
            <label className="font-ui text-sm text-gray-400 uppercase tracking-wider mb-1 block">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value.slice(0, 16))}
              placeholder="Enter name..."
              maxLength={16}
              className="w-full text-center font-ui text-xl bg-vault-dark border-2 border-vault-steel rounded-xl px-4 py-3 text-white placeholder:text-vault-steel/50 focus:border-vault-gold focus:outline-none transition-colors"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={!canJoin}
            className="vault-button text-xl py-4 mt-2"
          >
            Join Game
          </button>
        </motion.form>
      </div>
    </PhoneLayout>
  );
}
