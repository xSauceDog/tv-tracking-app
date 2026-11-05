-- =========================================================
-- User settings: private, one row per user (created on first save)
-- =========================================================
create table public.user_settings (
  user_id           uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  previous_episodes text not null default 'ask',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint user_settings_previous_episodes_check
    check (previous_episodes in ('ask', 'all', 'single'))
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

revoke all on public.user_settings from anon, authenticated;
grant select on public.user_settings to authenticated;
grant insert (previous_episodes), update (previous_episodes) on public.user_settings to authenticated;

create policy "Users can read their own settings"
  on public.user_settings for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own settings"
  on public.user_settings for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own settings"
  on public.user_settings for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- =========================================================
-- Mark an episode watched, optionally with every earlier aired episode.
-- "Earlier" = lower (season, episode) within the show; specials (season 0) excluded.
-- SECURITY INVOKER, so RLS still applies.
-- =========================================================
create function public.mark_episode_watched(p_episode_id uuid, p_include_previous boolean default false)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_show_id uuid;
  v_season  integer;
  v_episode integer;
  v_air     date;
begin
  select e.show_id, e.season_number, e.episode_number, e.air_date
    into v_show_id, v_season, v_episode, v_air
    from public.episodes e
   where e.id = p_episode_id;

  if not found then
    raise exception 'Episode not found' using errcode = 'P0002';
  end if;
  if v_air is null or v_air > current_date then
    raise exception 'Episode has not aired yet' using errcode = '22023';
  end if;

  insert into public.watched_episodes (episode_id) values (p_episode_id)
  on conflict do nothing;

  if p_include_previous then
    insert into public.watched_episodes (episode_id)
    select e.id
      from public.episodes e
     where e.show_id = v_show_id
       and e.season_number > 0
       and e.air_date <= current_date
       and (e.season_number, e.episode_number) < (v_season, v_episode)
    on conflict do nothing;
  end if;
end;
$$;

revoke execute on function public.mark_episode_watched(uuid, boolean) from public, anon;
grant execute on function public.mark_episode_watched(uuid, boolean) to authenticated;