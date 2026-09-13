-- Real, persisted notification preferences — the previous UI toggles
-- were never actually saved anywhere, which is why they appeared to
-- reset every time.
alter table public.businesses add column if not exists notification_preferences jsonb not null default '{"calls": false, "escalations": true, "digest": false}'::jsonb;
