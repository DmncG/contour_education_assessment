create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  consult_reason text default '',
  date_time timestamptz not null default now()
);

alter table public.consultations enable row level security;

grant select, insert, update, delete on public.consultations to authenticated;

create policy "View All Admin" on public.consultations
for select
to authenticated
using (public.is_admin());

create policy "View Own Consultations" on public.consultations
for select
to authenticated
using (student_id = auth.uid());

create policy "Insert Own Consultations" on public.consultations
for insert
to authenticated
with check (student_id = auth.uid());

create policy "Update Own Consultations" on public.consultations
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "Delete Own Consultations" on public.consultations
for delete
to authenticated
using (student_id = auth.uid());
