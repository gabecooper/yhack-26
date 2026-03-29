import { HostLayout } from '@/shared/components/HostLayout';
import { CharacterAvatar } from '@/shared/components/CharacterAvatar';
import { useGameState } from '@/context/GameContext';
import bankBg from '@/assets/backgrounds/bank.png';

export function ProfileView() {
  const {
    players,
    questionDeck,
    profileAssignments,
    profileResponses,
    activeFriendGroupPackSettings,
  } = useGameState();

  const activePlayers = players.filter(player => !player.isEliminated);
  const profileCount = Math.min(
    activeFriendGroupPackSettings?.numQuestions ?? questionDeck.length,
    questionDeck.length
  );
  const totalExpectedResponses = activePlayers.reduce((sum, player) => {
    const assignedQuestions = profileAssignments[player.id] ?? [];
    return sum + assignedQuestions.length;
  }, 0);
  const submittedResponses = activePlayers.reduce((sum, player) => {
    const answers = profileResponses[player.id] ?? [];
    return sum + answers.length;
  }, 0);

  return (
    <HostLayout backgroundImage={bankBg} minimalSettingsGear>
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="max-w-4xl rounded-[2rem] border border-violet-300/35 bg-black/30 px-10 py-10">
          <p className="font-ui text-xs uppercase tracking-[0.35em] text-violet-200/85">
            Friend Group Survey In Progress
          </p>
          <h2 className="mt-3 font-title text-4xl text-vault-gold">
            Collecting {profileCount} Responses Per Player
          </h2>
          <p className="mt-4 font-ui text-lg text-white/80">
            Players are sending short answers before the main round starts.
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
                  className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-left font-ui text-lg text-white/85"
                >
                  <div className="flex items-center gap-3">
                    <CharacterAvatar
                      characterIndex={player.characterIndex}
                      size={44}
                      isDisconnected={!player.isConnected}
                      isEliminated={player.isEliminated}
                    />
                    <span>
                      {player.name} - {submittedCount} / {assignedCount}
                    </span>
                  </div>
                  <span className={`font-title text-xl ${isComplete ? 'text-vault-gold' : 'text-white/55'}`}>
                    {isComplete ? '✓' : '…'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </HostLayout>
  );
}
