-- =========================================================
-- Episodes: shared catalog cached from TMDB (service role writes only)
-- =========================================================
alter table public.shows add column episodes_synced_at timestamptz;

create table public.episodes (
  id             uuid primary key default gen_random_uuid(),
  show_id        uuid not null references public.shows (id) on delete cascade,
  season_number  integer not null,
  episode_number integer not null,
  name           text not null,
  overview       text,
  air_date       date,
  runtime        integer,
  still_path     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint episodes_show_season_episode_key unique (show_id, season_number, episode_number)
);

create trigger episodes_set_updated_at
  before update on public.episodes
  for each row execute function public.set_updated_at();

alter table public.episodes enable row level security;

revoke all on public.episodes from anon, authenticated;
grant select on public.episodes to anon, authenticated;
grant select, insert, update on public.episodes to service_role;

create policy "Episodes are publicly readable"
  on public.episodes for select
  to anon, authenticated
  using (true);

-- =========================================================
-- Watched episodes: private to each user
-- =========================================================
create table public.watched_episodes (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  episode_id uuid not null references public.episodes (id) on delete cascade,
  watched_at timestamptz not null default now(),

  primary key (user_id, episode_id)
);

create index watched_episodes_episode_id_idx on public.watched_episodes (episode_id);

alter table public.watched_episodes enable row level security;

revoke all on public.watched_episodes from anon, authenticated;
grant select, delete on public.watched_episodes to authenticated;
grant insert (episode_id) on public.watched_episodes to authenticated;

create policy "Users can read their own watch history"
  on public.watched_episodes for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can mark episodes watched"
  on public.watched_episodes for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can unmark episodes"
  on public.watched_episodes for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- =========================================================
-- Per-season progress for the signed-in user
-- SECURITY INVOKER, so RLS still applies.
-- =========================================================
create function public.season_progress(p_show_id uuid)
returns table (season_number integer, total integer, aired integer, watched integer)
language sql
stable
set search_path = ''
as $$
  select e.season_number,
         count(*)::int,
         (count(*) filter (where e.air_date <= current_date))::int,
         count(w.episode_id)::int
    from public.episodes e
    left join public.watched_episodes w
      on w.episode_id = e.id and w.user_id = (select auth.uid())
   where e.show_id = p_show_id
   group by e.season_number
   order by e.season_number;
$$;

revoke execute on function public.season_progress(uuid) from public, anon;
grant execute on function public.season_progress(uuid) to authenticated;

-- =========================================================
-- Mark a whole season watched / unwatched (aired episodes only)
-- =========================================================
create function public.set_season_watched(p_show_id uuid, p_season integer, p_watched boolean)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_watched then
    insert into public.watched_episodes (episode_id)
    select e.id
      from public.episodes e
     where e.show_id = p_show_id
       and e.season_number = p_season
       and e.air_date is not null
       and e.air_date <= current_date
    on conflict do nothing;
  else
    delete from public.watched_episodes w
     using public.episodes e
     where w.episode_id = e.id
       and e.show_id = p_show_id
       and e.season_number = p_season;
  end if;
end;
$$;

revoke execute on function public.set_season_watched(uuid, integer, boolean) from public, anon;
grant execute on function public.set_season_watched(uuid, integer, boolean) to authenticated;