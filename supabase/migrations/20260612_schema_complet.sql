-- =============================================================
-- ARDOISE — Schéma complet (réplique des 4 migrations appliquées
-- au projet Supabase <projet> le 2026-06-12)
--   1. initial_schema   2. rls_policies
--   3. public_rpcs      4. harden_functions
-- Permet de recréer la base à l'identique sur un nouveau projet.
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- 1. SCHÉMA ----------

create type order_status as enum ('pending','confirmed','preparing','ready','served','cancelled');
create type session_status as enum ('active','closed');
create type reservation_status as enum ('pending','confirmed','seated','cancelled','no_show');

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  phone text,
  address text,
  currency text not null default 'EUR',
  timezone text not null default 'Europe/Paris',
  ordering_enabled boolean not null default true,
  reservations_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 20),
  seats int not null default 2 check (seats between 1 and 50),
  created_at timestamptz not null default now(),
  unique (restaurant_id, label)
);

create table public.table_sessions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid not null references public.tables(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  status session_status not null default 'active',
  expires_at timestamptz not null default now() + interval '4 hours',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text check (description is null or char_length(description) <= 400),
  price_cents int not null check (price_cents >= 0 and price_cents <= 1000000),
  image_url text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_counters (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  day date not null,
  counter int not null default 0,
  primary key (restaurant_id, day)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_session_id uuid references public.table_sessions(id) on delete set null,
  table_label text not null,
  order_number int not null,
  status order_status not null default 'pending',
  customer_name text,
  note text,
  total_cents int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price_cents int not null check (unit_price_cents >= 0),
  quantity int not null check (quantity between 1 and 20)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  phone text not null check (char_length(phone) between 6 and 20),
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  party_size int not null check (party_size between 1 and 50),
  starts_at timestamptz not null,
  status reservation_status not null default 'pending',
  note text check (note is null or char_length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_restaurant_created on public.orders (restaurant_id, created_at desc);
create index idx_orders_session on public.orders (table_session_id);
create index idx_menu_items_restaurant on public.menu_items (restaurant_id);
create index idx_menu_items_category on public.menu_items (category_id);
create index idx_menu_categories_restaurant on public.menu_categories (restaurant_id);
create index idx_tables_restaurant on public.tables (restaurant_id);
create index idx_sessions_restaurant on public.table_sessions (restaurant_id);
create index idx_sessions_table on public.table_sessions (table_id);
create index idx_reservations_restaurant_start on public.reservations (restaurant_id, starts_at);
create index idx_order_items_order on public.order_items (order_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_restaurants_updated before update on public.restaurants for each row execute function public.set_updated_at();
create trigger trg_menu_items_updated before update on public.menu_items for each row execute function public.set_updated_at();
create trigger trg_orders_updated before update on public.orders for each row execute function public.set_updated_at();
create trigger trg_reservations_updated before update on public.reservations for each row execute function public.set_updated_at();

-- Numérotation de commande par restaurant et par jour, atomique (upsert).
create or replace function public.next_order_number(rid uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v int;
begin
  insert into order_counters (restaurant_id, day, counter)
  values (rid, (now() at time zone 'utc')::date, 1)
  on conflict (restaurant_id, day) do update set counter = order_counters.counter + 1
  returning counter into v;
  return v;
end $$;

alter publication supabase_realtime add table public.orders;

-- ---------- 2. RLS ----------

alter table public.restaurants enable row level security;
alter table public.tables enable row level security;
alter table public.table_sessions enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reservations enable row level security;
alter table public.order_counters enable row level security; -- aucune policy = deny all (accès via fonction uniquement)

create or replace function public.is_restaurant_owner(rid uuid)
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from restaurants where id = rid and owner_id = auth.uid()) $$;

create policy "owner select restaurant" on public.restaurants for select to authenticated using (owner_id = auth.uid());
create policy "owner insert restaurant" on public.restaurants for insert to authenticated with check (owner_id = auth.uid());
create policy "owner update restaurant" on public.restaurants for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner delete restaurant" on public.restaurants for delete to authenticated using (owner_id = auth.uid());

create policy "owner all tables" on public.tables for all to authenticated
  using (public.is_restaurant_owner(restaurant_id)) with check (public.is_restaurant_owner(restaurant_id));
create policy "owner all sessions" on public.table_sessions for all to authenticated
  using (public.is_restaurant_owner(restaurant_id)) with check (public.is_restaurant_owner(restaurant_id));
create policy "owner all categories" on public.menu_categories for all to authenticated
  using (public.is_restaurant_owner(restaurant_id)) with check (public.is_restaurant_owner(restaurant_id));
create policy "owner all items" on public.menu_items for all to authenticated
  using (public.is_restaurant_owner(restaurant_id)) with check (public.is_restaurant_owner(restaurant_id));
create policy "owner all orders" on public.orders for all to authenticated
  using (public.is_restaurant_owner(restaurant_id)) with check (public.is_restaurant_owner(restaurant_id));
create policy "owner all reservations" on public.reservations for all to authenticated
  using (public.is_restaurant_owner(restaurant_id)) with check (public.is_restaurant_owner(restaurant_id));
create policy "owner order items" on public.order_items for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and public.is_restaurant_owner(o.restaurant_id)))
  with check (exists (select 1 from public.orders o where o.id = order_id and public.is_restaurant_owner(o.restaurant_id)));

-- ---------- 3. RPCs PUBLICS (SECURITY DEFINER) ----------
-- Le rôle anon ne touche JAMAIS les tables : toute la surface publique
-- passe par ces fonctions. Prix recalculés serveur, jamais confiés au client.

create or replace function public.get_session_menu(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_session table_sessions%rowtype;
  v_result jsonb;
begin
  select * into v_session from table_sessions
  where token = p_token and status = 'active' and expires_at > now();
  if not found then return null; end if;

  select jsonb_build_object(
    'restaurant', (select jsonb_build_object('id', r.id, 'name', r.name, 'currency', r.currency, 'ordering_enabled', r.ordering_enabled)
                   from restaurants r where r.id = v_session.restaurant_id),
    'table_label', (select label from tables where id = v_session.table_id),
    'session_expires_at', v_session.expires_at,
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name,
        'items', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', i.id, 'name', i.name, 'description', i.description,
            'price_cents', i.price_cents, 'image_url', i.image_url
          ) order by i.sort_order, i.name)
          from menu_items i
          where i.category_id = c.id and i.is_available
        ), '[]'::jsonb)
      ) order by c.sort_order, c.name)
      from menu_categories c where c.restaurant_id = v_session.restaurant_id
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end $$;

