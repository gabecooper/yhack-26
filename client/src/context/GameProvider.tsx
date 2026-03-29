import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { GameContext, type GameActions } from './GameContext';
import type { GamePhase, GameStartOptions, GameState, QuestionResult } from '@/types/game';
import type { PlayerState } from '@/types/player';
import { GAME_CONFIG } from '@/constants/gameConfig';
import { fetchPolymarketQuestionDeck } from '@/services/polymarket/questions';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/auth/AuthContext';
import {
  createInitialState,
  generateRoomCode,
  getMockQuestion,
} from './mockData';

const STORAGE_KEYS = {
  roomCode: 'heist_room_code',
  playerId: 'heist_player_id',
  hostRoomCode: 'heist_host_room_code',
} as const;

const SNAPSHOT_PREFIX = 'heist_host_snapshot:';
const JOIN_REQUEST_TIMEOUT_MS = 4000;

interface JoinRequestPayload {
  requestId: string;
  roomCode: string;
  playerId: string;
  playerName: string;
}

interface JoinAckPayload {
  requestId: string;
  ok: boolean;
  playerId?: string;
}

interface SubmitAnswerPayload {
  playerId: string;
  answerIndex: number;
}

interface LeaveRoomPayload {
  playerId: string;
}

interface PresencePayload {
  role: 'host' | 'player';
  playerId?: string;
}

