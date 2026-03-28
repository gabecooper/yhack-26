import { useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { AnswerButton } from '../components/AnswerButton';
import { useGameState, useGameActions } from '@/context/GameContext';
import { ANSWER_COLORS } from '@/constants/gameConfig';

interface QuestionPhoneViewProps {
  playerId: string;
}

export function QuestionPhoneView({ playerId }: QuestionPhoneViewProps) {
  const { currentQuestion, players } = useGameState();
  const { submitAnswer } = useGameActions();
  const [selected, setSelected] = useState<number | null>(null);

  const player = players.find(p => p.id === playerId);
  const locked = selected !== null || (player?.currentAnswer !== null && player?.currentAnswer !== undefined);

  if (!currentQuestion) return null;

  const handleSelect = (index: number) => {
    if (locked) return;
    setSelected(index);
    submitAnswer(playerId, index);
  };

  return (
    <PhoneLayout minimalSettingsGear>
      {locked ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: ANSWER_COLORS[selected ?? 0].bg }}
            >
              <span className="font-title text-4xl text-white">
                {ANSWER_COLORS[selected ?? 0].label}
              </span>
            </div>
            <h2 className="font-title text-3xl text-white">Locked In!</h2>
            <p className="font-ui text-gray-400 mt-2">Waiting for others...</p>
          </motion.div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-vault-gold"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 justify-center">
          <p className="font-ui text-center text-gray-400 mb-2">Pick your answer!</p>
          {currentQuestion.choices.map((choice, i) => (
            <AnswerButton
              key={i}
              index={i}
              label={choice}
              onSelect={() => handleSelect(i)}
            />
          ))}
        </div>
      )}
    </PhoneLayout>
  );
}
