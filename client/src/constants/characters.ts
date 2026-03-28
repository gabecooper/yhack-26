export interface HeistCharacter {
  index: number;
  role: string;
  accentPrimary: string;
  accentSecondary: string;
  trait: string;
  initial: string;
}

export const HEIST_CHARACTERS: HeistCharacter[] = [
  { index: 0, role: 'Burglar', accentPrimary: '#1a1a2e', accentSecondary: '#f5f0e1', trait: 'Dopey, lovable', initial: 'B' },
  { index: 1, role: 'Mastermind', accentPrimary: '#1b2a4a', accentSecondary: '#d4a017', trait: 'Smug, over-prepared', initial: 'M' },
  { index: 2, role: 'Lookout', accentPrimary: '#2d6a4f', accentSecondary: '#95a5a6', trait: 'Nervous, paranoid', initial: 'L' },
  { index: 3, role: 'Driver', accentPrimary: '#c0392b', accentSecondary: '#f1c40f', trait: 'Focused, reckless', initial: 'D' },
  { index: 4, role: 'Safecracker', accentPrimary: '#c19a6b', accentSecondary: '#8b0000', trait: 'Intense, methodical', initial: 'S' },
  { index: 5, role: 'Muscle', accentPrimary: '#6c3483', accentSecondary: '#d5a6e6', trait: 'Tough, loyal', initial: 'U' },
  { index: 6, role: 'Forger', accentPrimary: '#1a5276', accentSecondary: '#aed6f1', trait: 'Creative, shifty', initial: 'F' },
  { index: 7, role: 'Demolitions', accentPrimary: '#d35400', accentSecondary: '#fad7a0', trait: 'Wild, unpredictable', initial: 'X' },
];
