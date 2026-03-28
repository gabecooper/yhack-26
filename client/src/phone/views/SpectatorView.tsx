import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import type { PlayerState } from '@/types/player';

interface SpectatorViewProps {
  player: PlayerState;
}

export function SpectatorView({ player }: SpectatorViewProps) {
  return (
    <PhoneLayout>
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <CharacterAvatar
            characterIndex={player.characterIndex}
            size={72}
            isEliminated={player.isEliminated}
          />
          <h2 className="font-title text-3xl text-gray-400">{player.name}</h2>
        </motion.div>

        {player.isEliminated ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="vault-panel p-6 rounded-xl text-center max-w-xs"
          >
            <p className="font-title text-2xl text-vault-red mb-2">Eliminated!</p>
            <p className="font-ui text-gray-400">
              You didn't make it this time. Watch the remaining crew try to crack the vault.
            </p>
            <p className="font-ui text-sm text-gray-500 mt-4">
              Final Score: <span className="text-vault-gold">${player.score}</span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="vault-panel p-6 rounded-xl text-center max-w-xs"
          >
            <p className="font-title text-xl text-white mb-2">Watching...</p>
            <p className="font-ui text-gray-400">
              The game is in progress. Keep your eyes on the big screen!
            </p>
          </motion.div>
        )}
      </div>
    </PhoneLayout>
  );
}