type StateUpdater = GameState | ((previousState: GameState) => GameState);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<GameState>(createInitialState);

  const stateRef = useRef(state);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isHostRef = useRef(false);
  const hasRestoredSessionRef = useRef(false);
  const isFinalizingQuestionRef = useRef(false);
  const joinResolverRef = useRef<{
    requestId: string;
    resolve: (playerId: string | null) => void;
    timeoutId: number;
  } | null>(null);

  useEffect(() => {
    stateRef.current = state;

    if (isHostRef.current && state.roomCode) {
      window.localStorage.setItem(getSnapshotStorageKey(state.roomCode), JSON.stringify(state));
    }
  }, [state]);

  const setLocalState = useCallback((updater: StateUpdater) => {
    setState(previousState => {
      const nextState =
        typeof updater === 'function'
          ? (updater as (previousState: GameState) => GameState)(previousState)
          : updater;

      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  const teardownChannel = useCallback(async () => {
    const activeChannel = channelRef.current;

    if (!activeChannel || !supabase) {
      channelRef.current = null;
      return;
    }

    channelRef.current = null;

    try {
      await activeChannel.untrack();
    } catch (error) {
      console.error('Unable to clear Supabase presence', error);
    }

    try {
      await supabase.removeChannel(activeChannel);
    } catch (error) {
      console.error('Unable to remove Supabase channel', error);
    }
  }, []);

  const sendBroadcast = useCallback(async (event: string, payload: Record<string, unknown>) => {
    if (!channelRef.current) {
      return;
    }

    const result = await channelRef.current.send({
      type: 'broadcast',
      event,
      payload,
    });

    if (result === 'error') {
      console.error(`Broadcast "${event}" failed`);
    }
  }, []);

  const broadcastSnapshot = useCallback(async (snapshot: GameState, reason: string) => {
    if (!isHostRef.current) {
      return;
    }

    await sendBroadcast('state-sync', { reason, state: snapshot });
  }, [sendBroadcast]);

  const commitHostState = useCallback((updater: StateUpdater, reason: string) => {
    if (!isHostRef.current) {
      return;
    }

    let nextSnapshot = stateRef.current;
    setLocalState(previousState => {
      nextSnapshot =
        typeof updater === 'function'
          ? (updater as (previousState: GameState) => GameState)(previousState)
          : updater;
      return nextSnapshot;
    });

    void broadcastSnapshot(nextSnapshot, reason);
  }, [broadcastSnapshot, setLocalState]);

  const finalizeQuestionRound = useCallback((reason: string) => {
    if (!isHostRef.current || isFinalizingQuestionRef.current) {
      return;
    }

    isFinalizingQuestionRef.current = true;

    try {
      const nextState = createResultsPhaseState(stateRef.current);
      commitHostState(nextState, `results:${reason}`);
    } finally {
      window.setTimeout(() => {
        isFinalizingQuestionRef.current = false;
      }, 50);
    }
  }, [commitHostState]);

  const syncPresenceToHostState = useCallback((channel: RealtimeChannel) => {
    if (!isHostRef.current) {
      return;
    }

    const presenceState = channel.presenceState<PresencePayload>();
    const connectedPlayerIds = new Set<string>();

    Object.values(presenceState).forEach(entries => {
      entries.forEach(entry => {
        if (entry.role === 'player' && entry.playerId) {
          connectedPlayerIds.add(entry.playerId);
        }
      });
    });

    const currentState = stateRef.current;
    let hasChanges = false;
    const nextPlayers = currentState.players.map(player => {
      const isConnected = connectedPlayerIds.has(player.id);

      if (player.isConnected === isConnected) {
        return player;
      }

      hasChanges = true;
      return { ...player, isConnected };
    });

    if (!hasChanges) {
      return;
    }

    const nextState = {
      ...currentState,
      players: nextPlayers,
    };

    setLocalState(nextState);
    void broadcastSnapshot(nextState, 'presence-sync');
  }, [broadcastSnapshot, setLocalState]);

  const handleJoinRequest = useCallback((payload: JoinRequestPayload) => {
    if (!isHostRef.current || payload.roomCode !== stateRef.current.roomCode) {
      return;
    }

    const currentState = stateRef.current;
    const normalizedName = payload.playerName.trim().slice(0, 16);

    if (!normalizedName) {
      void sendBroadcast('join-ack', { requestId: payload.requestId, ok: false });
      return;
    }

    const existingPlayer = currentState.players.find(player => player.id === payload.playerId);

    if (!existingPlayer && currentState.players.length >= GAME_CONFIG.maxPlayers) {
      void sendBroadcast('join-ack', { requestId: payload.requestId, ok: false });
      return;
    }

    let nextPlayers: PlayerState[];

    if (existingPlayer) {
      nextPlayers = currentState.players.map(player => (
        player.id === existingPlayer.id
          ? { ...player, name: normalizedName, isConnected: true }
          : player
      ));
    } else {
      const usedIndices = new Set(currentState.players.map(player => player.characterIndex));
      const characterIndex = Array.from(
        { length: GAME_CONFIG.maxPlayers },
        (_unused, index) => index
      ).find(index => !usedIndices.has(index)) ?? 0;

      nextPlayers = [
        ...currentState.players,
        {
          id: payload.playerId,
          name: normalizedName,
          characterIndex,
          score: GAME_CONFIG.startingBalance,
          isEliminated: false,
          isConnected: true,
          currentAnswer: null,
          minigameScore: 0,
        },
      ];
    }

    const nextState = {
      ...currentState,
      players: nextPlayers,
    };

    setLocalState(nextState);
    void broadcastSnapshot(nextState, 'join-request');
    void sendBroadcast('join-ack', {
      requestId: payload.requestId,
      ok: true,
      playerId: payload.playerId,
    });
  }, [broadcastSnapshot, sendBroadcast, setLocalState]);

  const handleJoinAck = useCallback((payload: JoinAckPayload) => {
    const pendingJoin = joinResolverRef.current;

    if (!pendingJoin || pendingJoin.requestId !== payload.requestId) {
      return;
    }

    window.clearTimeout(pendingJoin.timeoutId);
    joinResolverRef.current = null;
    pendingJoin.resolve(payload.ok ? payload.playerId ?? null : null);
  }, []);

  const handleAnswerSubmission = useCallback((payload: SubmitAnswerPayload) => {
    if (!isHostRef.current) {
      return;
    }

    const currentState = stateRef.current;

    if (currentState.phase !== 'question') {
      return;
    }

    let hasChanges = false;
    const nextPlayers = currentState.players.map(player => {
      if (player.id !== payload.playerId || player.currentAnswer !== null) {
        return player;
      }

      hasChanges = true;
      return {
        ...player,
        currentAnswer: payload.answerIndex,
      };
    });

    if (!hasChanges) {
      return;
    }

    const nextState = {
      ...currentState,
      players: nextPlayers,
    };

    setLocalState(nextState);
    void broadcastSnapshot(nextState, 'answer-submitted');
  }, [broadcastSnapshot, setLocalState]);

  const handleLeaveMessage = useCallback((payload: LeaveRoomPayload) => {
    if (!isHostRef.current) {
      return;
    }

    const currentState = stateRef.current;
    const targetPlayer = currentState.players.find(player => player.id === payload.playerId);

    if (!targetPlayer) {
      return;
    }

    const nextPlayers =
      currentState.phase === 'room' || currentState.phase === 'intro'
        ? currentState.players.filter(player => player.id !== payload.playerId)
        : currentState.players.map(player => (
          player.id === payload.playerId
            ? { ...player, isConnected: false }
            : player
        ));

    const nextState = {
      ...currentState,
      players: nextPlayers,
    };

    setLocalState(nextState);
    void broadcastSnapshot(nextState, 'player-left');
  }, [broadcastSnapshot, setLocalState]);

  const subscribeToRoom = useCallback(async (
    roomCode: string,
    options: {
      asHost: boolean;
      presenceKey: string;
      playerId?: string;
      initialState?: GameState;
    },
  ) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    await teardownChannel();
    isHostRef.current = options.asHost;

    const channel = supabase.channel(`heist-room:${roomCode}`, {
      config: {
        broadcast: { ack: true },
        presence: {
          enabled: true,
          key: options.presenceKey,
        },
      },
    });

    channel
      .on('broadcast', { event: 'state-sync' }, ({ payload }) => {
        const incomingState = coerceIncomingState(payload?.state);

        if (!incomingState || isHostRef.current) {
          return;
        }

        setLocalState(incomingState);
      })
      .on('broadcast', { event: 'request-state' }, () => {
        if (!isHostRef.current) {
          return;
        }

        void broadcastSnapshot(stateRef.current, 'request-state');
      })
      .on('broadcast', { event: 'join-request' }, ({ payload }) => {
        const parsedPayload = coerceJoinRequest(payload);
        if (parsedPayload) {
          handleJoinRequest(parsedPayload);
        }
      })
      .on('broadcast', { event: 'join-ack' }, ({ payload }) => {
        const parsedPayload = coerceJoinAck(payload);
        if (parsedPayload) {
          handleJoinAck(parsedPayload);
        }
      })
      .on('broadcast', { event: 'submit-answer' }, ({ payload }) => {
        const parsedPayload = coerceSubmitAnswer(payload);
        if (parsedPayload) {
          handleAnswerSubmission(parsedPayload);
        }
      })
      .on('broadcast', { event: 'leave-room' }, ({ payload }) => {
        const parsedPayload = coerceLeaveRoom(payload);
        if (parsedPayload) {
          handleLeaveMessage(parsedPayload);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        syncPresenceToHostState(channel);
      });

    channelRef.current = channel;

    await new Promise<void>((resolve, reject) => {
      channel.subscribe(async (status, error) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track(
              options.asHost
                ? { role: 'host' }
                : { role: 'player', playerId: options.playerId }
            );
          } catch (trackError) {
            console.error('Unable to track Supabase presence', trackError);
          }

          if (options.asHost) {
            const initialState =
              options.initialState
              ?? readStoredSnapshot(roomCode)
              ?? createRealtimeRoomState(roomCode);

            window.localStorage.setItem(STORAGE_KEYS.roomCode, roomCode);
            window.localStorage.setItem(STORAGE_KEYS.hostRoomCode, roomCode);

            setLocalState(initialState);
            await broadcastSnapshot(initialState, 'host-subscribed');
          } else {
            window.localStorage.setItem(STORAGE_KEYS.roomCode, roomCode);
            window.localStorage.removeItem(STORAGE_KEYS.hostRoomCode);
            await sendBroadcast('request-state', { roomCode });
          }

          resolve();
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(error ?? new Error(`Supabase realtime channel failed with status ${status}`));
        }
      });
    });
  }, [
    broadcastSnapshot,
    handleAnswerSubmission,
    handleJoinAck,
    handleJoinRequest,
    handleLeaveMessage,
    sendBroadcast,
    setLocalState,
    syncPresenceToHostState,
    teardownChannel,
  ]);

  useEffect(() => {
    if (hasRestoredSessionRef.current || !supabase) {
      return;
    }

    const storedRoomCode = window.localStorage.getItem(STORAGE_KEYS.roomCode);

    if (!storedRoomCode) {
      hasRestoredSessionRef.current = true;
      return;
    }

    const hostRoomCode = window.localStorage.getItem(STORAGE_KEYS.hostRoomCode);
    const storedPlayerId = window.localStorage.getItem(STORAGE_KEYS.playerId);

    if (hostRoomCode === storedRoomCode) {
      if (!user) {
        return;
      }

      hasRestoredSessionRef.current = true;
      void subscribeToRoom(storedRoomCode, {
        asHost: true,
        presenceKey: `host:${user.id}`,
      });
      return;
    }

    hasRestoredSessionRef.current = true;
    void subscribeToRoom(storedRoomCode, {
      asHost: false,
      presenceKey: storedPlayerId ?? crypto.randomUUID(),
      playerId: storedPlayerId ?? undefined,
    });
  }, [subscribeToRoom, user]);

  useEffect(() => {
    if (state.phase !== 'question' || !state.roundDeadlineAt) {
      return;
    }

    const updateCountdown = () => {
      setLocalState(previousState => {
        if (previousState.phase !== 'question' || !previousState.roundDeadlineAt) {
          return previousState;
        }

        const nextTimeRemaining = getTimeRemaining(previousState.roundDeadlineAt);

        if (nextTimeRemaining === previousState.timeRemaining) {
          return previousState;
        }

        return {
          ...previousState,
          timeRemaining: nextTimeRemaining,
        };
      });
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 250);

    return () => window.clearInterval(intervalId);
  }, [setLocalState, state.phase, state.roundDeadlineAt]);

  useEffect(() => {
    if (!isHostRef.current || state.phase !== 'question') {
      return;
    }

    const activePlayers = state.players.filter(player => !player.isEliminated);
    const everyoneAnswered =
      activePlayers.length > 0
      && activePlayers.every(player => player.currentAnswer !== null);

    if (everyoneAnswered) {
      finalizeQuestionRound('all-answered');
      return;
    }

    if (state.timeRemaining <= 0) {
      finalizeQuestionRound('timer-expired');
    }
  }, [finalizeQuestionRound, state.phase, state.players, state.timeRemaining]);

  useEffect(() => {
    return () => {
      void teardownChannel();
    };
  }, [teardownChannel]);

  const createRoom = useCallback(async () => {
    if (!supabase || !user) {
      return;
    }

    const roomCode = generateRoomCode();
    const initialState = createRealtimeRoomState(roomCode);

    await subscribeToRoom(roomCode, {
      asHost: true,
      presenceKey: `host:${user.id}`,
      initialState,
    });
  }, [subscribeToRoom, user]);

  const joinRoom = useCallback(async (roomCode: string, playerName: string): Promise<string | null> => {
    if (!supabase) {
      return null;
    }

    const normalizedRoomCode = roomCode.trim().toUpperCase();
    const normalizedName = playerName.trim().slice(0, 16);

    if (!normalizedRoomCode || !normalizedName) {
      return null;
    }

    const playerId = window.localStorage.getItem(STORAGE_KEYS.playerId) ?? crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEYS.playerId, playerId);

    await subscribeToRoom(normalizedRoomCode, {
      asHost: false,
      presenceKey: playerId,
      playerId,
    });

    return new Promise(resolve => {
      const requestId = crypto.randomUUID();
      const timeoutId = window.setTimeout(() => {
        if (joinResolverRef.current?.requestId === requestId) {
          joinResolverRef.current = null;
        }

        void teardownChannel();
        window.localStorage.removeItem(STORAGE_KEYS.roomCode);
        resolve(null);
      }, JOIN_REQUEST_TIMEOUT_MS);

      joinResolverRef.current = {
        requestId,
        resolve: joinedPlayerId => {
          if (joinedPlayerId) {
            window.localStorage.setItem(STORAGE_KEYS.roomCode, normalizedRoomCode);
            window.localStorage.setItem(STORAGE_KEYS.playerId, joinedPlayerId);
          }

          resolve(joinedPlayerId);
        },
        timeoutId,
      };

      void sendBroadcast('join-request', {
        requestId,
        roomCode: normalizedRoomCode,
        playerId,
        playerName: normalizedName,
      });
    });
  }, [sendBroadcast, subscribeToRoom, teardownChannel]);

  const leaveRoom = useCallback(async () => {
    const playerId = window.localStorage.getItem(STORAGE_KEYS.playerId);

    if (!isHostRef.current && playerId) {
      await sendBroadcast('leave-room', { playerId });
    }

    if (joinResolverRef.current) {
      window.clearTimeout(joinResolverRef.current.timeoutId);
      joinResolverRef.current.resolve(null);
      joinResolverRef.current = null;
    }

    await teardownChannel();

    isHostRef.current = false;
    window.localStorage.removeItem(STORAGE_KEYS.roomCode);
    window.localStorage.removeItem(STORAGE_KEYS.hostRoomCode);
    setLocalState(createInitialState());
  }, [sendBroadcast, setLocalState, teardownChannel]);

  const startGame = useCallback(async (options: GameStartOptions = {}) => {
    if (!isHostRef.current) {
      return;
    }

    commitHostState(previousState => ({
      ...previousState,
      isPreparingGame: true,
      preparationMessage: null,
    }), 'start-game:preparing');

    const { questionDeck, preparationMessage } = await buildQuestionDeck(options);
    const openingQuestion = questionDeck[0] ?? getMockQuestion(0);

    commitHostState(previousState => ({
      ...previousState,
      phase: 'intro',
      questionDeck,
      currentQuestion: openingQuestion,
      questionIndex: 0,
      totalQuestions: questionDeck.length,
      timeRemaining: GAME_CONFIG.questionTimerSeconds,
      timerDuration: GAME_CONFIG.questionTimerSeconds,
      roundDeadlineAt: null,
      results: null,
      players: previousState.players.map(player => ({
        ...player,
        score: GAME_CONFIG.startingBalance,
        isEliminated: false,
        currentAnswer: null,
        minigameScore: 0,
      })),
      isPreparingGame: false,
      preparationMessage,
    }), 'start-game:ready');
  }, [commitHostState]);

  const submitAnswer = useCallback((playerId: string, answerIndex: number) => {
    if (isHostRef.current) {
      return;
    }

    setLocalState(previousState => ({
      ...previousState,
      players: previousState.players.map(player => (
        player.id === playerId
          ? { ...player, currentAnswer: answerIndex }
          : player
      )),
    }));

    void sendBroadcast('submit-answer', { playerId, answerIndex });
  }, [sendBroadcast, setLocalState]);

  const submitMinigameAnswer = useCallback((_playerId: string, _answer: number) => {
    // Reserved for the next multiplayer iteration.
  }, []);

  const submitWager = useCallback((_playerId: string, _percentage: number) => {
    // Reserved for the next multiplayer iteration.
  }, []);

  const uploadPdf = useCallback((filename: string, uploadedBy: string | null) => {
    const status: 'pending' | 'ready' = uploadedBy ? 'pending' : 'ready';
    const nextEntry = {
      id: crypto.randomUUID(),
      filename,
      uploadedBy,
      status,
      enabled: uploadedBy === null,
      questionCount: uploadedBy ? 0 : GAME_CONFIG.defaultQuestionCount,
    };

    commitHostState(previousState => ({
      ...previousState,
      pdfs: [...previousState.pdfs, nextEntry],
    }), 'pdf-uploaded');
  }, [commitHostState]);

  const togglePdf = useCallback((pdfId: string, enabled: boolean) => {
    commitHostState(previousState => ({
      ...previousState,
      pdfs: previousState.pdfs.map(pdf => (
        pdf.id === pdfId ? { ...pdf, enabled } : pdf
      )),
    }), 'pdf-toggled');
  }, [commitHostState]);

  const removePdf = useCallback((pdfId: string) => {
    commitHostState(previousState => ({
      ...previousState,
      pdfs: previousState.pdfs.filter(pdf => pdf.id !== pdfId),
    }), 'pdf-removed');
  }, [commitHostState]);

  const approvePdf = useCallback((pdfId: string) => {
    commitHostState(previousState => ({
      ...previousState,
      pdfs: previousState.pdfs.map(pdf => (
        pdf.id === pdfId
          ? {
            ...pdf,
            status: 'ready' as const,
            enabled: true,
            questionCount: pdf.questionCount || GAME_CONFIG.defaultQuestionCount,
          }
          : pdf
      )),
    }), 'pdf-approved');
  }, [commitHostState]);

  const rejectPdf = useCallback((pdfId: string) => {
    commitHostState(previousState => ({
      ...previousState,
      pdfs: previousState.pdfs.map(pdf => (
        pdf.id === pdfId ? { ...pdf, status: 'rejected' as const } : pdf
      )),
    }), 'pdf-rejected');
  }, [commitHostState]);

  const playAgain = useCallback(() => {
    commitHostState(playAgainState(stateRef.current), 'play-again');
  }, [commitHostState]);

  const setPhase = useCallback((phase: GamePhase) => {
    if (!isHostRef.current) {
      return;
    }

    if (phase === 'results') {
      finalizeQuestionRound('manual');
      return;
    }

    commitHostState(getStateForPhase(stateRef.current, phase), `set-phase:${phase}`);
  }, [commitHostState, finalizeQuestionRound]);

  const advancePhase = useCallback(() => {
    if (!isHostRef.current) {
      return;
    }

    const currentState = stateRef.current;

    switch (currentState.phase) {
      case 'home':
        commitHostState(getStateForPhase(currentState, 'room'), 'advance:home');
        break;
      case 'room':
        commitHostState(getStateForPhase(currentState, 'intro'), 'advance:room');
        break;
      case 'intro':
        commitHostState(getStateForPhase(currentState, 'question'), 'advance:intro');
        break;
      case 'question':
        finalizeQuestionRound('manual-advance');
        break;
      case 'results':
        commitHostState(getStateForPhase(currentState, 'leaderboard'), 'advance:results');
        break;
      case 'leaderboard': {
        const nextIndex = currentState.questionIndex + 1;
        const deckLength = currentState.questionDeck.length || GAME_CONFIG.defaultQuestionCount;

        if (nextIndex < deckLength) {
          commitHostState(createQuestionPhaseState(currentState, nextIndex), 'advance:leaderboard');
        } else {
          commitHostState(getStateForPhase(currentState, 'win'), 'advance:leaderboard-win');
        }
        break;
      }
      case 'win':
      case 'gameover':
        commitHostState(playAgainState(currentState), 'advance:reset');
        break;
      default:
        break;
    }
  }, [commitHostState, finalizeQuestionRound]);

  const actions: GameActions = useMemo(() => ({
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    submitAnswer,
    submitMinigameAnswer,
    submitWager,
    uploadPdf,
    togglePdf,
    removePdf,
    approvePdf,
    rejectPdf,
    playAgain,
    setPhase,
    advancePhase,
  }), [
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    submitAnswer,
    submitMinigameAnswer,
    submitWager,
    uploadPdf,
    togglePdf,
    removePdf,
    approvePdf,
    rejectPdf,
    playAgain,
    setPhase,
    advancePhase,
  ]);

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
}

