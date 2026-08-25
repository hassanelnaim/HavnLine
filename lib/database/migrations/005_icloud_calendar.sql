-- Allows iCloud Calendar as a real integration option, alongside Google
-- Calendar. Unlike Google, iCloud doesn't use OAuth — it uses CalDAV
-- with an Apple-generated "app-specific password," so metadata stores
-- those credentials directly rather than OAuth tokens.

alter table public.integrations drop constraint if exists integrations_provider_check;

alter table public.integrations
  add constraint integrations_provider_check
  check (provider in ('google_calendar', 'icloud_calendar', 'microsoft_outlook', 'twilio', 'sms', 'voice_provider'));
