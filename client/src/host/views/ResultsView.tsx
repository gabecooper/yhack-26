import { motion } from 'framer-motion';
import { HostLayout } from '@/shared/components/HostLayout';
import { PlayerReaction } from '../components/PlayerReaction';
import { useGameActions, useGameState } from '@/context/GameContext';
import { GAME_CONFIG, getAnswerMeta } from '@/constants/gameConfig';
import v4RoofBg from '@/assets/backgrounds/v4roof.png';

export function ResultsView() {
  const { currentQuestion, results, players } = useGameState();
  const { advancePhase } = useGameActions();

  if (!currentQuestion || !results) return null;

  const activePlayers = players.filter(p => !p.isEliminated);
  const correctPlayers = activePlayers.filter(
    p => results.playerAnswers[p.id] === results.correctIndex
  );
  const wrongPlayers = activePlayers.filter(
    p => results.playerAnswers[p.id] !== results.correctIndex
  );

  const correctAnswer = currentQuestion.choices[results.correctIndex];
  const answerMeta = getAnswerMeta(results.correctIndex);

  return (
    <HostLayout backgroundImage={v4RoofBg} minimalSettingsGear>
      <div className="flex min-h-0 flex-1 flex-row">
        <section className="flex h-full w-[42%] shrink-0 items-center justify-center px-8 md:px-12">
          <div className="flex max-w-xl flex-col items-center gap-5 text-center">
            <motion.p
              initial={{ y: -18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="question-numbering font-tradeWinds text-2xl md:text-3xl"
            >
              The answer was...
            </motion.p>

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.35 }}
              className="relative w-full rounded-[2rem] border border-white/10 bg-black/20 px-8 py-10 shadow-[0_22px_80px_rgba(0,0,0,0.35)]"
            >
              <div className="mb-5 flex justify-center">
                <span
                  className="inline-flex min-w-[4.5rem] items-center justify-center rounded-full px-5 py-2 font-title text-3xl text-white"
                  style={{ backgroundColor: answerMeta.bg }}
                >
                  {answerMeta.label}
                </span>
              </div>
              <p className="question-copy font-newspaper text-4xl leading-tight md:text-5xl">
                {correctAnswer}
              </p>
              <div className="mx-auto mt-6 h-px w-24 bg-white/60" />
              <p className="mt-4 font-ui text-sm uppercase tracking-[0.3em] text-gray-300">
                Correct answers pay ${GAME_CONFIG.correctAnswerReward}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="flex h-full w-[58%] shrink-0 items-center px-6 pb-10 pt-16 md:px-10">
          <div className="grid w-full grid-cols-2 gap-6">
            <motion.div
              initial={{ x: -28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-[2rem] border border-white/10 bg-black/15 px-6 py-7"
            >
              <div className="mb-5">
                <p className="font-ui text-xs font-semibold uppercase tracking-[0.3em] text-vault-green">
                  Clean Getaway
                </p>
                <h2 className="mt-2 font-title text-3xl text-white">
                  Correct
                </h2>
                <p className="mt-1 font-ui text-sm text-gray-400">
                  {correctPlayers.length === 0
                    ? 'Nobody cleared this one.'
                    : `${correctPlayers.length} player${correctPlayers.length === 1 ? '' : 's'} move on.`}
                </p>
              </div>

              <div className="flex min-h-[16rem] flex-wrap content-start justify-center gap-5">
                {correctPlayers.map(p => (
                  <PlayerReaction key={p.id} player={p} isCorrect />
                ))}
                {correctPlayers.length === 0 && (
                  <p className="font-ui text-center text-sm text-gray-500">
                    Nobody got it right.
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="rounded-[2rem] border border-white/10 bg-black/15 px-6 py-7"
            >
              <div className="mb-5">
                <p className="font-ui text-xs font-semibold uppercase tracking-[0.3em] text-vault-red">
                  Alarm Triggered
                </p>
                <h2 className="mt-2 font-title text-3xl text-white">
                  Missed It
                </h2>
                <p className="mt-1 font-ui text-sm text-gray-400">
                  {wrongPlayers.length === 0
                    ? 'Everyone escaped the trap.'
                    : `${wrongPlayers.length} player${wrongPlayers.length === 1 ? '' : 's'} missed this question.`}
                </p>
              </div>

              <div className="flex min-h-[16rem] flex-wrap content-start justify-center gap-5">
                {wrongPlayers.map(p => (
                  <PlayerReaction key={p.id} player={p} isCorrect={false} />
                ))}
                {wrongPlayers.length === 0 && (
                  <p className="font-ui text-center text-sm text-gray-500">
                    Everyone nailed it.
                  </p>
                )}
              </div>
              <button
                onClick={advancePhase}
                className="vault-button mt-8 w-full px-6 py-4 text-xl"
              >
                Continue
              </button>
            </motion.div>
          </div>
        </section>
      </div>
    </HostLayout>
  );
}
