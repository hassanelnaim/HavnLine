-- Adds billing/subscription fields to the businesses table.
-- Run this once in Supabase's SQL Editor (same place you ran the
-- original schema.sql).

alter table public.businesses
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text not null default 'none'
    check (subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  add column if not exists current_period_end timestamptz;

create index if not exists businesses_stripe_customer_idx on public.businesses(stripe_customer_id);
