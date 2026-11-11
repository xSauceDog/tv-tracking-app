-- =========================================================
-- Watch providers: shared cache from TMDB (service role writes only)
-- One row per show + country. An empty `options` row means "checked, nothing available".
-- =========================================================
create table public.show_providers (
  show_id   uuid not null references public.shows (id) on delete cascade,
  region    text not null,
  link      text,
  options   jsonb not null,
  synced_at timestamptz not null default now(),

  primary key (show_id, region),
  constraint show_providers_region_check check (region ~ '^[A-Z]{2}$')
);

alter table public.show_providers enable row level security;

revoke all on public.show_providers from anon, authenticated;
grant select on public.show_providers to anon, authenticated;
grant select, insert, update on public.show_providers to service_role;

create policy "Show providers are publicly readable"
  on public.show_providers for select
  to anon, authenticated
  using (true);

-- =========================================================
-- Per-user country, used to pick which region's providers to show
-- =========================================================
alter table public.user_settings
  add column region text not null default 'US',
  add constraint user_settings_region_check check (region ~ '^[A-Z]{2}$');

grant insert (region), update (region) on public.user_settings to authenticated;