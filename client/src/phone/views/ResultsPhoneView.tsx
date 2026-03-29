import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { useGameState } from '@/context/GameContext';
import { getAnswerMeta } from '@/constants/gameConfig';

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
  const correctAnswerMeta = getAnswerMeta(results.correctIndex);

  return (
    <PhoneLayout contentClassName="justify-center">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-5 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="soft-glass-panel w-full rounded-[2rem] px-6 py-8"
        >
          <motion.div
            animate={isCorrect ? { rotate: [0, -10, 10, 0] } : { x: [0, -8, 8, -8, 0] }}
            transition={{ delay: 0.3 }}
            className="mb-4 text-6xl"
          >
            {isCorrect ? (
              <span className="font-title text-vault-green">CORRECT!</span>
            ) : (
              <span className="font-title text-vault-red">WRONG!</span>
            )}
          </motion.div>

          <p className="font-ui text-xs uppercase tracking-[0.28em] text-white/50">
            Correct Answer
          </p>
          <div
            className="mt-4 inline-block rounded-full px-5 py-2 font-ui text-lg font-bold text-white"
            style={{ backgroundColor: correctAnswerMeta.bg }}
          >
            {correctAnswerMeta.label}: {correctChoice}
          </div>

          <div className="mt-6">
            {isCorrect ? (
              <p className="font-title text-3xl text-vault-gold">+$100</p>
            ) : (
              <p className="font-ui text-lg text-vault-red">No payout this round.</p>
            )}
          </div>
          <p className="mt-2 font-ui text-sm text-white/55">
            Score: <span className="text-vault-gold">${player?.score ?? 0}</span>
          </p>
        </motion.div>
      </div>
    </PhoneLayout>
  );
}
