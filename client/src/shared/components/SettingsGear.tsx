import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useAppFlow } from '@/app/AppFlowContext';
import { useGameActions, useGameState } from '@/context/GameContext';

interface SettingsGearProps {
  minimal?: boolean;
  side?: 'left' | 'right';
}

export function SettingsGear({ minimal = false, side = 'right' }: SettingsGearProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEndingGame, setIsEndingGame] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { flow, clearFlow } = useAppFlow();
  const { roomCode } = useGameState();
  const { setPhase } = useGameActions();
  const isHostRoute = location.pathname.startsWith('/host');
  const canEndGame = isHostRoute && Boolean(roomCode);
  const gearPositionStyle =
    side === 'left'
      ? {
          top: 'max(1rem, calc(env(safe-area-inset-top) + 0.75rem))',
          left: '1rem',
        }
      : {
          top: 'max(1rem, calc(env(safe-area-inset-top) + 0.75rem))',
          right: '1rem',
        };

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Unable to sign out cleanly', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSwitchFlow = () => {
    clearFlow();
    setIsOpen(false);
    navigate('/start');
  };

  const handleEndGame = async () => {
    setIsEndingGame(true);

    try {
      setPhase('home');
      setIsOpen(false);
    } finally {
      setIsEndingGame(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-50 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          minimal
            ? 'border border-white/10 bg-black/10 backdrop-blur-sm hover:bg-black/20'
            : 'border border-white/10 bg-black/30 backdrop-blur-md hover:bg-black/40'
        }`}
        style={gearPositionStyle}
        aria-label="Settings"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              aria-label="Close settings"
              onClick={() => setIsOpen(false)}
            />
            <div className="relative mx-4 w-full max-w-sm rounded-3xl border border-black/10 bg-[#e5e7eb] p-8 text-[#1a202c] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <h2 className="mb-6 font-title text-3xl text-[#1a202c]">Settings</h2>
              <div className="space-y-4 font-ui text-[#1a202c]">
                <label className="flex items-center justify-between">
                  <span className="text-lg">Sound Effects</span>
                  <input type="checkbox" defaultChecked className="h-5 w-5 accent-vault-gold" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-lg">Music</span>
                  <input type="checkbox" defaultChecked className="h-5 w-5 accent-vault-gold" />
                </label>
              </div>
              <div className="mt-6 rounded-2xl bg-black/5 px-4 py-3 font-ui">
                <p className="text-xs uppercase tracking-[0.24em] text-[#4a5568]">Startup Flow</p>
                <p className="mt-2 text-base font-semibold capitalize">
                  {flow ?? 'Not selected'}
                </p>
                <button
                  type="button"
                  onClick={handleSwitchFlow}
                  className="mt-4 w-full rounded-xl border border-[#1a202c]/10 bg-white px-4 py-3 text-base font-semibold text-[#1a202c] transition-colors hover:bg-[#f7fafc]"
                >
                  Switch Flow
                </button>
              </div>
              {canEndGame && (
                <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 font-ui">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#7f1d1d]">Host Controls</p>
                  <p className="mt-2 text-sm text-[#991b1b]">
                    End the current game and send everyone back to the home screen.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void handleEndGame();
                    }}
                    disabled={isEndingGame}
                    className="mt-4 w-full rounded-xl border border-[#7f1d1d]/10 bg-[#991b1b] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#7f1d1d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isEndingGame ? 'Ending Game...' : 'End Game'}
                  </button>
                </div>
              )}
              {user && (
                <div className="mt-6 rounded-2xl bg-black/5 px-4 py-3 font-ui">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#4a5568]">Signed In</p>
                  <p className="mt-2 text-base font-semibold break-all">{user.email}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void handleSignOut();
                    }}
                    disabled={isSigningOut}
                    className="mt-4 w-full rounded-xl border border-[#1a202c]/10 bg-[#1a202c] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                  </button>
                </div>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="mt-6 w-full rounded-xl bg-vault-gold px-6 py-3 font-ui text-lg font-bold text-[#1a202c] transition-colors hover:bg-[#ecc94b]"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
