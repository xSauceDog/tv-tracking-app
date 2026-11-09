-- =========================================================
-- Removing a show from the library also removes it from all of the
-- caller's lists. SECURITY INVOKER, so RLS still applies.
-- Watch progress (watched_episodes) is intentionally kept.
-- =========================================================
create function public.remove_show_from_library(p_show_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.list_items li
   using public.lists l
   where li.list_id = l.id
     and l.user_id = (select auth.uid())
     and li.show_id = p_show_id;

  delete from public.user_shows
   where user_id = (select auth.uid())
     and show_id = p_show_id;
end;
$$;

revoke execute on function public.remove_show_from_library(uuid) from public, anon;
grant execute on function public.remove_show_from_library(uuid) to authenticated;