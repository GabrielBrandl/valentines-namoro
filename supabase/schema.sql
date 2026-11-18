-- Valentine's / Fecon — schema + RLS
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text not null default '',
  age int not null default 18 check (age >= 18 and age <= 99),
  city text not null default 'São Paulo',
  job text not null default 'Em descoberta',
  bio text not null default '',
  gender text not null default 'mulher' check (gender in ('mulher', 'homem')),
  interests text[] not null default '{}',
  photos text[] not null default '{}',
  prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_id text not null,
  action text not null check (action in ('like', 'pass', 'super')),
  created_at timestamptz not null default now(),
  unique (user_id, target_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_id text not null,
  is_super boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, target_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  match_target_id text not null,
  from_me boolean not null default true,
  text text not null default '',
  media text,
  created_at timestamptz not null default now()
);

create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  caption text not null default '',
  media_url text not null,
  poster_url text,
  likes int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists profiles_gender_idx on public.profiles (gender);
create index if not exists swipes_user_idx on public.swipes (user_id);
create index if not exists matches_user_idx on public.matches (user_id);
create index if not exists messages_user_match_idx on public.messages (user_id, match_target_id);
create index if not exists reels_created_idx on public.reels (created_at desc);

alter table public.profiles enable row level security;
alter table public.user_app_state enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.reels enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "state_select_own" on public.user_app_state;
create policy "state_select_own"
  on public.user_app_state for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "state_insert_own" on public.user_app_state;
create policy "state_insert_own"
  on public.user_app_state for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "state_update_own" on public.user_app_state;
create policy "state_update_own"
  on public.user_app_state for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "swipes_own" on public.swipes;
create policy "swipes_own"
  on public.swipes for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "matches_own" on public.matches;
create policy "matches_own"
  on public.matches for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "messages_own" on public.messages;
create policy "messages_own"
  on public.messages for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reels_select_all" on public.reels;
create policy "reels_select_all"
  on public.reels for select to authenticated
  using (true);

drop policy if exists "reels_write_own" on public.reels;
create policy "reels_write_own"
  on public.reels for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'voce'), '@', 1))
  )
  on conflict (id) do nothing;
  insert into public.user_app_state (user_id, payload)
  values (new.id, '{}'::jsonb)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "media_auth_upload" on storage.objects;
create policy "media_auth_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media_auth_update" on storage.objects;
create policy "media_auth_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media_auth_delete" on storage.objects;
create policy "media_auth_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
