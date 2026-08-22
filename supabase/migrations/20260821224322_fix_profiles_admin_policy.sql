create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "View All Admin" on profiles;

create policy "View All Admin" on profiles
for select
to authenticated
using (public.is_admin());
