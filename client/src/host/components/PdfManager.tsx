import { useGameActions } from '@/context/GameContext';
import type { PdfEntry } from '@/types/game';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import { useGameState } from '@/context/GameContext';

interface PdfManagerProps {
  pdfs: PdfEntry[];
}

const STATUS_BADGE: Record<PdfEntry['status'], { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-600/20 text-yellow-400' },
  approved: { label: 'Approved', color: 'bg-blue-600/20 text-blue-400' },
  processing: { label: 'Processing...', color: 'bg-blue-600/20 text-blue-400' },
  ready: { label: 'Ready', color: 'bg-green-600/20 text-green-400' },
  rejected: { label: 'Rejected', color: 'bg-red-600/20 text-red-400' },
};

export function PdfManager({ pdfs }: PdfManagerProps) {
  const { togglePdf, removePdf, approvePdf, rejectPdf, uploadPdf } = useGameActions();
  const { players } = useGameState();

  const handleUploadClick = () => {
    const name = `Study Material ${pdfs.length + 1}.pdf`;
    uploadPdf(name, null);
  };

  return (
    <div className="space-y-3">
      {pdfs.map(pdf => {
        const badge = STATUS_BADGE[pdf.status];
        const uploader = pdf.uploadedBy
          ? players.find(p => p.id === pdf.uploadedBy)
          : null;

        return (
          <div
            key={pdf.id}
            className="group relative rounded-[1.4rem] border border-white/15 bg-white/5 px-4 py-3 pr-12"
          >
            <button
              onClick={() => removePdf(pdf.id)}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#975a16]/80 bg-[#1a202c]/85 font-ui text-sm font-bold leading-none text-[#f3c77a] opacity-0 transition-all hover:border-[#ecc94b] hover:bg-[#2d3748] hover:text-[#fde68a] group-hover:opacity-100"
              aria-label={`Remove ${pdf.filename}`}
            >
              ×
            </button>

            <div className="mb-2 flex items-center gap-2">
              {uploader && (
                <CharacterAvatar characterIndex={uploader.characterIndex} size={20} />
              )}
              <span className="flex-1 truncate font-ui text-sm text-white">
                {pdf.filename}
              </span>
              <span className={`rounded-full px-2 py-0.5 font-ui text-xs ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {pdf.status === 'ready' && (
                <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={pdf.enabled}
                    onChange={e => togglePdf(pdf.id, e.target.checked)}
                    className="w-4 h-4 accent-vault-gold"
                  />
                  <span className="font-ui text-xs text-[#f3c77a]">
                    {pdf.questionCount} questions
                  </span>
                </label>
              )}

              {pdf.status === 'pending' && (
                <>
                  <button
                    onClick={() => approvePdf(pdf.id)}
                    className="rounded-full bg-vault-green/20 px-3 py-1.5 font-ui text-xs text-vault-green hover:bg-vault-green/30"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectPdf(pdf.id)}
                    className="rounded-full bg-vault-red/20 px-3 py-1.5 font-ui text-xs text-vault-red hover:bg-vault-red/30"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

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
