import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { useGameActions, useGameState } from '@/context/GameContext';
import { AnswerButton } from '../components/AnswerButton';

interface ProfilePhoneViewProps {
  playerId: string;
}

export function ProfilePhoneView({ playerId }: ProfilePhoneViewProps) {
  const { currentQuestion, profileAssignments, profileResponses } = useGameState();
  const { submitAnswer } = useGameActions();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const assignedQuestions = profileAssignments[playerId] ?? (currentQuestion ? [currentQuestion] : []);
  const submittedCount = profileResponses[playerId]?.length ?? 0;
  const activeQuestion = assignedQuestions[submittedCount] ?? null;
  const isComplete = assignedQuestions.length > 0 && submittedCount >= assignedQuestions.length;
  const selectedText = selectedIndex !== null ? activeQuestion?.choices[selectedIndex] : null;

  useEffect(() => {
    setSelectedIndex(null);
  }, [submittedCount]);

  if (!activeQuestion && !isComplete) {
    return (
      <PhoneLayout minimalSettingsGear contentClassName="justify-center">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-5 text-center">
          <div className="soft-glass-panel w-full rounded-[2rem] px-6 py-8">
            <p className="font-ui text-xs uppercase tracking-[0.3em] text-violet-200/80">
              Preparing Survey
            </p>
            <p className="mt-3 font-ui text-sm text-white/65">
              Your friend-group questions are loading.
            </p>
          </div>
        </div>
      </PhoneLayout>
    );
  }

  const handleSelect = (answerIndex: number) => {
    if (!activeQuestion || selectedIndex !== null || isComplete) {
      return;
    }

    setSelectedIndex(answerIndex);
    submitAnswer(playerId, answerIndex);
  };

  return (
    <PhoneLayout minimalSettingsGear contentClassName="justify-center">
      {isComplete ? (
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-5 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="soft-glass-panel w-full rounded-[2rem] px-6 py-8"
          >
            <p className="font-ui text-xs uppercase tracking-[0.3em] text-violet-200/80">
              Survey Complete
            </p>
            <h2 className="mt-3 font-title text-4xl text-vault-gold">All Set</h2>
            <p className="mt-3 font-ui text-sm text-white/65">
              Waiting for the rest of your group...
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="mb-5 text-center">
            <p className="font-ui text-xs uppercase tracking-[0.3em] text-violet-200/80">
              Quick Profile Check
            </p>
            <p className="mt-3 font-ui text-lg text-white/85">
              Choose what fits you best.
            </p>
            <p className="mt-2 font-ui text-xs uppercase tracking-[0.3em] text-violet-100/70">
              Preference {submittedCount + 1} of {Math.max(assignedQuestions.length, 1)}
            </p>
            <p className="mt-4 font-ui text-base text-white/75">
              {activeQuestion?.question}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {activeQuestion?.choices.map((choice, index) => (
              <AnswerButton
                key={index}
                index={index}
                label={choice}
                disabled={selectedIndex !== null}
                selected={selectedIndex === index}
                onSelect={() => handleSelect(index)}
              />
            ))}
          </div>

          {selectedText && (
            <p className="mt-4 text-center font-ui text-sm text-white/65">
              Saved: {selectedText}
            </p>
          )}
        </div>
      )}
    </PhoneLayout>
  );
}
