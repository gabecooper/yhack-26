import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HostLayout } from '@/shared/components/HostLayout';
import { useAppFlow, type AppFlow } from '../AppFlowContext';

const FLOW_OPTIONS: Array<{
  flow: AppFlow;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  action: string;
}> = [
  {
    flow: 'dev',
    eyebrow: 'Sandbox',
    title: 'Dev Flow',
    description: 'Keep the current setup with route access and the phase switcher for rapid iteration.',
    bullets: [
      'Debug phase bar stays on screen',
      'Jump between views instantly',
      'Best for design and QA',
    ],
    action: 'Open Dev Flow',
  },
  {
    flow: 'real',
    eyebrow: 'Playtest',
    title: 'Real Flow',
    description: 'Run the app like a player-facing experience with no debug controls and real progression.',
    bullets: [
      'No dev phase switcher',
      'Start from host or join entry',
      'Question rounds advance automatically',
    ],
    action: 'Open Real Flow',
  },
];

export function StartFlowView() {
  const navigate = useNavigate();
  const { selectFlow } = useAppFlow();

  const handleSelect = (flow: AppFlow) => {
    selectFlow(flow);
    navigate(flow === 'dev' ? '/' : '/real', { replace: true });
  };

  return (
    <HostLayout settingsGearSide="left">
      <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="soft-glass-panel w-full max-w-6xl rounded-[2.4rem] border border-white/10 p-6 sm:p-8 lg:p-10"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-ui text-xs uppercase tracking-[0.34em] text-vault-gold/80">
              Choose Startup Flow
            </p>
            <h1 className="mt-4 font-title text-5xl leading-[0.9] text-vault-gold sm:text-6xl lg:text-7xl">
              R.A.C.C.O.O.N.
            </h1>
            <p className="mt-4 font-ui text-lg uppercase tracking-[0.16em] text-white/78 [text-wrap:balance]">
              Risk Arbitrage Calibration &amp; Chaotic Odds Ops Network
            </p>
            <p className="mt-6 font-ui text-lg text-white/68">
              Pick the flow you want on launch. Dev keeps the current debug-driven setup. Real starts the app as a player-facing playtest.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {FLOW_OPTIONS.map((option, index) => (
              <motion.div
                key={option.flow}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-black/25 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
              >
                <p className="font-ui text-xs uppercase tracking-[0.28em] text-white/45">
                  {option.eyebrow}
                </p>
                <h2 className="mt-3 font-title text-4xl text-white">{option.title}</h2>
                <p className="mt-4 font-ui text-base text-white/72">{option.description}</p>

                <div className="mt-6 flex flex-1 flex-col gap-3">
                  {option.bullets.map(bullet => (
                    <div
                      key={bullet}
                      className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 font-ui text-sm text-white/75"
                    >
                      {bullet}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleSelect(option.flow)}
                  className="minimal-button-primary mt-8 w-full py-4 text-lg"
                >
                  {option.action}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </HostLayout>
  );
}
