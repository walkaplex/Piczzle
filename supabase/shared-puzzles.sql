create extension if not exists pgcrypto;

create table if not exists public.shared_puzzles (
  id text primary key default encode(gen_random_bytes(9), 'hex'),
  image text not null,
  size integer not null check (size in (4, 6, 8)),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

alter table public.shared_puzzles enable row level security;

drop policy if exists "Anyone can create shared puzzles" on public.shared_puzzles;
create policy "Anyone can create shared puzzles"
on public.shared_puzzles
for insert
to anon
with check (
  image like 'data:image/%'
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