async function buildQuestionDeck(options: GameStartOptions) {
  const fallbackDeck = Array.from(
    { length: GAME_CONFIG.defaultQuestionCount },
    (_unused, index) => getMockQuestion(index)
  );
  const selectedCategories = Array.from(
    new Set((options.polymarketCategories ?? []).map(category => category.trim()).filter(Boolean))
  );

  if (selectedCategories.length === 0) {
    return {
      questionDeck: fallbackDeck,
      preparationMessage: 'No live market categories were selected, so this round uses the local fallback deck.',
    };
  }

  try {
    const liveQuestions = await fetchPolymarketQuestionDeck(
      selectedCategories,
      GAME_CONFIG.defaultQuestionCount
    );

    if (liveQuestions.length >= GAME_CONFIG.minQuestionCount) {
      return {
        questionDeck: liveQuestions,
        preparationMessage: null,
      };
    }

    if (liveQuestions.length > 0) {
      return {
        questionDeck: [...liveQuestions, ...fallbackDeck].slice(0, GAME_CONFIG.defaultQuestionCount),
        preparationMessage: 'Live markets were limited, so the remaining slots were filled with local fallback questions.',
      };
    }
  } catch (error) {
    console.error('Unable to build Polymarket-backed deck', error);
  }

  return {
    questionDeck: fallbackDeck,
    preparationMessage: 'Polymarket was unavailable, so this round fell back to the local question deck.',
  };
}

