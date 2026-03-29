import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { HostLayout } from '@/shared/components/HostLayout';
import { useAuth } from '@/auth/AuthContext';
import { useAppFlow } from '../AppFlowContext';

export function RealStartView() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { selectFlow, clearFlow } = useAppFlow();

  const handleHostEntry = () => {
    navigate(user ? '/host' : '/auth', {
      state: user ? undefined : { from: { pathname: '/host' } },
    });
  };

  const handleOpenDevFlow = () => {
    selectFlow('dev');
    navigate('/', { replace: true });
  };

  const handleChooseFlow = () => {
    clearFlow();
    navigate('/start', { replace: true });
  };

  return (
    <HostLayout settingsGearSide="left">
      <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="soft-glass-panel grid w-full max-w-6xl gap-6 overflow-hidden rounded-[2.25rem] border border-white/10 p-6 sm:p-8 lg:grid-cols-[1.08fr_0.92fr] lg:p-10"
        >
          <div className="flex flex-col justify-between">
            <div>
              <p className="font-ui text-xs uppercase tracking-[0.34em] text-vault-gold/80">
                Real Flow
              </p>
              <h1 className="mt-4 font-title text-5xl leading-[0.9] text-vault-gold sm:text-6xl">
                Play It Straight
              </h1>
              <p className="mt-5 max-w-2xl font-ui text-lg text-white/68">
                This mode hides the dev phase switcher and runs the heist like a real session. Host a room from the big screen or join from the phone flow.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleOpenDevFlow}
                  className="minimal-button-secondary px-6 py-3 text-base"
                >
                  Open Dev Flow
                </button>
                <button
                  type="button"
                  onClick={handleChooseFlow}
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-ui text-base font-semibold text-white/85 transition-colors hover:bg-white/10"
                >
                  Choose Startup Flow
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
                <p className="font-ui text-xs uppercase tracking-[0.28em] text-white/45">
                  Real Progression
                </p>
                <p className="mt-3 font-ui text-base text-white/72">
                  Questions resolve from timer or submitted answers, then roll into results and the next round automatically.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
                <p className="font-ui text-xs uppercase tracking-[0.28em] text-white/45">
                  Switch Later
                </p>
                <p className="mt-3 font-ui text-base text-white/72">
                  Use the settings gear at any time to come back and swap between real and dev mode.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="font-ui text-xs uppercase tracking-[0.28em] text-white/45">
                Host Screen
              </p>
              <h2 className="mt-3 font-title text-4xl text-white">Start a Room</h2>
              <p className="mt-3 font-ui text-base text-white/72">
                {isLoading
                  ? 'Checking your host session...'
                  : user
                    ? 'You are signed in and ready to launch the lobby.'
                    : 'Sign in first, then create and run the room from the host display.'}
              </p>
              <button
                type="button"
                onClick={handleHostEntry}
                disabled={isLoading}
                className="minimal-button-primary mt-5 w-full py-4 text-lg"
              >
                {isLoading ? 'Loading...' : user ? 'Open Host Screen' : 'Sign In To Host'}
              </button>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="font-ui text-xs uppercase tracking-[0.28em] text-white/45">
                Player Phone
              </p>
              <h2 className="mt-3 font-title text-4xl text-white">Join a Room</h2>
              <p className="mt-3 font-ui text-base text-white/72">
                Enter the room code and play from the phone controller without any debug shortcuts.
              </p>
              <Link
                to="/play"
                className="minimal-button-secondary mt-5 flex w-full justify-center py-4 text-lg"
              >
                Open Player Join
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </HostLayout>
  );
}
