-- =========================================================
-- Status of many shows at once for the signed-in user:
-- progress (aired vs. watched) plus the next episode that hasn't aired yet.
-- SECURITY INVOKER, so RLS still applies.
-- =========================================================
create index episodes_show_id_air_date_idx on public.episodes (show_id, air_date);

create function public.show_status(p_show_ids uuid[])
returns table (
  show_id       uuid,
  aired         integer,
  watched       integer,
  next_air_date date,
  days_until    integer,
  next_season   integer,
  next_episode  integer,
  next_name     text
)
language sql
stable
set search_path = ''
as $$
  select s.id,
         c.aired,
         c.watched,
         n.air_date,
         n.air_date - current_date,
         n.season_number,
         n.episode_number,
         n.name
    from public.shows s
    left join lateral (
      select (count(*) filter (where e.air_date <= current_date))::int as aired,
             (count(*) filter (where e.air_date <= current_date and w.episode_id is not null))::int as watched
        from public.episodes e
        left join public.watched_episodes w
          on w.episode_id = e.id and w.user_id = (select auth.uid())
       where e.show_id = s.id
    ) c on true
    left join lateral (
      select e.air_date, e.season_number, e.episode_number, e.name
        from public.episodes e
       where e.show_id = s.id
         and e.air_date >= current_date
       order by e.air_date, e.season_number, e.episode_number
       limit 1
    ) n on true
   where s.id = any (p_show_ids);
$$;

revoke execute on function public.show_status(uuid[]) from public, anon;
grant execute on function public.show_status(uuid[]) to authenticated;