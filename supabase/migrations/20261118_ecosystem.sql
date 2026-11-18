-- Valentine's ecosystem: marketplace, delivery, club, shoppable reels
alter table public.reels add column if not exists product_id text;

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  name text not null,
  kind text not null default 'loja',
  city text not null default '',
  state text not null default '',
  tagline text not null default '',
  rating numeric not null default 5,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.sellers (id) on delete cascade,
  title text not null,
  detail text not null default '',
  cents int not null check (cents >= 0),
  category text not null default 'outros',
  image_url text,
  stock int not null default 0,
  delivery_eligible boolean not null default false,
  affiliate_pct int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'restaurante',
  city text not null default '',
  eta_min int not null default 40,
  fee_cents int not null default 0,
  rating numeric not null default 5,
  cover_url text,
  open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('shopping', 'delivery')),
  status text not null default 'pago',
  total_cents int not null default 0,
  seller_name text not null default '',
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.club_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  points int not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.chat_rooms (
  id text primary key,
  title text not null,
  city text,
  state text,
  interest text,
  created_at timestamptz not null default now()
);

create index if not exists products_seller_idx on public.products (seller_id);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists club_ledger_user_idx on public.club_ledger (user_id, created_at desc);

alter table public.sellers enable row level security;
alter table public.products enable row level security;
alter table public.merchants enable row level security;
alter table public.orders enable row level security;
alter table public.club_ledger enable row level security;
alter table public.chat_rooms enable row level security;

drop policy if exists "sellers_read" on public.sellers;
create policy "sellers_read" on public.sellers for select to authenticated using (active = true);

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products for select to authenticated using (active = true);

drop policy if exists "merchants_read" on public.merchants;
create policy "merchants_read" on public.merchants for select to authenticated using (true);

drop policy if exists "orders_own" on public.orders;
create policy "orders_own" on public.orders for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "club_own" on public.club_ledger;
create policy "club_own" on public.club_ledger for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "rooms_read" on public.chat_rooms;
create policy "rooms_read" on public.chat_rooms for select to authenticated using (true);
