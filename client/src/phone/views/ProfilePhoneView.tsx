import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { useGameActions, useGameState } from '@/context/GameContext';
import { LockTimer } from '@/shared/components/LockTimer';
import { useLoopingAudio } from '@/shared/hooks/useLoopingAudio';
import { useAudioSettings } from '@/shared/context/AudioSettingsContext';
import levelMusicSrc from '@/assets/audio/level-music.mp3';
import { AnswerButton } from '../components/AnswerButton';

interface ProfilePhoneViewProps {
  playerId: string;
}

export function ProfilePhoneView({ playerId }: ProfilePhoneViewProps) {
  const { currentQuestion, profileAssignments, profileResponses, roundDeadlineAt, timerDuration } = useGameState();
  const { submitAnswer } = useGameActions();
  const { musicEnabled } = useAudioSettings();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [submittedText, setSubmittedText] = useState<string | null>(null);

  const assignedQuestions = profileAssignments[playerId] ?? (currentQuestion ? [currentQuestion] : []);
  const submittedCount = profileResponses[playerId]?.length ?? 0;
  const activeQuestion = assignedQuestions[submittedCount] ?? null;
  const isComplete = assignedQuestions.length > 0 && submittedCount >= assignedQuestions.length;
  const selectedText = selectedIndex !== null ? activeQuestion?.choices[selectedIndex] : null;
  const isFreeTextQuestion = activeQuestion?.profileResponseMode === 'free-text';
  const profileAnswerMaxLength = activeQuestion?.profileResponseMaxLength ?? 30;
  const canSubmitText = draftAnswer.trim().length > 0 && submittedText === null;
  const shouldPlayWaitingMusic = isComplete && Boolean(roundDeadlineAt);

  useLoopingAudio({
    enabled: musicEnabled && shouldPlayWaitingMusic,
    src: levelMusicSrc,
    volume: 0.35,
  });

  useEffect(() => {
    setSelectedIndex(null);
    setDraftAnswer('');
    setSubmittedText(null);
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

  const handleTextSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeQuestion || !isFreeTextQuestion || !canSubmitText || isComplete) {
      return;
    }

    const normalizedAnswer = draftAnswer.trim().slice(0, profileAnswerMaxLength);

    if (!normalizedAnswer) {
      return;
    }

    setSubmittedText(normalizedAnswer);
    submitAnswer(playerId, normalizedAnswer);
  };

  return (
    <PhoneLayout minimalSettingsGear contentClassName="justify-center">
      {isComplete ? (
        <>
          {roundDeadlineAt && (
            <div
              className="pointer-events-none fixed left-4 z-[60]"
              style={{ top: 'max(0.9rem, calc(env(safe-area-inset-top) + 0.45rem))' }}
            >
              <div style={{ transform: 'scale(0.62)', transformOrigin: 'top left' }}>
                <LockTimer deadlineAt={roundDeadlineAt} totalTime={timerDuration} size={200} />
              </div>
            </div>
          )}

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-5 pt-20 text-center">
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
              <p className="mt-4 font-ui text-xs uppercase tracking-[0.28em] text-white/45">
                Returning when the lock hits zero.
              </p>
            </motion.div>
          </div>
        </>
      ) : (
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="mb-5 text-center">
            <p className="font-ui text-xs uppercase tracking-[0.3em] text-violet-200/80">
              Quick Profile Check
            </p>
            {activeQuestion?.displaySubtitle && (
              <p className="mt-3 font-ui text-xs font-semibold uppercase tracking-[0.24em] text-vault-gold">
                {activeQuestion.displaySubtitle}
              </p>
            )}
            <p className="mt-3 font-ui text-lg text-white/85">
              {isFreeTextQuestion ? 'Drop your answer.' : 'Choose what fits you best.'}
            </p>
            <p className="mt-2 font-ui text-xs uppercase tracking-[0.3em] text-violet-100/70">
              {isFreeTextQuestion ? 'Response' : 'Preference'} {submittedCount + 1} of {Math.max(assignedQuestions.length, 1)}
            </p>
            <p className="mt-4 font-ui text-base text-white/75">
              {activeQuestion?.question}
            </p>
          </div>

          {isFreeTextQuestion ? (
            <form className="flex flex-col gap-3" onSubmit={handleTextSubmit}>
              <input
                type="text"
                value={draftAnswer}
                onChange={event => setDraftAnswer(event.target.value.slice(0, profileAnswerMaxLength))}
                placeholder="Type your answer..."
                maxLength={profileAnswerMaxLength}
                disabled={submittedText !== null}
                className="minimal-input text-center font-ui text-lg"
                autoComplete="off"
              />
              <p className="text-center font-ui text-xs uppercase tracking-[0.28em] text-white/45">
                {profileAnswerMaxLength} character max
              </p>
              <button
                type="submit"
                disabled={!canSubmitText}
                className="minimal-button-primary w-full py-4 text-lg"
              >
                Save Answer
              </button>
            </form>
          ) : (
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
          )}

          {(selectedText || submittedText) && (
            <p className="mt-4 text-center font-ui text-sm text-white/65">
              Saved: {submittedText ?? selectedText}
            </p>
          )}
        </div>
      )}
    </PhoneLayout>
  );
}
