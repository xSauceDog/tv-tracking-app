-- =========================================================
-- Usernames are permanent (they're part of the profile URL).
-- Column-level grant revoke: even a hand-crafted request gets "permission denied".
-- The signup trigger is SECURITY DEFINER, so it can still set the initial username.
-- =========================================================
revoke update (username) on public.profiles from authenticated;

-- =========================================================
-- Adding a show to any of your lists also adds it to your library.
-- SECURITY DEFINER because users can only insert show_id into user_shows, not user_id.
-- Removing a show from a list does NOT remove it from the library.
-- =========================================================
create function public.add_list_show_to_library()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_shows (user_id, show_id)
  select l.user_id, new.show_id
    from public.lists l
   where l.id = new.list_id
  on conflict do nothing;
  return new;
end;
$$;

revoke execute on function public.add_list_show_to_library() from public, anon, authenticated;

create trigger list_items_add_to_library
  after insert on public.list_items
  for each row execute function public.add_list_show_to_library();

-- Backfill: shows already sitting on lists belong in the library too.
insert into public.user_shows (user_id, show_id)
select distinct l.user_id, li.show_id
  from public.list_items li
  join public.lists l on l.id = li.list_id
on conflict do nothing;