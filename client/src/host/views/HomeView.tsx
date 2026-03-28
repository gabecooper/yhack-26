import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HostLayout } from '@/shared/components/HostLayout';
import { useGameActions, useGameState } from '@/context/GameContext';
import lobbyBackground from '../../../../lobbyv2.png';

export function HomeView() {
  const navigate = useNavigate();
  const { pdfs } = useGameState();
  const { createRoom, uploadPdf } = useGameActions();

  const handleUploadPdf = () => {
    uploadPdf(`Study Material ${pdfs.length + 1}.pdf`, null);
  };

  return (
    <HostLayout showBackground={false}>
      <div className="relative flex-1 overflow-hidden">
        <img
          src={lobbyBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl text-center"
          >
            <h1 className="font-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-vault-gold drop-shadow-lg leading-[0.9] tracking-[0.08em] [text-wrap:balance]">
              R.A.C.O.O.N.
            </h1>
            <p className="mt-3 max-w-3xl font-ui text-lg sm:text-xl md:text-2xl uppercase tracking-[0.18em] text-white drop-shadow-md [text-wrap:balance]">
              Risk Arbitrage &amp; Chaotic Odds Ops Network
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <button onClick={createRoom} className="vault-button w-72 text-xl py-4">
              Create Room
            </button>
            <button
              onClick={() => navigate('/play')}
              className="vault-button-secondary w-72 text-xl py-4"
            >
              Join Room
            </button>
            <button onClick={handleUploadPdf} className="vault-button-secondary w-72 text-xl py-4">
              Upload PDF
            </button>
          </motion.div>
        </div>
      </div>
    </HostLayout>
  );
}
