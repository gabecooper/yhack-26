const specialQuipCache = new Map<string, Promise<string>>();

const WRONG_QUIP_TEMPLATES = [
  'Breaking news: [user_name] has entered their flop era.',
  'You moved with confidence. The problem is-you moved.',
  'listen closely [user_name], not everyone is cut out to be racoon',
  "utterly shocking. i suppose [user_name] doesn't know ball",
  'That was a generational choke. Future textbooks will study this.',
  '[user_name], log out for me.',
  'You had ONE job. One.',
  'This is more embarrassing than when harvard lost against yale',
  'That answer just tanked your GPA.',
  'The curve is NOT saving you this time.',
] as const;

const GOOD_QUIP_TEMPLATES = [
  "Oh so NOW you're smart? Where was this during midterms, [user_name]?",
  'Congrats [user_name], you finally justified your tuition.',
  "Congratulations, [user_name]. You've peaked. It's all downhill from here.",
  'The market believed in you... which is honestly the biggest surprise.',
  'Give it up for [user_name]-the only raccoon here with a functioning brain cell.',
  "That was so clean I'm adding it to your LinkedIn.",
  'Congrats [user_name]... even a broken clock is right twice a day.',
  "It's giving academic weapon but like... Temu version.",
  'Everyone lost money because of YOU. Reflect on that.',
  'Vegas would like a word with you.',
] as const;

export type QuipOutcome = 'correct' | 'wrong';

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function shouldUseSpecialQuip(seed: string) {
  return hashString(seed) % 3 === 0;
}

function replacePlayerName(template: string, playerName: string) {
  return template.replace(/\[user_name\]/g, playerName);
}

function getPresetTemplates(outcome: QuipOutcome) {
  return outcome === 'wrong' ? WRONG_QUIP_TEMPLATES : GOOD_QUIP_TEMPLATES;
}

export function getPresetQuip({
  seed,
  playerName,
  outcome,
}: {
  seed: string;
  playerName: string;
  outcome: QuipOutcome;
}) {
  const templates = getPresetTemplates(outcome);
  const template = templates[hashString(seed) % templates.length];
  return replacePlayerName(template, playerName);
}

export function getRandomPresetQuip({
  playerName,
  outcome,
  excluding,
}: {
  playerName: string;
  outcome: QuipOutcome;
  excluding?: string | null;
}) {
  const templates = getPresetTemplates(outcome);
  const availableTemplates = excluding
    ? templates.filter(template => replacePlayerName(template, playerName) !== excluding)
    : templates;
  const templatePool = availableTemplates.length > 0 ? availableTemplates : templates;
  const template = templatePool[Math.floor(Math.random() * templatePool.length)] ?? templates[0];

  return replacePlayerName(template, playerName);
}

function getCacheKey(payload: {
  questionId: string;
  playerName: string;
  outcome: QuipOutcome;
}) {
  return `${payload.questionId}::${payload.outcome}::${payload.playerName}`;
}

export function getSpecialQuip(payload: {
  questionId: string;
  playerName: string;
  outcome: QuipOutcome;
  category?: string | null;
  question: string;
  correctAnswer: string;
}) {
  const cacheKey = getCacheKey(payload);
  const cached = specialQuipCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const request = fetch('/api/gemini-special-quip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).then(async response => {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Unable to load special quip');
    }

    const json = await response.json();
    const quip = typeof json?.quip === 'string' ? json.quip.trim() : '';

    if (!quip) {
      throw new Error('Special quip response was empty');
    }

    return quip;
  }).catch(error => {
    specialQuipCache.delete(cacheKey);
    throw error;
  });

  specialQuipCache.set(cacheKey, request);
  return request;
}
