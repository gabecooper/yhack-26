import type { PlayerState } from './player';

export type GamePhase =
  | 'home'
  | 'room'
  | 'intro'
  | 'question'
  | 'results'
  | 'leaderboard'
  | 'win'
  | 'gameover';

export interface Question {
  id: string;
  question: string;
  choices: string[];
  correct: number;
  keywords: string[];
  category?: string;
  source?: string | null;
  probabilities?: number[];
}

export interface GameStartOptions {
  polymarketCategories?: string[];
}

export interface QuestionResult {
  correctIndex: number;
  playerAnswers: Record<string, number | null>;
}

export interface MinigameState {
  participantIds: string[];
  scores: Record<string, number>;
  timeRemaining: number;
  timerDuration: number;
  threshold: number;
}

export interface VaultRunState {
  positions: Record<string, number>;
  currentWagers: Record<string, number>;
  targetScore: number;
  currentQuestion: Question | null;
  phase: 'wager' | 'question' | 'reveal';
}

export interface PdfEntry {
  id: string;
  filename: string;
  uploadedBy: string | null;
  status: 'pending' | 'approved' | 'processing' | 'ready' | 'rejected';
  enabled: boolean;
  questionCount: number;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: PlayerState[];
  questionDeck: Question[];
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  timerDuration: number;
  roundDeadlineAt: string | null;
  results: QuestionResult | null;
  minigame: MinigameState | null;
  vaultRun: VaultRunState | null;
  winnerId: string | null;
  pdfs: PdfEntry[];
  isPreparingGame: boolean;
  preparationMessage: string | null;
}
