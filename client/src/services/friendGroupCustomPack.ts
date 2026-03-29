import { supabase } from '@/services/supabaseClient';
import type { FriendGroupPackSettings, Question } from '@/types/game';

interface FriendGroupQuestionRow {
  id: string;
  style: FriendGroupPackSettings['style'];
  question: string;
  options: unknown;
  correct: number;
  probabilities: unknown;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsed = value.map(item => String(item ?? '').trim()).filter(Boolean);
  return parsed.length === 4 ? parsed : null;
}

function parseProbabilityArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [0.25, 0.25, 0.25, 0.25];
  }

  const probabilities = value.slice(0, 4).map(item => Number(item));
  const normalized = probabilities.map(item => (Number.isFinite(item) && item >= 0 ? item : 0));
  const total = normalized.reduce((sum, item) => sum + item, 0);

  if (total <= 0) {
    return [0.25, 0.25, 0.25, 0.25];
  }

  return normalized.map(item => item / total);
}

function personalizeText(text: string, playerNames: string[], counter: { value: number }) {
  if (!text.includes('{player}') || playerNames.length === 0) {
    return text;
  }

  return text.split('{player}').reduce((accumulator, segment, index) => {
    if (index === 0) {
      return segment;
    }

    const playerName = playerNames[counter.value % playerNames.length];
    counter.value += 1;
    return `${accumulator}${playerName}${segment}`;
  }, '');
}

function personalizeQuestions(questions: Question[], playerNames: string[]) {
  const counter = { value: 0 };

  return questions.map(question => ({
    ...question,
    question: personalizeText(question.question, playerNames, counter),
    choices: question.choices.map(choice => personalizeText(choice, playerNames, counter)),
  }));
}

function normalizeFriendGroupPackError(error: unknown) {
  if (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'PGRST205'
  ) {
    return new Error(
      'Friend group custom packs are not set up in Supabase yet. Run custom-pack-changes/docs/supabase/custom_pack_questions_seed.sql once in the Supabase SQL editor.'
    );
  }

  return error instanceof Error
    ? error
    : new Error('Unable to load friend group custom pack questions right now.');
}

export async function fetchFriendGroupCustomPackQuestions(
  settings: FriendGroupPackSettings,
  playerNames: string[] = []
) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('custom_pack_questions')
    .select('id, style, question, options, correct, probabilities')
    .eq('style', settings.style);

  if (error) {
    throw normalizeFriendGroupPackError(error);
  }

  const rows = (data ?? []) as FriendGroupQuestionRow[];
  const normalizedQuestions = rows
    .map(row => {
      const options = parseStringArray(row.options);

      if (!options) {
        return null;
      }

      if (!Number.isInteger(row.correct) || row.correct < 0 || row.correct > 3) {
        return null;
      }

      const question: Question = {
        id: `friend-group-pack-${row.id}`,
        question: row.question,
        choices: options,
        correct: row.correct,
        probabilities: parseProbabilityArray(row.probabilities),
        keywords: ['friend-group-pack', row.style],
        category: `Friend Group Pack: ${row.style}`,
        source: null,
      };

      return question;
    })
    .filter((question): question is Question => question !== null);

  if (normalizedQuestions.length === 0) {
    throw new Error(`No friend group questions found for style "${settings.style}".`);
  }

  const selectedQuestions = shuffle(normalizedQuestions).slice(0, settings.numQuestions);

  if (selectedQuestions.length < settings.numQuestions) {
    throw new Error(
      `Only ${selectedQuestions.length} friend group questions are available for style "${settings.style}".`
    );
  }

  if (!settings.includeNames) {
    return selectedQuestions;
  }

  const cleanPlayerNames = playerNames.map(name => name.trim()).filter(Boolean);

  if (cleanPlayerNames.length === 0) {
    return selectedQuestions;
  }

  return personalizeQuestions(selectedQuestions, cleanPlayerNames);
}