create or replace function public.place_order(
  p_token uuid,
  p_items jsonb,
  p_customer_name text default null,
  p_note text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_session table_sessions%rowtype;
  v_table_label text;
  v_total int := 0;
  v_order_id uuid;
  v_order_number int;
  v_elem jsonb;
  v_item_id uuid;
  v_qty int;
  v_price int;
  v_name text;
  v_count int;
  v_recent int;
begin
  select * into v_session from table_sessions
  where token = p_token and status = 'active' and expires_at > now()
  for update;
  if not found then
    return jsonb_build_object('error', 'SESSION_INVALID');
  end if;

  -- garde-fou : max 10 commandes / session / 15 min
  select count(*) into v_recent from orders
  where table_session_id = v_session.id and created_at > now() - interval '15 minutes';
  if v_recent >= 10 then
    return jsonb_build_object('error', 'RATE_LIMITED');
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    return jsonb_build_object('error', 'ITEMS_INVALID');
  end if;
  v_count := jsonb_array_length(p_items);
  if v_count < 1 or v_count > 30 then
    return jsonb_build_object('error', 'ITEMS_INVALID');
  end if;

  select label into v_table_label from tables where id = v_session.table_id;
  v_order_number := next_order_number(v_session.restaurant_id);

  insert into orders (restaurant_id, table_session_id, table_label, order_number, status, customer_name, note)
  values (v_session.restaurant_id, v_session.id, coalesce(v_table_label, '?'), v_order_number, 'pending',
          nullif(left(trim(coalesce(p_customer_name, '')), 60), ''),
          nullif(left(trim(coalesce(p_note, '')), 300), ''))
  returning id into v_order_id;

  for v_elem in select * from jsonb_array_elements(p_items) loop
    begin
      v_item_id := (v_elem->>'id')::uuid;
      v_qty := least(greatest(coalesce((v_elem->>'qty')::int, 1), 1), 20);
    exception when others then
      raise exception 'ITEMS_INVALID';
    end;

    select price_cents, name into v_price, v_name from menu_items
    where id = v_item_id and restaurant_id = v_session.restaurant_id and is_available;
    if not found then
      raise exception 'ITEM_UNAVAILABLE';
    end if;

    insert into order_items (order_id, menu_item_id, item_name, unit_price_cents, quantity)
    values (v_order_id, v_item_id, v_name, v_price, v_qty);
    v_total := v_total + v_price * v_qty;
  end loop;

  update orders set total_cents = v_total where id = v_order_id;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'total_cents', v_total);
