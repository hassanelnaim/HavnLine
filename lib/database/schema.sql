-- ============================================================================
-- GetMade — Supabase schema (Phase 1 foundation)
-- ============================================================================
-- Run this against a Supabase project to provision the production schema.
-- Every business-scoped table carries a business_id and an RLS policy that
-- restricts access to members of that business, so one business can never
-- read or write another business's data.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- users (mirrors auth.users; kept as a public profile table)
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- businesses
-- ----------------------------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type text,
  description text,
  address text,
  phone text,
  website text,
  timezone text not null default 'America/New_York',
  onboarding_step text not null default 'business_info'
    check (onboarding_step in ('business_info','hours','services','ai_receptionist','voice','calendar','complete')),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- business_members — join table enabling multiple users per business
-- ----------------------------------------------------------------------------
create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

-- ----------------------------------------------------------------------------
-- services
-- ----------------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price_cents integer not null default 0,
  duration_minutes integer not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- business_hours — one row per weekday per business
-- ----------------------------------------------------------------------------
create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  weekday text not null check (weekday in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  is_open boolean not null default true,
  open_time time,
  close_time time,
  unique (business_id, weekday)
);

-- ----------------------------------------------------------------------------
-- ai_receptionists — one active configuration per business
-- ----------------------------------------------------------------------------
create table if not exists public.ai_receptionists (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  name text not null default 'Alex',
  personality text not null default 'professional'
    check (personality in ('professional','friendly','warm','energetic','calm')),
  responsibilities jsonb not null default '{
    "answer_questions": true,
    "schedule_appointments": true,
    "reschedule_appointments": true,
    "cancel_appointments": false,
    "collect_customer_info": true,
    "escalate_to_human": true
  }'::jsonb,
  status text not null default 'offline' check (status in ('online','offline')),
  escalation_rules text,
  booking_rules text,
  generated_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ai_voice_configs — internal voice_id, decoupled from any provider
-- ----------------------------------------------------------------------------
create table if not exists public.ai_voice_configs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  voice_id text not null check (voice_id in ('alex_professional','sarah_warm','james_calm','emma_friendly')),
  provider text,               -- e.g. 'elevenlabs'; null until an integration is connected
  provider_voice_ref text,     -- provider-specific voice reference
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- customers
-- ----------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customers_business_idx on public.customers(business_id);

-- ----------------------------------------------------------------------------
-- calls
-- ----------------------------------------------------------------------------
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  phone text not null,
  started_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  outcome text not null default 'no_action'
    check (outcome in ('appointment_booked','question_answered','escalated','no_action','missed')),
  status text not null default 'completed'
    check (status in ('completed','in_progress','missed','voicemail')),
  handled_by text not null default 'ai' check (handled_by in ('ai','human')),
  escalation_reason text,
  recording_url text,
  created_at timestamptz not null default now()
);
create index if not exists calls_business_idx on public.calls(business_id);

-- ----------------------------------------------------------------------------
-- call_messages — transcript entries for a call
-- ----------------------------------------------------------------------------
create table if not exists public.call_messages (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  role text not null check (role in ('customer','ai','system')),
  content text not null,
  tool_call jsonb,
  created_at timestamptz not null default now()
);
create index if not exists call_messages_call_idx on public.call_messages(call_id);

-- ----------------------------------------------------------------------------
-- appointments
-- ----------------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  phone text not null,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  date date not null,
  time text not null,
  status text not null default 'confirmed'
    check (status in ('confirmed','pending','cancelled','completed','no_show')),
  created_via text not null default 'ai' check (created_via in ('ai','human')),
  created_at timestamptz not null default now()
);
create index if not exists appointments_business_idx on public.appointments(business_id);

-- ----------------------------------------------------------------------------
-- knowledge_items
-- ----------------------------------------------------------------------------
create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null default 'custom'
    check (category in ('business_info','services','pricing','faq','policy','custom')),
  question text,
  title text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists knowledge_items_business_idx on public.knowledge_items(business_id);

-- ----------------------------------------------------------------------------
-- integrations
-- ----------------------------------------------------------------------------
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null
    check (provider in ('google_calendar','microsoft_outlook','twilio','sms','voice_provider')),
  status text not null default 'not_connected'
    check (status in ('connected','not_connected','coming_soon')),
  external_account_id text,
  connected_at timestamptz,
  metadata jsonb,
  unique (business_id, provider)
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.ai_receptionists enable row level security;
alter table public.ai_voice_configs enable row level security;
alter table public.customers enable row level security;
alter table public.calls enable row level security;
alter table public.call_messages enable row level security;
alter table public.appointments enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.integrations enable row level security;

-- Helper: is the current user a member of a given business?
create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
  );
$$;

-- users: a user can only read/update their own row
create policy "users_select_self" on public.users
  for select using (id = auth.uid());
create policy "users_update_self" on public.users
  for update using (id = auth.uid());

-- businesses: only members can read/update; any authenticated user can create
-- (they become the owner via business_members immediately after in the same transaction)
create policy "businesses_select_member" on public.businesses
  for select using (public.is_business_member(id));
create policy "businesses_insert_authenticated" on public.businesses
  for insert with check (auth.uid() is not null);
create policy "businesses_update_member" on public.businesses
  for update using (public.is_business_member(id));

-- business_members: members can see co-members of their own business
create policy "business_members_select_member" on public.business_members
  for select using (public.is_business_member(business_id));
create policy "business_members_insert_self" on public.business_members
  for insert with check (user_id = auth.uid());

-- Generic pattern applied to every business-scoped table below:
-- members of the business may select/insert/update/delete rows tied to it.

create policy "services_all_member" on public.services
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "business_hours_all_member" on public.business_hours
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "ai_receptionists_all_member" on public.ai_receptionists
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "ai_voice_configs_all_member" on public.ai_voice_configs
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "customers_all_member" on public.customers
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "calls_all_member" on public.calls
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "call_messages_all_member" on public.call_messages
  for all using (
    exists (
      select 1 from public.calls c
      where c.id = call_messages.call_id
        and public.is_business_member(c.business_id)
    )
  );

create policy "appointments_all_member" on public.appointments
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "knowledge_items_all_member" on public.knowledge_items
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "integrations_all_member" on public.integrations
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- ============================================================================
-- updated_at trigger helper
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger businesses_set_updated_at before update on public.businesses
  for each row execute procedure public.set_updated_at();
create trigger services_set_updated_at before update on public.services
  for each row execute procedure public.set_updated_at();
create trigger ai_receptionists_set_updated_at before update on public.ai_receptionists
  for each row execute procedure public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers
  for each row execute procedure public.set_updated_at();
create trigger knowledge_items_set_updated_at before update on public.knowledge_items
  for each row execute procedure public.set_updated_at();
