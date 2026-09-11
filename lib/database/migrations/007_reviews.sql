-- Real customer reviews, with mandatory moderation before anything
-- goes public. Anyone can submit; only the platform admin can approve
-- what actually shows on the homepage — this is what keeps the
-- section honest, since nothing appears without a real human review.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  reviewer_name text not null,
  rating int not null check (rating between 1 and 5),
  review_text text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index idx_reviews_status on public.reviews(status);

alter table public.reviews enable row level security;

-- Anyone can submit a review — no login required, since reviewers are
-- business owners using the product, not necessarily logged into a
-- dashboard at the moment they want to leave feedback.
create policy "Anyone can submit a review"
  on public.reviews for insert
  with check (status = 'pending');

-- The public can only ever see reviews that have actually been
-- approved — nothing pending or rejected is visible to anyone but the
-- admin (enforced via the service-role client in admin code, which
-- bypasses RLS entirely for moderation).
create policy "Public can view approved reviews"
  on public.reviews for select
  using (status = 'approved');