end $$;

create or replace function public.get_order_public(p_token uuid, p_order_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_result jsonb;
begin
  select jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status,
    'total_cents', o.total_cents, 'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object('name', oi.item_name, 'qty', oi.quantity, 'unit_price_cents', oi.unit_price_cents))
      from order_items oi where oi.order_id = o.id
    ), '[]'::jsonb)
  ) into v_result
  from orders o
  join table_sessions s on s.id = o.table_session_id
  where o.id = p_order_id and s.token = p_token;
  return v_result;
end $$;

create or replace function public.get_restaurant_public(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', id, 'name', name, 'address', address, 'phone', phone,
    'reservations_enabled', reservations_enabled
  ) from restaurants where slug = p_slug;
$$;

create or replace function public.create_reservation(
  p_slug text,
  p_customer_name text,
  p_phone text,
  p_party_size int,
  p_starts_at timestamptz,
  p_email text default null,
  p_note text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_restaurant restaurants%rowtype;
  v_recent int;
  v_id uuid;
begin
  select * into v_restaurant from restaurants where slug = p_slug;
  if not found or not v_restaurant.reservations_enabled then
    return jsonb_build_object('error', 'RESTAURANT_UNAVAILABLE');
  end if;
  if p_starts_at < now() or p_starts_at > now() + interval '90 days' then
    return jsonb_build_object('error', 'DATE_INVALID');
  end if;

  -- garde-fou : max 3 demandes / téléphone / restaurant / 24 h
  select count(*) into v_recent from reservations
  where restaurant_id = v_restaurant.id and phone = trim(p_phone) and created_at > now() - interval '24 hours';
  if v_recent >= 3 then
    return jsonb_build_object('error', 'RATE_LIMITED');
  end if;

  insert into reservations (restaurant_id, customer_name, phone, email, party_size, starts_at, note)
  values (v_restaurant.id, left(trim(p_customer_name), 80), left(trim(p_phone), 20),
          nullif(left(trim(coalesce(p_email, '')), 120), ''), p_party_size, p_starts_at,
          nullif(left(trim(coalesce(p_note, '')), 300), ''))
  returning id into v_id;

  return jsonb_build_object('reservation_id', v_id);
end $$;

-- ---------- 4. DURCISSEMENT ----------

revoke execute on function public.next_order_number(uuid) from public, anon, authenticated;
revoke execute on function public.is_restaurant_owner(uuid) from public, anon;
grant execute on function public.is_restaurant_owner(uuid) to authenticated;

revoke execute on function public.get_session_menu(uuid) from public;
grant execute on function public.get_session_menu(uuid) to anon, authenticated;
revoke execute on function public.place_order(uuid, jsonb, text, text) from public;
grant execute on function public.place_order(uuid, jsonb, text, text) to anon, authenticated;
revoke execute on function public.get_order_public(uuid, uuid) from public;
grant execute on function public.get_order_public(uuid, uuid) to anon, authenticated;
revoke execute on function public.get_restaurant_public(text) from public;
grant execute on function public.get_restaurant_public(text) to anon, authenticated;
revoke execute on function public.create_reservation(text, text, text, int, timestamptz, text, text) from public;
grant execute on function public.create_reservation(text, text, text, int, timestamptz, text, text) to anon, authenticated;