function createRealtimeRoomState(roomCode: string): GameState {
  return {
    ...createInitialState(),
    roomCode,
    phase: 'room',
  };
}

function getStateForPhase(previousState: GameState, phase: GamePhase): GameState {
  switch (phase) {
    case 'home':
      return {
        ...createInitialState(),
      };
    case 'room':
      return {
        ...playAgainState(previousState),
        phase,
      };
    case 'intro':
      return {
        ...previousState,
        phase,
        roundDeadlineAt: null,
        timeRemaining: GAME_CONFIG.questionTimerSeconds,
        timerDuration: GAME_CONFIG.questionTimerSeconds,
      };
    case 'question':
      return createQuestionPhaseState(previousState, previousState.questionIndex);
    case 'results':
      return createResultsPhaseState(previousState);
    case 'leaderboard':
      return {
        ...previousState,
        phase,
        roundDeadlineAt: null,
      };
    case 'win':
      return {
        ...previousState,
        phase,
        roundDeadlineAt: null,
        winnerId: getWinnerId(previousState.players),
      };
    case 'gameover':
      return {
        ...previousState,
        phase,
        roundDeadlineAt: null,
        winnerId: null,
      };
    default:
      return previousState;
  }
}

function createQuestionPhaseState(previousState: GameState, questionIndex: number): GameState {
  const deckLength = previousState.questionDeck.length || GAME_CONFIG.defaultQuestionCount;
  const boundedIndex = Math.max(0, Math.min(questionIndex, deckLength - 1));
  const question = previousState.questionDeck[boundedIndex] ?? getMockQuestion(boundedIndex);
  const roundDeadlineAt = new Date(
    Date.now() + GAME_CONFIG.questionTimerSeconds * 1000
  ).toISOString();

  return {
    ...previousState,
    phase: 'question',
    currentQuestion: question,
    questionIndex: boundedIndex,
    totalQuestions: previousState.questionDeck.length || previousState.totalQuestions,
    timeRemaining: GAME_CONFIG.questionTimerSeconds,
    timerDuration: GAME_CONFIG.questionTimerSeconds,
    roundDeadlineAt,
    results: null,
    players: resetPlayerAnswers(previousState.players),
  };
}

