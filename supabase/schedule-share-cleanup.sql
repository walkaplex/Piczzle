-- Run as an administrator AFTER reviewing the expiry policy.
-- Enable pg_cron in Supabase first. This deletes already-expired images daily.
select cron.schedule(
  'piczzle-expired-shares',
  '15 3 * * *',
  $$select public.delete_expired_shared_puzzles();$$
);
