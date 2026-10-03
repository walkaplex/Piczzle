-- First rollout step only. Keep existing clients and table policies working.
-- Apply to the existing Piczzle project before publishing updated clients.
begin;

create or replace function public.get_shared_puzzle(puzzle_id text)
returns table (id text, image text, size integer, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.image, p.size, p.created_at
  from public.shared_puzzles p
  where p.id = puzzle_id and p.expires_at > now()
  limit 1;
$$;

revoke all on function public.get_shared_puzzle(text) from public;
grant execute on function public.get_shared_puzzle(text) to anon;

commit;
