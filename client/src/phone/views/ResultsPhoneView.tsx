import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { useGameState } from '@/context/GameContext';
import { ANSWER_COLORS } from '@/constants/gameConfig';

interface ResultsPhoneViewProps {
  playerId: string;
}

export function ResultsPhoneView({ playerId }: ResultsPhoneViewProps) {
  const { results, currentQuestion, players } = useGameState();
  const player = players.find(p => p.id === playerId);

  if (!results || !currentQuestion) return null;

  const playerAnswer = results.playerAnswers[playerId];
  const isCorrect = playerAnswer === results.correctIndex;
  const correctChoice = currentQuestion.choices[results.correctIndex];

  return (
    <PhoneLayout>
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="text-center"
        >
          <motion.div
            animate={isCorrect ? { rotate: [0, -10, 10, 0] } : { x: [0, -8, 8, -8, 0] }}
            transition={{ delay: 0.3 }}
            className={`text-7xl mb-4 ${isCorrect ? '' : ''}`}
          >
            {isCorrect ? (
              <span className="font-title text-vault-green">CORRECT!</span>
            ) : (
              <span className="font-title text-vault-red">WRONG!</span>
            )}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="vault-panel p-6 rounded-xl w-full max-w-xs text-center"
        >
          <p className="font-ui text-sm text-gray-400 mb-2">The answer was</p>
          <div
            className="inline-block rounded-lg px-5 py-2 font-ui font-bold text-lg text-white"
            style={{ backgroundColor: ANSWER_COLORS[results.correctIndex].bg }}
          >
            {ANSWER_COLORS[results.correctIndex].label}: {correctChoice}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          {isCorrect ? (
            <p className="font-title text-2xl text-vault-gold">+$100</p>
          ) : (
            <p className="font-ui text-lg text-vault-red">No payout this round.</p>
          )}
          <p className="font-ui text-sm text-gray-500 mt-2">
            Score: <span className="text-vault-gold">${player?.score ?? 0}</span>
          </p>
        </motion.div>
      </div>
    </PhoneLayout>
  );
}
