-- =========================================================
-- Marking a season watched also marks every earlier season
-- (aired episodes only). Unmarking still affects just that season.
-- =========================================================
create or replace function public.set_season_watched(p_show_id uuid, p_season integer, p_watched boolean)
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
       and e.season_number between 1 and p_season
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

-- =========================================================
-- Library: the shows a user tracks (status is derived, not stored)
-- =========================================================
create table public.user_shows (
  user_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  show_id  uuid not null references public.shows (id) on delete cascade,
  added_at timestamptz not null default now(),

  primary key (user_id, show_id)
);

create index user_shows_show_id_idx on public.user_shows (show_id);

alter table public.user_shows enable row level security;

revoke all on public.user_shows from anon, authenticated;
grant select, delete on public.user_shows to authenticated;
grant insert (show_id) on public.user_shows to authenticated;

create policy "Users can read their own library"
  on public.user_shows for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add to their own library"
  on public.user_shows for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can remove from their own library"
  on public.user_shows for delete to authenticated
  using (user_id = (select auth.uid()));

-- Watching anything auto-adds the show to the library. Doing it in a trigger covers
-- every code path (single toggle, season RPC, mark-previous RPC). SECURITY DEFINER
-- because users only have insert rights on show_id, not user_id.
create function public.add_show_to_library()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_shows (user_id, show_id)
  select new.user_id, e.show_id
    from public.episodes e
   where e.id = new.episode_id
  on conflict do nothing;
  return new;
end;
$$;

revoke execute on function public.add_show_to_library() from public, anon, authenticated;

create trigger watched_episodes_add_to_library
  after insert on public.watched_episodes
  for each row execute function public.add_show_to_library();

-- Backfill: anything you've already watched belongs in the library.
insert into public.user_shows (user_id, show_id)
select distinct w.user_id, e.show_id
  from public.watched_episodes w
  join public.episodes e on e.id = w.episode_id
on conflict do nothing;