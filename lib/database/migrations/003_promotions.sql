-- Lets a business owner enter time-bound discounts/promotions that the
-- AI can answer questions about directly, instead of escalating every
-- discount question to a human.
--
-- Run this once in Supabase's SQL Editor (same place as the other migrations).

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  description text not null,
  applies_to text,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists promotions_business_idx on public.promotions(business_id);

alter table public.promotions enable row level security;

create policy "promotions_all_member" on public.promotions
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
