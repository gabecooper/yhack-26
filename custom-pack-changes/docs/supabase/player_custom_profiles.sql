-- Run this in Supabase SQL Editor.
-- Stores per-player answers to early custom profile questions.

create extension if not exists pgcrypto;

create table if not exists public.player_custom_profiles (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  player_name text not null,
  style text not null check (style in ('kid-friendly', 'for-friends', 'for-family', 'funny')),
  question_id text not null,
  question_text text not null,
  answer_index integer not null check (answer_index between 0 and 3),
  answer_text text,
  answered_at timestamptz not null default now(),
  unique (player_id, question_id)
);

alter table public.player_custom_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'player_custom_profiles'
      and policyname = 'player_custom_profiles_insert_all'
  ) then
    create policy player_custom_profiles_insert_all
      on public.player_custom_profiles
      for insert
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'player_custom_profiles'
      and policyname = 'player_custom_profiles_update_all'
  ) then
    create policy player_custom_profiles_update_all
      on public.player_custom_profiles
      for update
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'player_custom_profiles'
      and policyname = 'player_custom_profiles_read_all'
  ) then
    create policy player_custom_profiles_read_all
      on public.player_custom_profiles
      for select
      using (true);
  end if;
end $$;
