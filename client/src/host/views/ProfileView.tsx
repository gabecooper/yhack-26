import { HostLayout } from '@/shared/components/HostLayout';
import { useGameState } from '@/context/GameContext';
import v4RoofBg from '@/assets/optimized/v4roof.webp';

export function ProfileView() {
  const { players, questionDeck, profileAssignments, profileResponses } = useGameState();

  const activePlayers = players.filter(player => !player.isEliminated);
  const profileCount = Math.min(3, questionDeck.length);
  const totalExpectedResponses = activePlayers.reduce((sum, player) => {
    const assignedQuestions = profileAssignments[player.id] ?? [];
    return sum + assignedQuestions.length;
  }, 0);
  const submittedResponses = activePlayers.reduce((sum, player) => {
    const answers = profileResponses[player.id] ?? [];
    return sum + answers.length;
  }, 0);

  return (
    <HostLayout backgroundImage={v4RoofBg} minimalSettingsGear>
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="max-w-4xl rounded-[2rem] border border-violet-300/35 bg-black/30 px-10 py-10">
          <p className="font-ui text-xs uppercase tracking-[0.35em] text-violet-200/85">
            Friend Group Survey In Progress
          </p>
          <h2 className="mt-3 font-title text-4xl text-vault-gold">
            Collecting {profileCount} Preferences Per Player
          </h2>
          <p className="mt-4 font-ui text-lg text-white/80">
            Players are answering a few quick questions before the main round starts.
          </p>

          <p className="mx-auto mt-8 max-w-3xl font-ui text-2xl text-white">
            {submittedResponses} / {totalExpectedResponses} responses submitted
          </p>

          <div className="mx-auto mt-8 grid w-full max-w-3xl grid-cols-1 gap-3">
            {activePlayers.map(player => {
              const assignedCount = profileAssignments[player.id]?.length ?? profileCount;
              const submittedCount = profileResponses[player.id]?.length ?? 0;
              const isComplete = assignedCount > 0 && submittedCount >= assignedCount;

              return (
                <div
                  key={player.id}
                  className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-left font-ui text-lg text-white/85"
                >
                  <span className="mr-3 font-title text-vault-gold">
                    {isComplete ? '✓' : '…'}
                  </span>
                  {player.name} - {submittedCount} / {assignedCount}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </HostLayout>
  );
}
