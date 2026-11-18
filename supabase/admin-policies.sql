-- Incoming swipes readable (mutual match detection)
drop policy if exists "swipes_own" on public.swipes;

create policy "swipes_select"
  on public.swipes for select to authenticated
  using (auth.uid() = user_id or target_id = auth.uid()::text);

create policy "swipes_insert_own"
  on public.swipes for insert to authenticated
  with check (auth.uid() = user_id);

create policy "swipes_update_own"
  on public.swipes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "swipes_delete_own"
  on public.swipes for delete to authenticated
  using (auth.uid() = user_id);

-- Matches: allow reading rows where you are the target (text uuid)
drop policy if exists "matches_own" on public.matches;

create policy "matches_select"
  on public.matches for select to authenticated
  using (auth.uid() = user_id or target_id = auth.uid()::text);

create policy "matches_insert_own"
  on public.matches for insert to authenticated
  with check (auth.uid() = user_id);

create policy "matches_update_own"
  on public.matches for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "matches_delete_own"
  on public.matches for delete to authenticated
  using (auth.uid() = user_id);

-- Broad read for authenticated ops dashboard (still requires login)
drop policy if exists "swipes_select_all_auth" on public.swipes;
create policy "swipes_select_all_auth"
  on public.swipes for select to authenticated
  using (true);

drop policy if exists "matches_select_all_auth" on public.matches;
create policy "matches_select_all_auth"
  on public.matches for select to authenticated
  using (true);

drop policy if exists "reels_select_all_auth" on public.reels;
-- already have reels_select_all
