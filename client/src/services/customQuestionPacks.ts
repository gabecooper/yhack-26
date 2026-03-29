import { supabase } from '@/services/supabaseClient';
import type { CustomPackSourceType, CustomQuestionPack, Question } from '@/types/game';

interface CustomQuestionPackRow {
  id: string;
  filename: string;
  label: string;
  source_type: CustomPackSourceType;
  source_kind: 'pdf' | 'txt';
  questions: Question[];
  question_count: number;
  created_at: string | null;
}

interface CreateCustomQuestionPackInput {
  userId: string;
  filename: string;
  label: string;
  sourceType: CustomPackSourceType;
  sourceKind: 'pdf' | 'txt';
  questions: Question[];
}

const BLOCKED_FRIEND_GROUP_QUESTION_FRAGMENT = 'most likely to forget at home';

function normalizeCustomPackError(error: unknown): Error {
  if (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'PGRST205'
  ) {
    return new Error(
      'Custom packs are not set up in Supabase yet. Run apps/studyslayer/supabase_custom_question_packs.sql once in the Supabase SQL editor.'
    );
  }

  return error instanceof Error
    ? error
    : new Error('Unable to load custom packs right now.');
}

function mapPackRow(row: CustomQuestionPackRow): CustomQuestionPack {
  const questions = sanitizePackQuestions(Array.isArray(row.questions) ? row.questions : []);

  return {
    id: row.id,
    filename: row.filename,
    label: row.label,
    sourceType: row.source_type,
    sourceKind: row.source_kind,
    questions,
    questionCount: questions.length,
    enabled: false,
    createdAt: row.created_at,
  };
}

function sanitizePackQuestions(questions: Question[]) {
  return questions.filter(question => !isBlockedFriendGroupQuestion(question));
}

function isBlockedFriendGroupQuestion(question: Question) {
  const normalizedQuestion = question.question.trim().toLowerCase();
  const keywords = Array.isArray(question.keywords) ? question.keywords : [];
  const isFriendGroupQuestion =
    keywords.includes('friend-group-generated') || keywords.includes('friend-group-pack');

  return isFriendGroupQuestion
    && normalizedQuestion.includes(BLOCKED_FRIEND_GROUP_QUESTION_FRAGMENT);
}

export async function listCustomQuestionPacks(userId: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('custom_question_packs')
    .select('id, filename, label, source_type, source_kind, questions, question_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw normalizeCustomPackError(error);
  }

  return (data ?? []).map(row => mapPackRow(row as CustomQuestionPackRow));
}

export async function createCustomQuestionPack({
  userId,
  filename,
  label,
  sourceType,
  sourceKind,
  questions,
}: CreateCustomQuestionPackInput) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const sanitizedQuestions = sanitizePackQuestions(questions);

  const { data, error } = await supabase
    .from('custom_question_packs')
    .insert({
      user_id: userId,
      filename,
      label,
      source_type: sourceType,
      source_kind: sourceKind,
      questions: sanitizedQuestions,
      question_count: sanitizedQuestions.length,
    })
    .select('id, filename, label, source_type, source_kind, questions, question_count, created_at')
    .single();

  if (error) {
    throw normalizeCustomPackError(error);
  }

  return mapPackRow(data as CustomQuestionPackRow);
}

export async function deleteCustomQuestionPack(userId: string, packId: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('custom_question_packs')
    .delete()
    .eq('id', packId)
    .eq('user_id', userId);

  if (error) {
    throw normalizeCustomPackError(error);
  }
}
