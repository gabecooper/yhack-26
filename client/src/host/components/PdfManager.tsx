import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/auth/AuthContext';
import { useGameActions } from '@/context/GameContext';
import {
  createCustomQuestionPack,
  deleteCustomQuestionPack,
} from '@/services/customQuestionPacks';
import { extractTextFromCustomPackFile } from '@/services/customPackFileText';
import { generateCustomPackQuestionsDetailed } from '@/services/customPackQuestionGeneration';
import { useAudioSettings } from '@/shared/context/AudioSettingsContext';
import { playSelectionDing } from '@/shared/services/selectionDing';
import type { CustomQuestionPack } from '@/types/game';

interface PdfManagerProps {
  packs: CustomQuestionPack[];
}

const COURSEWORK_PILL_CLASS =
  'inline-flex min-h-10 items-center justify-center rounded-full border px-3 py-2 font-ui text-sm transition-colors';

const getCourseworkDisplayName = (filename: string) => filename.replace(/\.[^/.]+$/, '');

interface PendingEmptyDocumentConfirmation {
  file: File;
  label: string;
  text: string;
  sourceKind: 'pdf' | 'txt';
  exceededLimit: boolean;
  convertedFilename: string;
  wasConvertedFromPdf: boolean;
  rawTextLength: number;
  extractedTextLength: number;
  pdfPageCount: number | null;
  isLikelyImageOnlyPdf: boolean;
}

function shouldConfirmEmptyDocument({
  rawTextLength,
  isLikelyImageOnlyPdf,
}: Pick<PendingEmptyDocumentConfirmation, 'rawTextLength' | 'isLikelyImageOnlyPdf'>) {
  return rawTextLength < 20 || isLikelyImageOnlyPdf;
}

