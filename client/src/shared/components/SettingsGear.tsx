import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsGearProps {
  minimal?: boolean;
  side?: 'left' | 'right';
}

export function SettingsGear({ minimal = false, side = 'right' }: SettingsGearProps) {
  const [isOpen, setIsOpen] = useState(false);
  const positionClass = side === 'left' ? 'left-4' : 'right-4';

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 ${positionClass} z-50 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
          minimal
            ? 'bg-transparent border-transparent hover:bg-black/15'
            : 'bg-vault-dark/80 border border-vault-steel hover:bg-vault-steel/50'
        }`}
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
