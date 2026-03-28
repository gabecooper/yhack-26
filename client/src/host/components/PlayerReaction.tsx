import { motion } from 'framer-motion';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import type { PlayerState } from '@/types/player';

interface PlayerReactionProps {
  player: PlayerState;
  isCorrect: boolean;
}

export function PlayerReaction({ player, isCorrect }: PlayerReactionProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex flex-col items-center gap-2"
    >
      <motion.div
        animate={isCorrect
          ? { y: [0, -8, 0], rotate: [0, 5, -5, 0] }
          : { x: [0, -4, 4, -4, 4, 0] }
        }
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <CharacterAvatar characterIndex={player.characterIndex} size={56} />
      </motion.div>
      <span className="font-ui text-sm text-white">{player.name}</span>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className={`font-title text-lg ${isCorrect ? 'text-vault-green' : 'text-vault-red'}`}
      >
        {isCorrect ? '+$100' : 'WRONG'}
      </motion.span>
    </motion.div>
  );
}