function createResultsPhaseState(previousState: GameState): GameState {
  if (previousState.phase === 'results' && previousState.results) {
    return previousState;
  }

  const currentQuestion =
    previousState.currentQuestion
    ?? previousState.questionDeck[previousState.questionIndex]
    ?? getMockQuestion(previousState.questionIndex);
  const results = buildQuestionResults(previousState.players, currentQuestion.correct);

  return {
    ...previousState,
    phase: 'results',
    currentQuestion,
    roundDeadlineAt: null,
    timeRemaining: 0,
    results,
    players: previousState.players.map(player => (
      results.playerAnswers[player.id] === currentQuestion.correct
        ? { ...player, score: player.score + GAME_CONFIG.correctAnswerReward }
        : player
    )),
  };
}

function buildQuestionResults(players: PlayerState[], correctIndex: number): QuestionResult {
  return {
    correctIndex,
    playerAnswers: Object.fromEntries(
      players.map(player => [player.id, player.currentAnswer ?? null])
    ),
  };
}

function resetPlayerAnswers(players: PlayerState[]) {
  return players.map(player => ({ ...player, currentAnswer: null }));
}

function getWinnerId(players: PlayerState[]) {
  if (players.length === 0) {
    return null;
  }

  return [...players]
    .sort((left, right) => right.score - left.score)[0]
    ?.id ?? null;
}

