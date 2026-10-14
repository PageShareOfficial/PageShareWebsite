-- Grant (or revoke) PageShare admin for one account.
-- Run in the Supabase SQL editor. Replace the placeholder email locally; never commit a real one.
-- Admin = users.badge 'admin' (constraint from alembic 0003). The Supabase function
-- public.is_admin() checks the same column, so it returns true after this runs.
-- Admins get the purple tick, the /admin portal, and every premium feature without a subscription.
-- Run once per project (dev and prod).
-- The account must have finished onboarding so a row exists in public.users.

UPDATE public.users
SET badge = 'admin', updated_at = now()
WHERE id = (SELECT id FROM auth.users WHERE lower(email) = lower('YOUR_EMAIL@gmail.com'))
RETURNING id, username, badge;

-- Revoke:
-- UPDATE public.users SET badge = NULL, updated_at = now()
-- WHERE id = (SELECT id FROM auth.users WHERE lower(email) = lower('YOUR_EMAIL@gmail.com'));
