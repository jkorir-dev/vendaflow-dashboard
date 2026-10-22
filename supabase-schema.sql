-- Run this once in the Supabase SQL Editor for the VendaFlow project.
create extension if not exists pgcrypto;

create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users (id) on delete cascade,
    title text not null,
    category text not null,
    "wholesaleCost" numeric(12, 2) not null check ("wholesaleCost" > 0),
    "retailPrice" numeric(12, 2) not null check ("retailPrice" > 0),
    "stockQuantity" integer not null check ("stockQuantity" >= 0),
    sku text not null,
    "dateLogged" text not null,
    "imageUrl" text,
    rating smallint not null default 5 check (rating between 1 and 5),
    created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Users can read their own products" on public.products;
create policy "Users can read their own products"
    on public.products for select
    to authenticated
    using ((select auth.uid()) = owner_id);

drop policy if exists "Users can add their own products" on public.products;
create policy "Users can add their own products"
    on public.products for insert
    to authenticated
    with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can update their own products" on public.products;
create policy "Users can update their own products"
    on public.products for update
    to authenticated
    using ((select auth.uid()) = owner_id)
    with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete their own products" on public.products;
create policy "Users can delete their own products"
    on public.products for delete
    to authenticated
    using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.products to authenticated;
