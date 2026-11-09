-- =========================================================
-- Avatars: stored in Supabase Storage, referenced by path.
-- =========================================================
alter table public.profiles
  drop column avatar_url,
  add column avatar_path text,
  add constraint profiles_avatar_path_format check (
    avatar_path is null
    or avatar_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(webp|jpg)$')
  );

grant update (avatar_path) on public.profiles to authenticated;

-- Signup trigger no longer reads OAuth metadata (email-only sign-up).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
  candidate     text;
  attempts      int := 0;
begin
  base_username := regexp_replace(
    lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1))),
    '[^a-z0-9_]', '', 'g'
  );

  if char_length(base_username) < 3 then
    base_username := 'user' || base_username;
  end if;

  candidate := left(base_username, 20);

  while exists (select 1 from public.profiles p where p.username = candidate) loop
    attempts := attempts + 1;
    if attempts > 10 then
      candidate := 'user_' || left(replace(new.id::text, '-', ''), 12);
      exit;
    end if;
    candidate := left(base_username, 14) || '_' || left(md5(random()::text), 5);
  end loop;

  insert into public.profiles (id, username)
  values (new.id, candidate)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- =========================================================
-- Storage: public-read bucket, owner-only writes, strict limits
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Files live at <user_id>/<uuid>.<ext>. Filenames are never reused, so there is no
-- update policy and the CDN can cache them forever.
create policy "Users can upload their own avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Delete needs select too (Postgres applies select policies to DELETE ... WHERE).
-- Public URLs don't use this policy, so avatars stay readable by everyone.
create policy "Users can see their own avatar files"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own avatars"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);