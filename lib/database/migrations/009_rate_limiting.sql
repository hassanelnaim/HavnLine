-- Generic, reusable rate-limit tracking — backs any public,
-- unauthenticated endpoint that could otherwise be spammed (review
-- submissions today, anything else added later). Each row is one hit;
-- old rows are cheap to prune since this table is meant to stay small.
create table public.rate_limit_hits (
  id uuid primary key default gen_random_uuid(),
  rate_key text not null,
  created_at timestamptz not null default now()
);

create index idx_rate_limit_hits_key_time on public.rate_limit_hits(rate_key, created_at);

alter table public.rate_limit_hits enable row level security;

create policy "No direct client access to rate limit data"
  on public.rate_limit_hits for all
  using (false)
  with check (false);