export function PdfManager({ packs }: PdfManagerProps) {
  const { user } = useAuth();
  const { toggleCustomPack, upsertCustomPack, removeCustomPack } = useGameActions();
  const { soundEffectsEnabled } = useAudioSettings();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingLabel, setProcessingLabel] = useState<string | null>(null);
  const [deletingPackId, setDeletingPackId] = useState<string | null>(null);
  const [pendingDeletePackId, setPendingDeletePackId] = useState<string | null>(null);
  const [pendingEmptyDocumentConfirmation, setPendingEmptyDocumentConfirmation] =
    useState<PendingEmptyDocumentConfirmation | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pendingDeletePack = packs.find(pack => pack.id === pendingDeletePackId) ?? null;

  const finishUpload = async (pendingUpload: PendingEmptyDocumentConfirmation) => {
    if (!user) {
      setErrorMessage('Sign in to save and equip coursework packs.');
      setStatusMessage(null);
      return;
    }

    setStatusMessage(
      pendingUpload.exceededLimit
        ? `Generating questions for ${pendingUpload.label} from sampled sections of the converted text...`
        : pendingUpload.wasConvertedFromPdf
          ? `Converted ${pendingUpload.label} to text. Generating questions...`
          : `Generating questions for ${pendingUpload.label}...`
    );

    const generationResult = await generateCustomPackQuestionsDetailed({
      filename: pendingUpload.convertedFilename,
      label: pendingUpload.label,
      sourceType: 'transcript',
      text: pendingUpload.text,
    });
    const savedPack = await createCustomQuestionPack({
      userId: user.id,
      filename: pendingUpload.file.name,
      label: pendingUpload.label,
      sourceType: 'transcript',
      sourceKind: pendingUpload.sourceKind,
      questions: generationResult.questions,
    });

    upsertCustomPack({ ...savedPack, enabled: true });
    setStatusMessage(null);
  };

  const handleUploadClick = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!user) {
      setErrorMessage('Sign in to save and equip coursework packs.');
      return;
    }

    const normalizedFileName = file.name.toLowerCase();

    if (!normalizedFileName.endsWith('.pdf') && !normalizedFileName.endsWith('.txt')) {
      setErrorMessage('Only PDF and TXT files are supported for coursework uploads.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setProcessingLabel(getCourseworkDisplayName(file.name));

    try {
      const extracted = await extractTextFromCustomPackFile(file);
      const pendingUpload = {
        ...extracted,
        file,
        label: getCourseworkDisplayName(file.name),
      };

      if (shouldConfirmEmptyDocument(pendingUpload)) {
        setPendingEmptyDocumentConfirmation(pendingUpload);
        setStatusMessage(null);
        return;
      }

      await finishUpload(pendingUpload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to create a coursework pack right now.'
      );
      setStatusMessage(null);
    } finally {
      setIsUploading(false);
      setProcessingLabel(null);
    }
  };

  const handleKeepEmptyDocument = async () => {
    if (!pendingEmptyDocumentConfirmation) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setProcessingLabel(pendingEmptyDocumentConfirmation.label);

    try {
      await finishUpload(pendingEmptyDocumentConfirmation);
      setPendingEmptyDocumentConfirmation(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to create a coursework pack right now.'
      );
      setStatusMessage(null);
    } finally {
      setIsUploading(false);
      setProcessingLabel(null);
    }
  };

  const handleDeletePack = async () => {
    if (!user || !pendingDeletePack) {
      return;
    }

    setDeletingPackId(pendingDeletePack.id);
    setErrorMessage(null);
    setStatusMessage(`Deleting ${getCourseworkDisplayName(pendingDeletePack.filename)}...`);

    try {
      await deleteCustomQuestionPack(user.id, pendingDeletePack.id);
      removeCustomPack(pendingDeletePack.id);
      setPendingDeletePackId(null);
      setStatusMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to delete that coursework pack right now.'
      );
      setStatusMessage(null);
    } finally {
      setDeletingPackId(null);
    }
  };

  return (
    <div className="space-y-3">
      {packs.length > 0 && (
        <div className="space-y-2">
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Saved Packs
          </p>
          <div className="flex flex-wrap gap-2">
            {packs.map(pack => {
              const isDeleting = deletingPackId === pack.id;

              return (
                <div key={pack.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (soundEffectsEnabled) {
                        playSelectionDing();
                      }

                      toggleCustomPack(pack.id, !pack.enabled);
                    }}
                    disabled={isDeleting}
                    aria-pressed={pack.enabled}
                    className={`${COURSEWORK_PILL_CLASS} group-hover:pr-9 transition-[padding,color,border-color,background-color,opacity] duration-200 ${
                      pack.enabled
                        ? 'border-[#f59e0b]/45 bg-[#f59e0b]/18 text-[#f7c87b]'
                        : 'border-white/15 text-white/85 hover:border-white/35 hover:bg-white/5'
                    } ${isDeleting ? 'cursor-wait opacity-60' : ''}`}
                  >
                    {getCourseworkDisplayName(pack.filename)}
                  </button>

                  <button
                    type="button"
                    aria-label={`Delete ${getCourseworkDisplayName(pack.filename)}`}
                    onClick={event => {
                      event.stopPropagation();
                      setErrorMessage(null);
                      setStatusMessage(null);
                      setPendingDeletePackId(pack.id);
                    }}
                    disabled={isDeleting}
                    className="pointer-events-none invisible absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/35 font-ui text-xs font-bold uppercase text-white/70 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 hover:border-white/25 hover:bg-black/55 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    x
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleUploadClick}
        disabled={isUploading}
        className="max-w-full whitespace-normal break-words rounded-full border border-dashed border-white/25 bg-white/5 px-4 py-2 text-center font-ui text-sm text-gray-300 transition-colors hover:border-white/45 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Upload coursework
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,text/plain,application/pdf"
        className="hidden"
        onChange={event => {
          void handleFileChange(event);
        }}
      />

      <AnimatePresence>
        {pendingEmptyDocumentConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/65"
              aria-label="Cancel empty document confirmation"
              onClick={() => {
                if (!isUploading) {
                  setPendingEmptyDocumentConfirmation(null);
                  setStatusMessage(null);
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative mx-4 w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#10151f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.38)]"
            >
              <p className="font-ui text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                Empty Document
              </p>
              <p className="mt-3 font-ui text-lg leading-relaxed text-white/88">
                {getCourseworkDisplayName(pendingEmptyDocumentConfirmation.file.name)} looks empty or has almost no extractable text.
              </p>
              <p className="mt-2 font-ui text-sm text-white/52">
                Keep it anyway and save a fallback pack, or cancel and upload a different file.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void handleKeepEmptyDocument();
                  }}
                  disabled={isUploading}
                  className="flex-1 rounded-full border border-vault-gold/25 bg-vault-gold px-4 py-3 font-ui text-sm font-semibold uppercase tracking-[0.18em] text-[#10151f] transition-colors hover:bg-[#f7c87b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Keep It
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingEmptyDocumentConfirmation(null);
                    setStatusMessage(null);
                  }}
                  disabled={isUploading}
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 font-ui text-sm font-semibold uppercase tracking-[0.18em] text-white/82 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {pendingDeletePack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/65"
              aria-label="Cancel delete coursework pack"
              onClick={() => {
                if (deletingPackId === null) {
                  setPendingDeletePackId(null);
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative mx-4 w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#10151f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.38)]"
            >
              <p className="font-ui text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                Delete Coursework Pack
              </p>
              <p className="mt-3 font-ui text-lg leading-relaxed text-white/88">
                Delete <span className="font-semibold">{getCourseworkDisplayName(pendingDeletePack.filename)}</span> from your saved coursework packs?
              </p>
              <p className="mt-2 font-ui text-sm text-white/52">
                This permanently removes it from your account.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void handleDeletePack();
                  }}
                  disabled={deletingPackId !== null}
                  className="rounded-full border border-red-500/20 bg-red-600 px-5 py-2.5 font-ui text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingPackId === pendingDeletePack.id ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeletePackId(null)}
                  disabled={deletingPackId !== null}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 font-ui text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isUploading && processingLabel && (
        <div className="flex flex-wrap gap-2">
          <div className={`${COURSEWORK_PILL_CLASS} relative overflow-hidden border-white/15 bg-white/5 px-4 text-white/72`}>
            <span className="relative block text-transparent">
              {processingLabel}
            </span>
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 font-ui text-sm text-white/52">
              {processingLabel}
            </span>
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 font-ui text-sm font-medium text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.98) 48%, rgba(255,255,255,0) 100%)',
                backgroundSize: '220px 100%',
                backgroundRepeat: 'no-repeat',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
              }}
              initial={{ backgroundPositionX: '-220px' }}
              animate={{ backgroundPositionX: ['-220px', '220px'] }}
              transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
            >
              {processingLabel}
            </motion.span>
          </div>
        </div>
      )}

      {!isUploading && statusMessage && (
        <p className="rounded-[1rem] border border-vault-green/20 bg-vault-green/10 px-4 py-3 font-ui text-sm text-white/82">
          {statusMessage}
        </p>
      )}

      {errorMessage && (
        <p className="rounded-[1rem] border border-vault-red/20 bg-vault-red/10 px-4 py-3 font-ui text-sm text-white/82">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