function playAgainState(previousState: GameState): GameState {
  return {
    ...createInitialState(),
    roomCode: previousState.roomCode,
    players: previousState.players.map(player => ({
      ...player,
      score: GAME_CONFIG.startingBalance,
      isEliminated: false,
      currentAnswer: null,
      minigameScore: 0,
    })),
    pdfs: previousState.pdfs,
    phase: 'room',
  };
}

function getTimeRemaining(roundDeadlineAt: string): number {
  const deadlineMs = new Date(roundDeadlineAt).getTime();
  const diffMs = deadlineMs - Date.now();

  return Math.max(0, Math.ceil(diffMs / 1000));
}

function getSnapshotStorageKey(roomCode: string) {
  return `${SNAPSHOT_PREFIX}${roomCode}`;
}

function readStoredSnapshot(roomCode: string): GameState | null {
  const rawSnapshot = window.localStorage.getItem(getSnapshotStorageKey(roomCode));

  if (!rawSnapshot) {
    return null;
  }

  try {
    return coerceIncomingState(JSON.parse(rawSnapshot));
  } catch (error) {
    console.error('Unable to restore host room snapshot', error);
    return null;
  }
}

function coerceIncomingState(value: unknown): GameState | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<GameState>;

  if (typeof candidate.roomCode !== 'string' || typeof candidate.phase !== 'string') {
    return null;
  }

  return {
    ...createInitialState(),
    ...candidate,
    roundDeadlineAt: candidate.roundDeadlineAt ?? null,
    players: Array.isArray(candidate.players) ? candidate.players : [],
    questionDeck: Array.isArray(candidate.questionDeck) ? candidate.questionDeck : [],
    pdfs: Array.isArray(candidate.pdfs) ? candidate.pdfs : [],
    timeRemaining:
      typeof candidate.timeRemaining === 'number'
        ? candidate.timeRemaining
        : GAME_CONFIG.questionTimerSeconds,
    timerDuration:
      typeof candidate.timerDuration === 'number'
        ? candidate.timerDuration
        : GAME_CONFIG.questionTimerSeconds,
    totalQuestions:
      typeof candidate.totalQuestions === 'number'
        ? candidate.totalQuestions
        : GAME_CONFIG.defaultQuestionCount,
  };
}

function coerceJoinRequest(value: unknown): JoinRequestPayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as Partial<JoinRequestPayload>;

  if (
    typeof payload.requestId !== 'string'
    || typeof payload.roomCode !== 'string'
    || typeof payload.playerId !== 'string'
    || typeof payload.playerName !== 'string'
  ) {
    return null;
  }

  return payload as JoinRequestPayload;
}

function coerceJoinAck(value: unknown): JoinAckPayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as Partial<JoinAckPayload>;

  if (typeof payload.requestId !== 'string' || typeof payload.ok !== 'boolean') {
    return null;
  }

  return payload as JoinAckPayload;
}

function coerceSubmitAnswer(value: unknown): SubmitAnswerPayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as Partial<SubmitAnswerPayload>;

  if (typeof payload.playerId !== 'string' || typeof payload.answerIndex !== 'number') {
    return null;
  }

  return payload as SubmitAnswerPayload;
}

function coerceLeaveRoom(value: unknown): LeaveRoomPayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as Partial<LeaveRoomPayload>;

  if (typeof payload.playerId !== 'string') {
    return null;
  }

  return payload as LeaveRoomPayload;
}
