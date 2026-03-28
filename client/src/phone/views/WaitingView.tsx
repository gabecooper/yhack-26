import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import { HEIST_CHARACTERS } from '@/constants/characters';
import type { PlayerState } from '@/types/player';

interface WaitingViewProps {
  player: PlayerState;
  onLeave: () => void;
}

export function WaitingView({ player, onLeave }: WaitingViewProps) {
  const character = HEIST_CHARACTERS[player.characterIndex];

  return (
    <PhoneLayout>
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <CharacterAvatar characterIndex={player.characterIndex} size={80} showRole />
          <h2 className="font-title text-3xl text-white">{player.name}</h2>
          <p className="font-ui text-gray-400">
            You are the <span className="text-vault-gold">{character?.role}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="vault-panel p-6 rounded-xl w-full max-w-xs text-center"
        >
          <p className="font-handwritten text-xl text-gray-300">
            Waiting for the host to start the heist...
          </p>
          <div className="mt-4 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-vault-gold"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-xs"
        >
          <button className="vault-button-secondary w-full text-sm py-3 mb-3">
            Upload PDF
          </button>
          <button
            onClick={onLeave}
            className="w-full text-center font-ui text-sm text-gray-500 hover:text-vault-red transition-colors"
          >
            Leave Room
          </button>
        </motion.div>
      </div>
    </PhoneLayout>
  );
}
