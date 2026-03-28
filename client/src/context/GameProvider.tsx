import { useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { GameContext, type GameActions } from './GameContext';
import type { GameState, GamePhase } from '@/types/game';
import type { PlayerState } from '@/types/player';
import { GAME_CONFIG } from '@/constants/gameConfig';
import {
  createInitialState,
  generateRoomCode,
  MOCK_PLAYERS,
  MOCK_PDFS,
  MOCK_QUESTIONS,
  createMockQuestionState,
  createMockResultsState,
  createMockWinState,
  createMockGameOverState,
} from './mockData';

const PHASE_ORDER: GamePhase[] = [
  'home', 'room', 'intro', 'question', 'results', 'leaderboard', 'win',
];

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState);

  useEffect(() => {
    if (state.phase !== 'question' || state.timeRemaining <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setState(prev => (
        prev.phase !== 'question'
          ? prev
          : { ...prev, timeRemaining: Math.max(0, prev.timeRemaining - 1) }
      ));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [state.phase, state.timeRemaining]);

  const mergeState = useCallback((partial: Partial<GameState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const createRoom = useCallback(() => {
    setState(prev => ({
      ...prev,
      roomCode: generateRoomCode(),
      phase: 'room',
      players: [],
    }));
  }, []);

  const joinRoom = useCallback((_roomCode: string, playerName: string): string => {
    const playerId = crypto.randomUUID();
    const usedIndices = new Set(state.players.map(p => p.characterIndex));
    let characterIndex = 0;
    for (let i = 0; i < GAME_CONFIG.maxPlayers; i++) {
      if (!usedIndices.has(i)) { characterIndex = i; break; }
    }
    const newPlayer: PlayerState = {
      id: playerId,
      name: playerName,
      characterIndex,
      score: GAME_CONFIG.startingBalance,
      isEliminated: false,
      isConnected: true,
      currentAnswer: null,
      minigameScore: 0,
    };
    setState(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
    return playerId;
  }, [state.players]);

  const startGame = useCallback(() => {
    mergeState({ phase: 'intro' });
  }, [mergeState]);

  const submitAnswer = useCallback((playerId: string, answerIndex: number) => {
    setState(prev => ({
      ...prev,
      players: prev.players.map(p =>
        p.id === playerId ? { ...p, currentAnswer: answerIndex } : p
      ),
    }));
  }, []);

  const submitMinigameAnswer = useCallback((playerId: string, _answer: number) => {
    setState(prev => {
      if (!prev.minigame) return prev;
      const currentScore = prev.minigame.scores[playerId] ?? 0;
      return {
        ...prev,
        minigame: {
          ...prev.minigame,
          scores: { ...prev.minigame.scores, [playerId]: currentScore + 1 },
        },
      };
    });
  }, []);

  const submitWager = useCallback((playerId: string, percentage: number) => {
    setState(prev => {
      if (!prev.vaultRun) return prev;
      return {
        ...prev,
        vaultRun: {
          ...prev.vaultRun,
          currentWagers: { ...prev.vaultRun.currentWagers, [playerId]: percentage },
        },
      };
    });
  }, []);

  const uploadPdf = useCallback((filename: string, uploadedBy: string | null) => {
    const newPdf = {
      id: crypto.randomUUID(),
      filename,
      uploadedBy,
      status: uploadedBy ? 'pending' as const : 'processing' as const,
      enabled: false,
      questionCount: 0,
    };
    setState(prev => ({ ...prev, pdfs: [...prev.pdfs, newPdf] }));
  }, []);

  const togglePdf = useCallback((pdfId: string, enabled: boolean) => {
    setState(prev => ({
      ...prev,
      pdfs: prev.pdfs.map(p => p.id === pdfId ? { ...p, enabled } : p),
    }));
  }, []);

  const removePdf = useCallback((pdfId: string) => {
    setState(prev => ({ ...prev, pdfs: prev.pdfs.filter(p => p.id !== pdfId) }));
  }, []);

  const approvePdf = useCallback((pdfId: string) => {
    setState(prev => ({
      ...prev,
      pdfs: prev.pdfs.map(p => p.id === pdfId ? { ...p, status: 'processing' as const } : p),
    }));
  }, []);

  const rejectPdf = useCallback((pdfId: string) => {
    setState(prev => ({
      ...prev,
      pdfs: prev.pdfs.map(p => p.id === pdfId ? { ...p, status: 'rejected' as const } : p),
    }));
  }, []);

  const playAgain = useCallback(() => {
    setState(prev => ({
      ...createInitialState(),
      roomCode: prev.roomCode,
      players: prev.players.map(p => ({
        ...p,
        score: GAME_CONFIG.startingBalance,
        isEliminated: false,
        currentAnswer: null,
        minigameScore: 0,
      })),
      pdfs: prev.pdfs,
      phase: 'room' as const,
    }));
  }, []);

  const setPhase = useCallback((phase: GamePhase) => {
    const phaseData = getPhaseData(phase);
    mergeState(phaseData);
  }, [mergeState]);

  const advancePhase = useCallback(() => {
    setState(prev => {
      const currentIdx = PHASE_ORDER.indexOf(prev.phase);
      const nextIdx = (currentIdx + 1) % PHASE_ORDER.length;
      const nextPhase = PHASE_ORDER[nextIdx];
      return { ...prev, ...getPhaseData(nextPhase) };
    });
  }, []);

  const actions: GameActions = useMemo(() => ({
    createRoom, joinRoom, startGame, submitAnswer,
    submitMinigameAnswer, submitWager, uploadPdf, togglePdf,
    removePdf, approvePdf, rejectPdf, playAgain, setPhase, advancePhase,
  }), [
    createRoom, joinRoom, startGame, submitAnswer,
    submitMinigameAnswer, submitWager, uploadPdf, togglePdf,
    removePdf, approvePdf, rejectPdf, playAgain, setPhase, advancePhase,
  ]);

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
}

function getPhaseData(phase: GamePhase): Partial<GameState> {
  switch (phase) {
    case 'home': return { phase, roomCode: '', players: [], pdfs: [] };
    case 'room': return {
      phase, roomCode: generateRoomCode(),
      players: MOCK_PLAYERS, pdfs: MOCK_PDFS,
    };
    case 'intro': return { phase };
    case 'question': return createMockQuestionState(0);
    case 'results': return createMockResultsState(0);
    case 'leaderboard': return { phase };
    case 'win': return createMockWinState();
    case 'gameover': return createMockGameOverState();
    default: return { phase };
  }
}
