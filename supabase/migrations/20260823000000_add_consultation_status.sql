create type consultation_status as enum ('scheduled', 'completed', 'cancelled');

alter table public.consultations
  add column status consultation_status not null default 'scheduled';
