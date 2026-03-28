import { createContext, useContext } from 'react';
import type { GameState, GamePhase, PdfEntry } from '@/types/game';

export interface GameActions {
  createRoom: () => void;
  joinRoom: (roomCode: string, playerName: string) => string;
  startGame: () => void;
  submitAnswer: (playerId: string, answerIndex: number) => void;
  submitMinigameAnswer: (playerId: string, answer: number) => void;
  submitWager: (playerId: string, percentage: number) => void;
  uploadPdf: (filename: string, uploadedBy: string | null) => void;
  togglePdf: (pdfId: string, enabled: boolean) => void;
  removePdf: (pdfId: string) => void;
  approvePdf: (pdfId: string) => void;
  rejectPdf: (pdfId: string) => void;
  playAgain: () => void;
  setPhase: (phase: GamePhase) => void;
  advancePhase: () => void;
}

export interface GameContextValue {
  state: GameState;
  actions: GameActions;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}

export function useGameState(): GameState {
  return useGame().state;
}

export function useGameActions(): GameActions {
  return useGame().actions;
}
