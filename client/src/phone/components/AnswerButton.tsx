import { motion } from 'framer-motion';
import { getAnswerMeta } from '@/constants/gameConfig';

interface AnswerButtonProps {
  index: number;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  selected?: boolean;
}

export function AnswerButton({ index, label, onSelect, disabled = false, selected = false }: AnswerButtonProps) {
  const color = getAnswerMeta(index);

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={onSelect}
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-[1.6rem] border border-white/12 bg-black/20 px-5 py-4 text-left transition-all active:opacity-90 disabled:opacity-50"
      style={{
        borderColor: selected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.12)',
        opacity: disabled && !selected ? 0.5 : 1,
        boxShadow: '0 16px 34px rgba(0, 0, 0, 0.18)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-title text-2xl text-white"
        style={{ backgroundColor: color.bg }}
      >
        {color.label}
      </span>
      <span className="font-ui text-lg font-semibold leading-tight text-white">
        {label}
      </span>
    </motion.button>
  );
}
