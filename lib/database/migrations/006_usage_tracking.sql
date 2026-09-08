-- Migration: real per-business AI usage tracking
--
-- Why this exists: Anthropic and ElevenLabs are both billed to ONE
-- shared HavnLine account across every business — neither provider's
-- own dashboard can tell you what any single business is costing you.
-- This table is HavnLine's own internal record of every AI call,
-- attributed to the business that triggered it, so real per-business
-- cost estimates are possible.
--
-- Twilio is different: since each business already has its own
-- sub-account, its cost is computed directly from real call duration
-- already stored in the calls table — no new tracking needed for that
-- one.
--
-- Every cost here is clearly an ESTIMATE based on the provider's
-- published rate at the time of the call — never a real provider
-- invoice. The rate used is stored alongside each record so historical
-- estimates stay accurate even if pricing changes later.

create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  provider text not null check (provider in ('anthropic', 'elevenlabs')),
  event_type text not null, -- e.g. 'chat_completion', 'voice_synthesis'
  quantity numeric not null, -- tokens or characters
  unit text not null, -- 'tokens' or 'characters'
  estimated_cost_cents numeric not null,
  rate_note text, -- which price this was calculated at, for historical accuracy
  created_at timestamptz not null default now()
);

create index idx_usage_records_business on public.usage_records(business_id);
create index idx_usage_records_provider on public.usage_records(provider);

-- Written exclusively by server-side code using the service role key —
-- never insertable directly by a business's own logged-in session.
alter table public.usage_records enable row level security;

create policy "No direct client access to usage records"
  on public.usage_records for all
  using (false)
  with check (false);
