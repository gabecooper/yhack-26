import { useState, type Dispatch, type SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { HostLayout } from '@/shared/components/HostLayout';
import { useAppFlow } from '@/app/AppFlowContext';
import { POLYMARKET_CATEGORIES, getPolymarketCategoryName } from '@/services/polymarket/categories';
import { PdfManager } from '../components/PdfManager';
import { useGameState, useGameActions } from '@/context/GameContext';
import { GAME_CONFIG } from '@/constants/gameConfig';
import brownStudent from '@/assets/characters/brown-student.png';
import harvardInfluencer from '@/assets/characters/harvard-influencer.png';
import mitFounder from '@/assets/characters/mit-founder.png';
import princetonNerd from '@/assets/characters/princeton-nerd.png';
import stanfordRaccoon from '@/assets/characters/stanford-raccoon.png';
import whartonRaccoon from '@/assets/characters/wharton-raccoon.png';
import yalePortrait from '@/assets/characters/yale-portrait.png';

const SCHOOL_CREW = [
  { label: 'Brown', image: brownStudent, scale: 1 },
  { label: 'Harvard', image: harvardInfluencer, scale: 2 },
  { label: 'MIT', image: mitFounder, scale: 2 },
  { label: 'Princeton', image: princetonNerd, scale: 2 },
  { label: 'Stanford', image: stanfordRaccoon, scale: 2 },
  { label: 'Wharton', image: whartonRaccoon, scale: 2 },
  { label: 'Yale', image: yalePortrait, scale: 2 },
];

const FRIEND_GROUP_PACKS = [
  'Inside jokes',
  'Who said it?',
  'Campus lore',
];

type ScrapSectionId = 'polymarket' | 'coursework' | 'friends';

const getCourseworkDisplayName = (filename: string) => filename.replace(/\.[^/.]+$/, '');
const INITIAL_OPEN_SCRAP_SECTIONS: Record<ScrapSectionId, boolean> = {
  polymarket: false,
  coursework: true,
  friends: false,
};

export function RoomView() {
  const { roomCode, players, pdfs, isPreparingGame } = useGameState();
  const { startGame, simulateDevPlayerJoin } = useGameActions();
  const { flow } = useAppFlow();
  const [openScrapSections, setOpenScrapSections] = useState(INITIAL_OPEN_SCRAP_SECTIONS);
  const [selectedPolymarket, setSelectedPolymarket] = useState<string[]>([]);
  const [selectedFriendPacks, setSelectedFriendPacks] = useState<string[]>([]);
  const isDevMode = flow === 'dev';

  const hasPlayers = players.length >= GAME_CONFIG.minPlayers;
  const hasReadyPdfs = pdfs.some(p => p.status === 'ready' && p.enabled);
  const hasLivePolymarketSelections = selectedPolymarket.length > 0;
  const canStart = hasPlayers && (hasReadyPdfs || hasLivePolymarketSelections) && !isPreparingGame;
  const selectedCoursework = pdfs
    .filter(pdf => pdf.enabled)
    .map(pdf => getCourseworkDisplayName(pdf.filename));
  const selectedMaterials = [
    ...selectedPolymarket.map(getPolymarketCategoryName),
    ...selectedCoursework,
    ...selectedFriendPacks,
  ];
  const playerSlots = Array.from({ length: GAME_CONFIG.maxPlayers }, (_unused, slotIndex) => {
    const player = players.find(candidate => candidate.characterIndex === slotIndex) ?? null;
    const crewMember = SCHOOL_CREW[slotIndex % SCHOOL_CREW.length];

    return {
      player,
      crewMember,
      key: player?.id ?? `open-slot-${slotIndex}`,
    };
  });

  const toggleSelection = (
    value: string,
    setSelected: Dispatch<SetStateAction<string[]>>
  ) => {
    setSelected(current =>
      current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value]
    );
  };

  const toggleScrapSection = (sectionId: ScrapSectionId) => {
    setOpenScrapSections(current => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  return (
    <HostLayout settingsGearSide="right">
      <div className="relative flex flex-1 flex-col gap-6 overflow-hidden p-8">
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
          {roomCode.split('').map((char, index) => (
            <div
              key={`${char}-${index}`}
              className="vault-panel flex h-10 w-10 items-center justify-center rounded-lg font-title text-xl tracking-widest text-[#f59e0b]"
            >
              {char}
            </div>
          ))}
        </div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center gap-5 pt-2 text-center"
        >
          <div>
            <h1 className="font-title text-5xl text-vault-gold">Lobby</h1>
            <p className="mt-1 font-ui text-gray-400">Waiting for players to join...</p>
          </div>
        </motion.div>

        <div className="flex min-h-0 flex-1 gap-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex h-full min-h-0 w-[24rem] flex-col px-2 pt-4"
          >
            <div className="mb-5">
              <div className="flex flex-col items-center">
                <h2 className="font-title text-2xl text-white">Materials</h2>
                <div className="mt-1.5 h-px w-1/2 bg-white/80" />
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {selectedMaterials.length > 0 &&
                selectedMaterials.map(item => (
                  <span
                    key={item}
                    className="inline-flex items-center justify-center rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1 text-center font-ui text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f3c77a]"
                  >
                    {item}
                  </span>
                ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 gap-3">
              <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <button
                  type="button"
                  onClick={() => toggleScrapSection('polymarket')}
                  className="flex w-full items-start justify-between px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="font-ui text-sm font-bold uppercase tracking-[0.25em] text-white/90">
                      Polymarket
                    </h3>
                    <p className="mt-1 font-ui text-sm text-gray-400">
                      Build from live market categories.
                    </p>
                  </div>
                  <span className="font-ui text-xl leading-none text-white/70">
                    {openScrapSections.polymarket ? '−' : '+'}
                  </span>
                </button>

                {openScrapSections.polymarket && (
                  <div className="space-y-3 border-t border-white/10 px-4 py-4">
                    <div className="grid grid-cols-2 gap-2">
                      {POLYMARKET_CATEGORIES.map(category => (
                        <button
                          key={category.tag}
                          type="button"
                          onClick={() => toggleSelection(category.tag, setSelectedPolymarket)}
                          className={`rounded-full border px-3 py-2 text-left font-ui text-sm transition-colors ${
                            selectedPolymarket.includes(category.tag)
                              ? 'border-[#f59e0b]/45 bg-[#f59e0b]/18 text-[#f7c87b]'
                              : 'border-white/15 text-white hover:border-white/35 hover:bg-white/5'
                          }`}
                        >
                          <span className="mr-2">{category.emoji}</span>
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <button
                  type="button"
                  onClick={() => toggleScrapSection('coursework')}
                  className="flex w-full items-start justify-between px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="font-ui text-sm font-bold uppercase tracking-[0.25em] text-white/90">
                      Coursework
                    </h3>
                    <p className="mt-1 font-ui text-sm text-gray-400">
                      Turn notes and slides into prompts.
                    </p>
                  </div>
                  <span className="font-ui text-xl leading-none text-white/70">
                    {openScrapSections.coursework ? '−' : '+'}
                  </span>
                </button>

                {openScrapSections.coursework && (
                  <div className="border-t border-white/10 px-4 py-4">
                    <PdfManager pdfs={pdfs} />
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <button
                  type="button"
                  onClick={() => toggleScrapSection('friends')}
                  className="flex w-full items-start justify-between px-4 py-4 text-left"
                >
                  <div>
                    <h3 className="font-ui text-sm font-bold uppercase tracking-[0.25em] text-white/90">
                      Friend Group
                    </h3>
                    <p className="mt-1 font-ui text-sm text-gray-400">
                      Make packs for your own circle.
                    </p>
                  </div>
                  <span className="font-ui text-xl leading-none text-white/70">
                    {openScrapSections.friends ? '−' : '+'}
                  </span>
                </button>

                {openScrapSections.friends && (
                  <div className="space-y-3 border-t border-white/10 px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {FRIEND_GROUP_PACKS.map(pack => (
                        <button
                          key={pack}
                          type="button"
                          onClick={() => toggleSelection(pack, setSelectedFriendPacks)}
                          className={`rounded-full border px-3 py-2 font-ui text-sm transition-colors ${
                            selectedFriendPacks.includes(pack)
                              ? 'border-[#f59e0b]/45 bg-[#f59e0b]/18 text-[#f7c87b]'
                              : 'border-white/15 text-white/85 hover:border-white/35 hover:bg-white/5'
                          }`}
                        >
                          {pack}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled
                      className="rounded-full border border-dashed border-white/25 px-4 py-2 font-ui text-sm text-gray-300 transition-colors hover:border-white/45 hover:text-white"
                    >
                      Custom packs soon
                    </button>
                  </div>
                )}
              </section>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid flex-1 grid-cols-4 grid-rows-2 gap-x-3 gap-y-2 overflow-hidden rounded-[2rem] bg-black/15 px-6 py-5"
          >
            {playerSlots.map(({ key, player, crewMember }, slotIndex) => {
              const isClickableDevSlot = isDevMode && !player;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (isClickableDevSlot) {
                      simulateDevPlayerJoin(slotIndex);
                    }
                  }}
                  disabled={!isClickableDevSlot}
                  className={`flex h-36 items-end justify-center rounded-2xl transition-colors ${
                    isClickableDevSlot
                      ? 'cursor-pointer hover:bg-white/5'
                      : 'cursor-default'
                  }`}
                  aria-label={
                    isClickableDevSlot
                      ? `Add a simulated player to the ${crewMember.label} slot`
                      : undefined
                  }
                >
                  <img
                    src={crewMember.image}
                    alt={`${crewMember.label} raccoon`}
                    className="h-32 w-24 object-contain object-bottom"
                    style={{
                      transform: `scale(${crewMember.scale})`,
                      transformOrigin: 'bottom center',
                      filter: player ? 'none' : 'grayscale(100%)',
                    }}
                  />
                </button>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
        >
          <button
            onClick={() => {
              void startGame({ polymarketCategories: selectedPolymarket });
            }}
            disabled={!canStart}
            className={`vault-button px-16 py-4 text-2xl transition-opacity ${
              canStart ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {isPreparingGame ? 'Loading...' : 'Start'}
          </button>
        </motion.div>
      </div>
    </HostLayout>
  );
}
