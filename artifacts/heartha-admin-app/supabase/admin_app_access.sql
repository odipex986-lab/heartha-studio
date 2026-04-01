drop policy if exists "Admins can read contact inquiries" on public.contact_inquiries;
create policy "Admins can read contact inquiries"
on public.contact_inquiries
for select
to authenticated
using (
  lower(coalesce(auth.jwt()->>'email', '')) in (
    'odipex986@gmail.com',
    'hearthastudio@gmail.com'
  )
);

drop policy if exists "Admins can update contact inquiries" on public.contact_inquiries;
create policy "Admins can update contact inquiries"
on public.contact_inquiries
for update
to authenticated
using (
  lower(coalesce(auth.jwt()->>'email', '')) in (
    'odipex986@gmail.com',
    'hearthastudio@gmail.com'
  )
)
with check (
  lower(coalesce(auth.jwt()->>'email', '')) in (
    'odipex986@gmail.com',
    'hearthastudio@gmail.com'
  )
);
