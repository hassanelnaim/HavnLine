-- Allows a business to select a real, specific ElevenLabs voice from
-- their own voice library, instead of only the 4 built-in presets.
-- 'custom' means: use provider_voice_ref (the real ElevenLabs voice
-- id) directly, rather than mapping from one of the 4 preset names.

alter table public.ai_voice_configs drop constraint if exists ai_voice_configs_voice_id_check;

alter table public.ai_voice_configs
  add constraint ai_voice_configs_voice_id_check
  check (voice_id in ('alex_professional', 'sarah_warm', 'james_calm', 'emma_friendly', 'custom'));

alter table public.ai_voice_configs
  add column if not exists provider_voice_name text; -- display name, e.g. "Rachel" — avoids re-fetching from ElevenLabs just to show a label
