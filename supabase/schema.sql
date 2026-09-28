-- =====================================================================
-- Zivo — database schema
-- Run this FIRST in the Supabase SQL Editor, then run seed.sql.
-- It is safe to run more than once (it skips things that already exist).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text not null default '',
  phone       text not null default '',
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  image_url   text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid not null references public.categories (id) on delete restrict,
  name              text not null,
  slug              text not null unique,
  description       text not null default '',
  price_paise       int not null check (price_paise > 0),
  compare_at_paise  int check (compare_at_paise is null or compare_at_paise > 0),
  is_featured       boolean not null default false,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  url          text not null,
  storage_path text,                       -- null for seed images served from /public
  description  text not null default '',   -- used as alt text / caption
  sort_order   int not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  size        text not null,
  stock       int not null default 0 check (stock >= 0),
  unique (product_id, size)
);

create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  variant_id  uuid not null references public.product_variants (id) on delete cascade,
  quantity    int not null check (quantity between 1 and 10),
  created_at  timestamptz not null default now(),
  unique (user_id, variant_id)
);

create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  line1       text not null,
  line2       text not null default '',
  city        text not null,
  state       text not null,
  pincode     text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.orders (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references auth.users (id) on delete set null,
  customer_email              text not null,
  status                      public.order_status not null default 'pending',
  subtotal_paise              int not null check (subtotal_paise >= 0),
  shipping_paise              int not null default 0 check (shipping_paise >= 0),
  total_paise                 int not null check (total_paise > 0),
  shipping_address            jsonb not null,
  razorpay_order_id           text unique,
  razorpay_payment_id         text,
  paid_at                     timestamptz,
  confirmation_email_sent_at  timestamptz,
  email_send_count            int not null default 0,
  last_email_error            text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  variant_id        uuid references public.product_variants (id) on delete set null,
  product_name      text not null,
  size              text not null,
  unit_price_paise  int not null check (unit_price_paise > 0),
  quantity          int not null check (quantity > 0),
  image_url         text
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists products_category_idx      on public.products (category_id);
create index if not exists products_featured_idx      on public.products (is_featured) where is_active;
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);
create unique index if not exists product_images_one_primary
  on public.product_images (product_id) where is_primary;
create index if not exists product_variants_product_idx on public.product_variants (product_id);
create index if not exists cart_items_user_idx        on public.cart_items (user_id);
create index if not exists addresses_user_idx         on public.addresses (user_id);
create index if not exists orders_user_idx            on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx          on public.orders (status, created_at desc);
create index if not exists order_items_order_idx      on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- Helper functions and triggers
-- ---------------------------------------------------------------------

-- Is the current user an admin? SECURITY DEFINER so RLS policies can call it
-- without recursing into the profiles policies.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
drop trigger if exists product_images_updated_at on public.product_images;
create trigger product_images_updated_at before update on public.product_images
  for each row execute function public.set_updated_at();
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Create a profile row automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stop signed-in non-admins from changing their own role or email.
-- (The SQL Editor and the service role have no auth.uid(), so they can.)
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'You are not allowed to change your role';
    end if;
    new.email := old.email;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Mark an order as paid. Idempotent: only the call that moves the order from
-- 'pending' to 'paid' returns true (and decrements stock / clears the cart).
-- Called by the server (payment verify route and Razorpay webhook) only.
create or replace function public.mark_order_paid(p_order_id uuid, p_payment_id text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid;
begin
  update public.orders
     set status = 'paid', razorpay_payment_id = p_payment_id, paid_at = now()
   where id = p_order_id and status = 'pending'
  returning user_id into v_user;

  if not found then
    return false;
  end if;

  update public.product_variants v
     set stock = greatest(v.stock - oi.qty, 0)
    from (
      select variant_id, sum(quantity) as qty
        from public.order_items
       where order_id = p_order_id and variant_id is not null
       group by variant_id
    ) oi
   where v.id = oi.variant_id;

  if v_user is not null then
    delete from public.cart_items c
     where c.user_id = v_user
       and c.variant_id in (select variant_id from public.order_items where order_id = p_order_id);
  end if;

  return true;
end $$;

revoke execute on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;
alter table public.cart_items       enable row level security;
alter table public.addresses        enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

-- profiles
drop policy if exists "Profiles: read own or admin" on public.profiles;
create policy "Profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "Profiles: admin update" on public.profiles;
create policy "Profiles: admin update" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- categories (public read, admin write)
drop policy if exists "Categories: public read" on public.categories;
create policy "Categories: public read" on public.categories
  for select using (true);
drop policy if exists "Categories: admin write" on public.categories;
create policy "Categories: admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- products (public read of active products, admin sees and writes all)
drop policy if exists "Products: public read active" on public.products;
create policy "Products: public read active" on public.products
  for select using (is_active or public.is_admin());
drop policy if exists "Products: admin write" on public.products;
create policy "Products: admin write" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- product images
drop policy if exists "Product images: public read" on public.product_images;
create policy "Product images: public read" on public.product_images
  for select using (true);
drop policy if exists "Product images: admin write" on public.product_images;
create policy "Product images: admin write" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- product variants (sizes / stock)
drop policy if exists "Variants: public read" on public.product_variants;
create policy "Variants: public read" on public.product_variants
  for select using (true);
drop policy if exists "Variants: admin write" on public.product_variants;
create policy "Variants: admin write" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- cart items (own rows only)
drop policy if exists "Cart: own rows" on public.cart_items;
create policy "Cart: own rows" on public.cart_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- addresses (own rows only)
drop policy if exists "Addresses: own rows" on public.addresses;
create policy "Addresses: own rows" on public.addresses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- orders: customers read their own; only admins update. Inserts happen on the
-- server with the service role key (which bypasses RLS).
drop policy if exists "Orders: read own or admin" on public.orders;
create policy "Orders: read own or admin" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "Orders: admin update" on public.orders;
create policy "Orders: admin update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- order items
drop policy if exists "Order items: read own or admin" on public.order_items;
create policy "Order items: read own or admin" on public.order_items
  for select to authenticated using (
    public.is_admin() or exists (
      select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Storage: product-images bucket (public read, admin-only write)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images', 'product-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files by URL without a SELECT policy; this one lets
-- admins list/replace files from the dashboard UI.
drop policy if exists "Product images bucket: admin read" on storage.objects;
create policy "Product images bucket: admin read" on storage.objects
  for select to authenticated using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Product images bucket: admin insert" on storage.objects;
create policy "Product images bucket: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Product images bucket: admin update" on storage.objects;
create policy "Product images bucket: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Product images bucket: admin delete" on storage.objects;
create policy "Product images bucket: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
