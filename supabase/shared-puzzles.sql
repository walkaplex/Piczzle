create extension if not exists pgcrypto;

create table if not exists public.shared_puzzles (
  id text primary key default encode(gen_random_bytes(9), 'hex'),
  image text not null,
  size integer not null check (size in (4, 6, 8)),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  constraint shared_puzzles_image_size check (char_length(image) <= 2500000)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shared_puzzles_image_size'
      and conrelid = 'public.shared_puzzles'::regclass
  ) then
    alter table public.shared_puzzles
    add constraint shared_puzzles_image_size
    check (char_length(image) <= 2500000);
  end if;
end $$;

alter table public.shared_puzzles enable row level security;

drop policy if exists "Anyone can create shared puzzles" on public.shared_puzzles;
create policy "Anyone can create shared puzzles"
on public.shared_puzzles
for insert
to anon
with check (
  image like 'data:image/%'
  and char_length(image) <= 2500000
  and size in (4, 6, 8)
  and expires_at <= now() + interval '31 days'
);

drop policy if exists "Anyone can open unexpired shared puzzles" on public.shared_puzzles;
create policy "Anyone can open unexpired shared puzzles"
on public.shared_puzzles
for select
to anon
using (expires_at > now());

create index if not exists shared_puzzles_expires_at_idx
on public.shared_puzzles (expires_at);

create or replace function public.delete_expired_shared_puzzles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.shared_puzzles
  where expires_at <= now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_expired_shared_puzzles() from public;
revoke all on function public.delete_expired_shared_puzzles() from anon;
revoke all on function public.delete_expired_shared_puzzles() from authenticated;
grant execute on function public.delete_expired_shared_puzzles() to service_role;
