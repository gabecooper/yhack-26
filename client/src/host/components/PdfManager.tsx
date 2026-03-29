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
    <div className="space-y-0">
      {pdfs.map(pdf => {
        const badge = STATUS_BADGE[pdf.status];
        const uploader = pdf.uploadedBy
          ? players.find(p => p.id === pdf.uploadedBy)
          : null;

        return (
          <div
            key={pdf.id}
            className="group relative border-b border-white/15 py-4 pr-8"
          >
            <button
              onClick={() => removePdf(pdf.id)}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#975a16]/80 bg-[#1a202c]/85 font-ui text-sm font-bold leading-none text-[#f3c77a] opacity-0 transition-all hover:border-[#ecc94b] hover:bg-[#2d3748] hover:text-[#fde68a] group-hover:opacity-100"
              aria-label={`Remove ${pdf.filename}`}
            >
              ×
            </button>

            <div className="flex items-center gap-2 mb-2">
              {uploader && (
                <CharacterAvatar characterIndex={uploader.characterIndex} size={20} />
              )}
              <span className="font-ui text-sm text-white truncate flex-1">
                {pdf.filename}
              </span>
              <span className={`font-ui text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {pdf.status === 'ready' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdf.enabled}
                    onChange={e => togglePdf(pdf.id, e.target.checked)}
                    className="w-4 h-4 accent-vault-gold"
                  />
                  <span className="font-ui text-xs text-gray-400">
                    {pdf.questionCount} questions
                  </span>
                </label>
              )}

              {pdf.status === 'pending' && (
                <>
                  <button
                    onClick={() => approvePdf(pdf.id)}
                    className="font-ui text-xs px-2 py-1 rounded bg-vault-green/20 text-vault-green hover:bg-vault-green/30"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectPdf(pdf.id)}
                    className="font-ui text-xs px-2 py-1 rounded bg-vault-red/20 text-vault-red hover:bg-vault-red/30"
                  >
                    Reject
                  </button>
                </>
              )}

              <div className="flex-1" />
            </div>
          </div>
        );
      })}

      <button
        onClick={handleUploadClick}
        className="mt-2 w-full border-b border-dashed border-white/20 py-4 text-left transition-colors hover:border-white/40"
      >
        <span className="font-ui text-sm text-gray-300">+ Upload coursework</span>
      </button>
    </div>
  );
}
