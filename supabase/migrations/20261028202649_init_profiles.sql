-- =========================================================
-- Profiles
-- =========================================================
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null,
  display_name text,
  avatar_url   text,
  bio          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint profiles_username_key unique (username),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint profiles_display_name_length check (char_length(display_name) <= 50),
  constraint profiles_bio_length check (char_length(bio) <= 280)
);

comment on table public.profiles is 'Public profile for each auth user. Created automatically by trigger.';

-- =========================================================
-- updated_at helper
-- =========================================================
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;

-- Explicit, least-privilege grants (users can only edit these columns)
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, avatar_url, bio) on public.profiles to authenticated;

create policy "Profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No INSERT policy: rows are created by the trigger below.
-- No DELETE policy: rows are removed via ON DELETE CASCADE from auth.users.

-- =========================================================
-- Auto-create a profile for every new auth user
-- =========================================================
-- This runs inside the signup transaction, so an error here blocks signups.
-- It is written defensively: sanitises the username, de-duplicates it, and
-- only touches public.profiles.
create function public.handle_new_user()
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

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 50),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();