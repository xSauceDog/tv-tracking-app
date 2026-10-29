-- =========================================================
-- Lists
-- =========================================================
create table public.lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name       text not null,
  is_public  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint lists_name_length check (char_length(btrim(name)) between 1 and 60)
);

create index lists_user_id_created_at_idx on public.lists (user_id, created_at);

create trigger lists_set_updated_at
  before update on public.lists
  for each row execute function public.set_updated_at();

-- =========================================================
-- List items (ranked)
-- =========================================================
create table public.list_items (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.lists (id) on delete cascade,
  title      text not null,
  -- Assigned by trigger on insert (the default only exists so generated types make it optional).
  position   integer not null default 0,
  created_at timestamptz not null default now(),

  constraint list_items_title_length check (char_length(btrim(title)) between 1 and 120),
  constraint list_items_position_range check (position between 1 and 1000),
  -- Deferred so a reorder can shuffle positions inside one statement.
  constraint list_items_list_position_key unique (list_id, position) deferrable initially deferred
);

-- New items go to the bottom of the ranking. The advisory lock serialises
-- concurrent inserts into the same list.
create function public.set_list_item_position()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.list_id::text, 0));
  select coalesce(max(li.position), 0) + 1
    into new.position
    from public.list_items li
   where li.list_id = new.list_id;
  return new;
end;
$$;

create trigger list_items_set_position
  before insert on public.list_items
  for each row execute function public.set_list_item_position();

-- =========================================================
-- Atomic reorder: pass every item id of the list in the new order.
-- SECURITY INVOKER, so RLS still applies.
-- =========================================================
create function public.reorder_list_items(p_list_id uuid, p_item_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_updated int;
  v_total   int;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_list_id::text, 0));

  update public.list_items li
     set position = o.ord::int
    from unnest(p_item_ids) with ordinality as o(id, ord)
   where li.id = o.id
     and li.list_id = p_list_id;
  get diagnostics v_updated = row_count;

  select count(*) into v_total from public.list_items where list_id = p_list_id;

  -- Must be exactly the list's items: no duplicates, no strangers, none missing.
  if v_updated <> coalesce(cardinality(p_item_ids), 0) or v_updated <> v_total then
    raise exception 'Item ids do not match the list' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.reorder_list_items(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_list_items(uuid, uuid[]) to authenticated;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.lists enable row level security;
alter table public.list_items enable row level security;

revoke all on public.lists, public.list_items from anon, authenticated;
grant select on public.lists, public.list_items to anon, authenticated;
grant insert (name, is_public), update (name, is_public) on public.lists to authenticated;
grant delete on public.lists to authenticated;
grant insert (list_id, title), update (position) on public.list_items to authenticated;
grant delete on public.list_items to authenticated;

create policy "Public lists are readable; owners read their own"
  on public.lists for select
  to anon, authenticated
  using (is_public or user_id = (select auth.uid()));

create policy "Users can create their own lists"
  on public.lists for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own lists"
  on public.lists for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own lists"
  on public.lists for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Items inherit visibility from their list (the subquery is itself subject to lists' RLS).
create policy "Items are readable when their list is"
  on public.list_items for select
  to anon, authenticated
  using (exists (select 1 from public.lists l where l.id = list_items.list_id));

create policy "Users can add items to their own lists"
  on public.list_items for insert
  to authenticated
  with check (exists (
    select 1 from public.lists l
     where l.id = list_items.list_id and l.user_id = (select auth.uid())
  ));

create policy "Users can reorder items in their own lists"
  on public.list_items for update
  to authenticated
  using (exists (
    select 1 from public.lists l
     where l.id = list_items.list_id and l.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.lists l
     where l.id = list_items.list_id and l.user_id = (select auth.uid())
  ));

create policy "Users can remove items from their own lists"
  on public.list_items for delete
  to authenticated
  using (exists (
    select 1 from public.lists l
     where l.id = list_items.list_id and l.user_id = (select auth.uid())
  ));