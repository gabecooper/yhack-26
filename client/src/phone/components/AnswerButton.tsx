import { motion } from 'framer-motion';
import { ANSWER_COLORS } from '@/constants/gameConfig';

interface AnswerButtonProps {
  index: number;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  selected?: boolean;
}

export function AnswerButton({ index, label, onSelect, disabled = false, selected = false }: AnswerButtonProps) {
  const color = ANSWER_COLORS[index];

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={onSelect}
      disabled={disabled}
      className="w-full rounded-2xl px-5 py-5 flex items-center gap-4 text-left transition-opacity active:opacity-90 disabled:opacity-50"
      style={{
        backgroundColor: color.bg,
        border: selected ? '3px solid white' : '3px solid transparent',
        opacity: disabled && !selected ? 0.5 : 1,
      }}
    >
      <span className="font-title text-3xl text-white/70 shrink-0 w-10 text-center">
        {color.label}
      </span>
      <span className="font-ui font-bold text-lg text-white leading-tight">
        {label}
      </span>
    </motion.button>
  );
}
