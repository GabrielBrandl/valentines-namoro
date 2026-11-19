-- Feed/Match precisam ler perfis e reels mesmo sem JWT no browser
-- (sessão SSR em cookie HttpOnly não chega no createBrowserClient).

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "reels_select_all" on public.reels;
drop policy if exists "reels_select_public" on public.reels;
create policy "reels_select_public"
  on public.reels for select
  to anon, authenticated
  using (true);

drop policy if exists "follows_select_authenticated" on public.follows;
drop policy if exists "follows_select_public" on public.follows;
create policy "follows_select_public"
  on public.follows for select
  to anon, authenticated
  using (true);
