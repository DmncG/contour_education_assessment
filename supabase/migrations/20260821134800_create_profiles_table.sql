create type role as enum ('student', 'admin');

create table public.profiles (
  id uuid primary key default gen_random_uuid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  role role not null default 'student'
);

alter table public.profiles enable row level security;

grant select on public.profiles to authenticated;

create policy "View Profile" on public.profiles
for select
to authenticated
using (id = auth.uid());
