import { useGameActions } from '@/context/GameContext';
import type { PdfEntry } from '@/types/game';

interface PdfManagerProps {
  pdfs: PdfEntry[];
}

const COURSEWORK_PILL_CLASS =
  'inline-flex min-h-10 items-center justify-center rounded-full border px-3 py-2 font-ui text-sm transition-colors';

const getCourseworkDisplayName = (filename: string) => filename.replace(/\.[^/.]+$/, '');

export function PdfManager({ pdfs }: PdfManagerProps) {
  const { togglePdf, uploadPdf } = useGameActions();

  const handleUploadClick = () => {
    const name = `Study Material ${pdfs.length + 1}.pdf`;
    uploadPdf(name, null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {pdfs.map(pdf => {
          const isSelectable = pdf.status === 'ready';

          return (
            <button
              key={pdf.id}
              type="button"
              onClick={() => isSelectable && togglePdf(pdf.id, !pdf.enabled)}
              disabled={!isSelectable}
              aria-pressed={isSelectable ? pdf.enabled : undefined}
              className={`${COURSEWORK_PILL_CLASS} ${
                pdf.enabled && isSelectable
                  ? 'border-[#f59e0b]/45 bg-[#f59e0b]/18 text-[#f7c87b]'
                  : 'border-white/15 text-white/85 hover:border-white/35 hover:bg-white/5'
              } ${!isSelectable ? 'cursor-not-allowed opacity-50 hover:border-white/15 hover:bg-transparent' : ''}`}
            >
              {getCourseworkDisplayName(pdf.filename)}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleUploadClick}
        className="flex h-[4.25rem] w-full items-center rounded-[1.4rem] border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 text-left transition-colors hover:border-[#f59e0b]/50 hover:bg-[#f59e0b]/14"
      >
        <span className="font-ui text-sm font-semibold uppercase tracking-[0.14em] text-[#f3c77a]">
          + Upload coursework
        </span>
      </button>
    </div>
  );
}
