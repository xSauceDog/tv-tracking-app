-- =========================================================
-- Aggregate watch stats for any profile. SECURITY DEFINER because
-- watched_episodes is private; only counts leave this function.
-- =========================================================
create function public.profile_stats(p_user_id uuid)
returns table (
  episodes_watched integer,
  minutes_watched  integer,
  shows_tracked    integer,
  shows_completed  integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with per_show as (
    select us.show_id,
           (count(*) filter (where e.air_date <= current_date))::int as aired,
           count(w.episode_id)::int                                  as watched
      from public.user_shows us
      join public.episodes e on e.show_id = us.show_id
      left join public.watched_episodes w
        on w.episode_id = e.id and w.user_id = us.user_id
     where us.user_id = p_user_id
     group by us.show_id
  )
  select
    (select count(*) from public.watched_episodes w
      where w.user_id = p_user_id)::int,
    (select coalesce(sum(e.runtime), 0) from public.watched_episodes w
       join public.episodes e on e.id = w.episode_id
      where w.user_id = p_user_id)::int,
    (select count(*) from public.user_shows us
      where us.user_id = p_user_id)::int,
    (select count(*) from per_show
      where aired > 0 and watched >= aired)::int;
$$;

revoke execute on function public.profile_stats(uuid) from public, anon;
grant execute on function public.profile_stats(uuid) to authenticated;