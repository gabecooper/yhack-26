import { useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { AnswerButton } from '../components/AnswerButton';
import { useGameState, useGameActions } from '@/context/GameContext';
import { getAnswerMeta } from '@/constants/gameConfig';
import v4RoofBg from '@/assets/backgrounds/v4roof.png';

interface QuestionPhoneViewProps {
  playerId: string;
}

export function QuestionPhoneView({ playerId }: QuestionPhoneViewProps) {
  const { currentQuestion, players } = useGameState();
  const { submitAnswer } = useGameActions();
  const [selected, setSelected] = useState<number | null>(null);
  const selectedAnswerMeta = getAnswerMeta(selected ?? 0);

  const player = players.find(p => p.id === playerId);
  const locked = selected !== null || (player?.currentAnswer !== null && player?.currentAnswer !== undefined);

  if (!currentQuestion) return null;

  const handleSelect = (index: number) => {
    if (locked) return;
    setSelected(index);
    submitAnswer(playerId, index);
  };

  return (
    <PhoneLayout
      minimalSettingsGear
      backgroundImage={v4RoofBg}
      overlayClassName="bg-black/35"
      contentClassName="justify-center"
    >
      {locked ? (
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-5 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="soft-glass-panel w-full rounded-[2rem] px-6 py-8"
          >
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.5rem]"
              style={{ backgroundColor: selectedAnswerMeta.bg }}
            >
              <span className="font-title text-4xl text-white">
                {selectedAnswerMeta.label}
              </span>
            </div>
            <p className="font-ui text-xs uppercase tracking-[0.3em] text-white/55">
              Submitted
            </p>
            <h2 className="mt-3 font-title text-4xl text-white">Locked In</h2>
            <p className="mt-3 font-ui text-base text-white/65">Waiting for everyone else...</p>
          </motion.div>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-vault-gold"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="mb-5 text-center">
            <p className="font-ui text-xs uppercase tracking-[0.3em] text-white/55">
              Your Turn
            </p>
            <p className="mt-3 font-ui text-lg uppercase tracking-[0.14em] text-white/85">
              Pick your answer
            </p>
          </div>

          <div className="flex flex-col gap-3">
          {currentQuestion.choices.map((choice, i) => (
            <AnswerButton
              key={i}
              index={i}
              label={choice}
              onSelect={() => handleSelect(i)}
            />
          ))}
          </div>
        </div>
      )}
    </PhoneLayout>
  );
}
