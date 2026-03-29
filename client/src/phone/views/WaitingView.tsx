import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import type { PlayerState } from '@/types/player';

interface WaitingViewProps {
  player: PlayerState;
  onLeave: () => void;
}

export function WaitingView({ player, onLeave }: WaitingViewProps) {
  return (
    <PhoneLayout contentClassName="justify-center">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="soft-glass-panel flex flex-col items-center gap-4 rounded-[2rem] px-6 py-7 text-center"
        >
          <p className="font-ui text-xs uppercase tracking-[0.32em] text-white/55">
            Ready
          </p>
          <CharacterAvatar characterIndex={player.characterIndex} size={88} />
          <h2 className="font-title text-4xl text-white">{player.name}</h2>
          <p className="max-w-[16rem] font-ui text-sm text-white/55">
            Sit tight while the host finishes setting up the next round.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-[1.75rem] border border-white/10 bg-black/15 px-6 py-6 text-center shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm"
        >
          <p className="font-ui text-lg uppercase tracking-[0.18em] text-white/80">
            Waiting for the host to start the heist...
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-vault-gold"
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
          className="w-full"
        >
          <button
            onClick={onLeave}
            className="minimal-button-secondary w-full py-3 text-sm tracking-[0.24em] text-white/80"
          >
            Leave Room
          </button>
        </motion.div>
      </div>
    </PhoneLayout>
  );
}
