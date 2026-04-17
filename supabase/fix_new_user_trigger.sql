-- =============================================
-- DesiDarling.ai — Fix New User Seeding + Cron Jobs
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Run ALL of this at once (Ctrl+A then Run)
-- =============================================

-- ── 1. Fix plan constraint to only allow 'free' and 'trial' ──────────────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'trial'));

-- Fix any orphaned plans
UPDATE public.profiles
  SET plan = 'free'
  WHERE plan NOT IN ('free', 'trial') OR plan IS NULL;

-- Fix subscriptions table plan constraint too
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'trial'));

UPDATE public.subscriptions
  SET plan = 'free'
  WHERE plan NOT IN ('free', 'trial') OR plan IS NULL;


-- ── 2. Add missing columns if not present ────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS images_today       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS call_seconds_today INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_today       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_reset_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS trial_expires_at   TIMESTAMPTZ;


-- ── 3. Fix the NEW USER trigger — seeds correct values for free plan ──────────
--
-- This is the CRITICAL function. Every new user who signs up gets:
--   • plan = 'free'
--   • tokens = 35 (free daily limit)
--   • images_today = 0
--   • call_seconds_today = 0
--   • usage_reset_at = NOW()
--
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    plan,
    tokens,
    images_today,
    call_seconds_today,
    tokens_today,
    usage_reset_at,
    trial_expires_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    'free',       -- default plan
    35,           -- 35 free tokens per day
    0,            -- 0 images used
    0,            -- 0 call seconds used
    0,            -- 0 tokens used counter
    NOW(),        -- reset timestamp
    NULL          -- no trial yet
  )
  ON CONFLICT (id) DO NOTHING;  -- safe: won't overwrite existing profile
  RETURN NEW;
END;
$$;

-- Recreate the trigger (safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 4. Fix existing users who have NULL or wrong token counts ─────────────────
UPDATE public.profiles
  SET
    tokens             = CASE plan WHEN 'trial' THEN 70 ELSE 35 END,
    images_today       = COALESCE(images_today, 0),
    call_seconds_today = COALESCE(call_seconds_today, 0),
    tokens_today       = COALESCE(tokens_today, 0),
    usage_reset_at     = COALESCE(usage_reset_at, NOW())
  WHERE tokens IS NULL OR tokens > 70;
-- (tokens > 70 catches the old default of 50 which was wrong)


-- ── 5. Daily usage reset function ────────────────────────────────────────────
--
-- Resets every user's daily counters at midnight.
-- For free users: 35 tokens, 0 images, 0 call seconds
-- For trial users: 70 tokens, 0 images, 0 call seconds
-- (Trial users beyond their expiry will be downgraded by expire_trials first)
--
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET
    tokens             = CASE plan WHEN 'trial' THEN 70 ELSE 35 END,
    images_today       = 0,
    call_seconds_today = 0,
    tokens_today       = 0,
    usage_reset_at     = NOW();
END;
$$;


-- ── 6. Trial expiry function ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Mark subscriptions expired
  UPDATE public.subscriptions
    SET status = 'expired', updated_at = NOW()
    WHERE plan = 'trial'
      AND status = 'active'
      AND trial_expires_at < NOW();

  -- Downgrade profiles back to free, reset tokens, clear trial expiry
  UPDATE public.profiles p
    SET
      plan             = 'free',
      tokens           = 35,
      trial_expires_at = NULL,
      updated_at       = NOW()
    FROM public.subscriptions s
    WHERE s.user_id = p.id
      AND s.plan = 'trial'
      AND s.status = 'expired'
      AND p.plan = 'trial';
END;
$$;


-- ── 7. Enable pg_cron extension (needed for scheduled jobs) ──────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;


-- ── 8. Schedule: reset usage every day at 00:00 IST (18:30 UTC) ─────────────
SELECT cron.unschedule('reset_daily_usage') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'reset_daily_usage'
);
SELECT cron.schedule(
  'reset_daily_usage',
  '30 18 * * *',              -- 18:30 UTC = midnight IST
  'SELECT public.reset_daily_usage();'
);


-- ── 9. Schedule: expire trials every hour ─────────────────────────────────────
SELECT cron.unschedule('expire_trials') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expire_trials'
);
SELECT cron.schedule(
  'expire_trials',
  '0 * * * *',                -- every hour on the hour
  'SELECT public.expire_trials();'
);


-- ── 10. RLS: ensure service role can update profiles (needed for cron jobs) ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Service role bypass'
  ) THEN
    CREATE POLICY "Service role bypass"
      ON public.profiles FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;


-- ✅ Done! Verify cron jobs are running:
-- SELECT * FROM cron.job;
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
