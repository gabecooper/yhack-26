import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameActions, useGameState } from '@/context/GameContext';
import { JoinView } from './views/JoinView';
import { WaitingView } from './views/WaitingView';
import { ProfilePhoneView } from './views/ProfilePhoneView';
import { QuestionPhoneView } from './views/QuestionPhoneView';
import { ResultsPhoneView } from './views/ResultsPhoneView';
import { SpectatorView } from './views/SpectatorView';
import type { GamePhase } from '@/types/game';

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

function getHostPhaseSignal(phase: GamePhase) {
  switch (phase) {
    case 'home':
      return {
        eyebrow: 'Host Screen',
        title: 'Home Base',
        detail: 'The host is setting up the room.',
      };
    case 'room':
      return {
        eyebrow: 'Host Screen',
        title: 'Lobby Open',
        detail: 'The room is live and ready for players.',
      };
    case 'intro':
      return {
        eyebrow: 'Host Screen',
        title: 'Intro Rolling',
        detail: 'The big screen is running the briefing.',
      };
    case 'profile':
      return {
        eyebrow: 'Host Screen',
        title: 'Survey Live',
        detail: 'Answer the quick setup questions now.',
      };
    case 'question':
      return {
        eyebrow: 'Host Screen',
        title: 'Question Live',
        detail: 'The next prompt is up. Respond on your phone.',
      };
    case 'results':
      return {
        eyebrow: 'Host Screen',
        title: 'Results Reveal',
        detail: 'The answer and reactions are on the board.',
      };
    case 'leaderboard':
      return {
        eyebrow: 'Host Screen',
        title: 'Scores Updating',
        detail: 'The leaderboard is up on the big screen.',
      };
    case 'win':
      return {
        eyebrow: 'Host Screen',
        title: 'Victory Screen',
        detail: 'The round is wrapping up.',
      };
    case 'gameover':
      return {
        eyebrow: 'Host Screen',
        title: 'Game Over',
        detail: 'The session has ended on the host screen.',
      };
    default:
      return {
        eyebrow: 'Host Screen',
        title: 'Syncing',
        detail: 'Waiting for the next update from the host.',
      };
  }
}

export function PhoneApp() {
  const { phase, players } = useGameState();
  const { leaveRoom } = useGameActions();
  const [playerId, setPlayerId] = useState<string | null>(() =>
    localStorage.getItem('heist_player_id')
  );

  useEffect(() => {
    if (playerId) localStorage.setItem('heist_player_id', playerId);
  }, [playerId]);

  const player = players.find(p => p.id === playerId);
  const isEliminated = player?.isEliminated ?? false;

  const handleJoin = (id: string) => setPlayerId(id);
  const handleLeave = () => {
    void leaveRoom();
    localStorage.removeItem('heist_player_id');
    setPlayerId(null);
  };

  if (!playerId || !player) {
    return (
      <>
        <JoinView onJoin={handleJoin} />
      </>
    );
  }

  const viewKey = isEliminated ? 'spectator' : phase;
  const hostPhaseSignal = getHostPhaseSignal(phase);

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div key={viewKey} className="w-full h-full" {...PAGE_TRANSITION}>
          {isEliminated ? (
            <SpectatorView player={player} />
          ) : phase === 'room' || phase === 'home' || phase === 'intro' ? (
            <WaitingView player={player} onLeave={handleLeave} />
          ) : phase === 'profile' ? (
            <ProfilePhoneView playerId={playerId} />
          ) : phase === 'question' ? (
            <QuestionPhoneView playerId={playerId} />
          ) : phase === 'results' ? (
            <ResultsPhoneView playerId={playerId} />
          ) : (
            <SpectatorView player={player} />
          )}
        </motion.div>
      </AnimatePresence>

      <div
        className="pointer-events-none fixed left-1/2 z-[60] w-[min(18rem,calc(100%-5.5rem))] -translate-x-1/2"
        style={{ top: 'max(0.9rem, calc(env(safe-area-inset-top) + 0.45rem))' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`host-phase-${phase}`}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="rounded-[1.25rem] border border-white/10 bg-black/45 px-4 py-3 text-center shadow-[0_12px_36px_rgba(0,0,0,0.28)] backdrop-blur-md"
          >
            <p className="font-ui text-[10px] uppercase tracking-[0.28em] text-vault-gold/80">
              {hostPhaseSignal.eyebrow}
            </p>
            <p className="mt-1 font-title text-xl leading-none text-white">
              {hostPhaseSignal.title}
            </p>
            <p className="mt-1 font-ui text-[11px] leading-relaxed text-white/68">
              {hostPhaseSignal.detail}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
