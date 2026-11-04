-- =========================================================
-- Shows: shared catalog cached from TMDB.
-- Written only by trusted server code (service role), never by end users,
-- so nobody can poison the catalog with fake titles or posters.
-- =========================================================
create table public.shows (
  id             uuid primary key default gen_random_uuid(),
  tmdb_id        integer not null,
  name           text not null,
  original_name  text,
  overview       text,
  poster_path    text,
  backdrop_path  text,
  first_air_date date,
  status         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint shows_tmdb_id_key unique (tmdb_id)
);

create trigger shows_set_updated_at
  before update on public.shows
  for each row execute function public.set_updated_at();

alter table public.shows enable row level security;

revoke all on public.shows from anon, authenticated;
grant select on public.shows to anon, authenticated;
grant select, insert, update on public.shows to service_role;

create policy "Shows are publicly readable"
  on public.shows for select
  to anon, authenticated
  using (true);

-- =========================================================
-- list_items: free-text title -> reference to a show
-- Pre-launch, so existing test rows are discarded.
-- =========================================================
delete from public.list_items;

alter table public.list_items
  add column show_id uuid not null references public.shows (id) on delete restrict,
  drop column title;

alter table public.list_items
  add constraint list_items_list_show_key unique (list_id, show_id);

create index list_items_show_id_idx on public.list_items (show_id);

grant insert (show_id) on public.list_items to authenticated;