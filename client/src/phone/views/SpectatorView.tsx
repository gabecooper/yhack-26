import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import type { PlayerState } from '@/types/player';

interface SpectatorViewProps {
  player: PlayerState;
}

export function SpectatorView({ player }: SpectatorViewProps) {
  return (
    <PhoneLayout contentClassName="justify-center">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-5 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="soft-glass-panel flex w-full flex-col items-center gap-4 rounded-[2rem] px-6 py-7"
        >
          <CharacterAvatar
            characterIndex={player.characterIndex}
            size={84}
            isEliminated={player.isEliminated}
          />
          <h2 className="font-title text-4xl text-gray-100">{player.name}</h2>
        </motion.div>

        {player.isEliminated ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-[1.75rem] border border-white/10 bg-black/15 px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm"
          >
            <p className="font-title text-3xl text-vault-red">Eliminated!</p>
            <p className="mt-3 font-ui text-white/68">
              You didn't make it this time. Watch the remaining crew try to crack the vault.
            </p>
            <p className="mt-4 font-ui text-sm text-white/50">
              Final Score: <span className="text-vault-gold">${player.score}</span>
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-[1.75rem] border border-white/10 bg-black/15 px-6 py-6 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm"
          >
            <p className="font-title text-2xl text-white">Watching...</p>
            <p className="mt-3 font-ui text-white/68">
              The game is in progress. Keep your eyes on the big screen!
            </p>
          </motion.div>
        )}
      </div>
    </PhoneLayout>
  );
}
