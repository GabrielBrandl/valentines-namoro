-- Hashtags, efeitos, música (placeholder), republicar e curtidas sync
alter table public.reels add column if not exists hashtags text[] not null default '{}';
alter table public.reels add column if not exists effect jsonb;
alter table public.reels add column if not exists music jsonb;
alter table public.reels add column if not exists repost_of uuid;

create table if not exists public.reel_likes (
  user_id uuid not null references auth.users (id) on delete cascade,
  reel_id uuid not null references public.reels (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, reel_id)
);

create index if not exists reel_likes_reel_idx on public.reel_likes (reel_id);
create index if not exists reel_likes_user_idx on public.reel_likes (user_id);

alter table public.reel_likes enable row level security;

drop policy if exists "reel_likes_select_all" on public.reel_likes;
create policy "reel_likes_select_all"
  on public.reel_likes for select to authenticated
  using (true);

drop policy if exists "reel_likes_write_own" on public.reel_likes;
create policy "reel_likes_write_own"
  on public.reel_likes for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.bump_reel_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.reels set likes = likes + 1 where id = new.reel_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.reels set likes = greatest(likes - 1, 0) where id = old.reel_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists on_reel_like_change on public.reel_likes;
create trigger on_reel_like_change
  after insert or delete on public.reel_likes
  for each row execute function public.bump_reel_likes();
