alter table public.companies
  add column profile jsonb not null default '{}'::jsonb
  check (jsonb_typeof(profile) = 'object');
