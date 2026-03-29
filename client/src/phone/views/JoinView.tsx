import { useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneLayout } from '@/shared/components/PhoneLayout';
import { useGameActions } from '@/context/GameContext';
import { GAME_CONFIG } from '@/constants/gameConfig';

const PLAYER_NAME_STORAGE_KEY = 'heist_player_name';
const ROOM_CODE_STORAGE_KEY = 'heist_room_code';

interface JoinViewProps {
  onJoin: (playerId: string) => void;
}

export function JoinView({ onJoin }: JoinViewProps) {
  const storedPlayerName = window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY)?.slice(0, 16) ?? '';
  const [roomCode, setRoomCode] = useState(() =>
    window.localStorage.getItem(ROOM_CODE_STORAGE_KEY)?.toUpperCase().slice(0, GAME_CONFIG.roomCodeLength) ?? ''
  );
  const [playerName, setPlayerName] = useState(() =>
    storedPlayerName
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const { joinRoom } = useGameActions();
  const effectivePlayerName = playerName.trim() || storedPlayerName;

  const canJoin =
    roomCode.length === GAME_CONFIG.roomCodeLength
    && effectivePlayerName.length > 0
    && !isJoining;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canJoin) return;
    setErrorMessage(null);
    setIsJoining(true);

    window.localStorage.setItem(ROOM_CODE_STORAGE_KEY, roomCode.toUpperCase());
    window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, effectivePlayerName);

    const id = await joinRoom(roomCode.toUpperCase(), effectivePlayerName);
    setIsJoining(false);

    if (!id) {
      setErrorMessage('That room code is not active right now.');
      return;
    }

    onJoin(id);
  };

  return (
    <PhoneLayout contentClassName="justify-center">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <p className="font-ui text-xs uppercase tracking-[0.35em] text-white/65">
            Join The Crew
          </p>
          <h1 className="mt-3 font-title text-5xl leading-[0.92] text-vault-gold drop-shadow-lg">
            R.A.C.O.O.N.
          </h1>
          <p className="mt-3 font-ui text-base uppercase tracking-[0.18em] text-white/80 [text-wrap:balance]">
            Risk Arbitrage &amp; Chaotic Odds Ops Network
          </p>
          <p className="mt-5 font-ui text-base text-white/60">
            Enter the host code and your name to join.
          </p>
          {storedPlayerName && (
            <p className="mt-2 font-ui text-sm text-white/50">
              Re-enter the same code to reclaim your spot as {storedPlayerName}.
            </p>
          )}
        </motion.div>

        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          onSubmit={handleSubmit}
          className="soft-glass-panel mt-8 flex w-full flex-col gap-4 rounded-[2rem] p-5"
        >
          <div className="space-y-2">
            <label className="block font-ui text-xs uppercase tracking-[0.24em] text-white/55">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={e => {
                const nextRoomCode = e.target.value.toUpperCase().slice(0, GAME_CONFIG.roomCodeLength);
                setRoomCode(nextRoomCode);
                window.localStorage.setItem(ROOM_CODE_STORAGE_KEY, nextRoomCode);
              }}
              placeholder="ABCD"
              maxLength={GAME_CONFIG.roomCodeLength}
              className="minimal-input text-center font-title text-4xl tracking-[0.38em] text-vault-gold placeholder:text-white/20"
              autoFocus
              inputMode="text"
              autoComplete="off"
              disabled={isJoining}
            />
          </div>

          <div className="space-y-2">
            <label className="block font-ui text-xs uppercase tracking-[0.24em] text-white/55">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={e => {
                const nextPlayerName = e.target.value.slice(0, 16);
                setPlayerName(nextPlayerName);
                window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, nextPlayerName);
              }}
              placeholder="Enter name..."
              maxLength={16}
              className="minimal-input text-center font-ui text-xl"
              autoComplete="off"
              disabled={isJoining}
            />
          </div>

          <button
            type="submit"
            disabled={!canJoin}
            data-button-click-sound="accent"
            className="minimal-button-primary mt-2 w-full py-4 text-lg"
          >
            {isJoining ? 'Searching...' : 'Join Room'}
          </button>

          {errorMessage && (
            <p className="rounded-[1.2rem] border border-vault-red/35 bg-vault-red/10 px-4 py-3 text-center font-ui text-sm text-white/85">
              {errorMessage}
            </p>
          )}
        </motion.form>
      </div>
    </PhoneLayout>
  );
}
