-- =============================================
-- DesiDarling.ai — Payment & Usage Migration v2
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)
-- =============================================

-- ── 1. Extend profiles with daily usage tracking ─────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS images_today       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS call_seconds_today INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_today       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_reset_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS trial_expires_at   TIMESTAMPTZ;

-- Make sure tokens column exists (might already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tokens INTEGER DEFAULT 35;

-- Seed tokens = 35 for any existing users who have NULL tokens
UPDATE public.profiles SET tokens = 35 WHERE tokens IS NULL;

-- ── 2. Update plan CHECK — only 'free' and 'trial' ───────────────────────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free','trial'));

-- Set default plan for existing users with no plan or old plans
UPDATE public.profiles
  SET plan = 'free'
  WHERE plan NOT IN ('free','trial') OR plan IS NULL;

-- ── 3. Subscriptions table ────────────────────────────────────────────────────
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free','trial'));

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS europay_order_id   TEXT,   -- legacy name, kept for compatibility
  ADD COLUMN IF NOT EXISTS uropay_order_id    TEXT,   -- new canonical name
  ADD COLUMN IF NOT EXISTS uropay_payment_id  TEXT,
  ADD COLUMN IF NOT EXISTS europay_payment_id TEXT,   -- legacy payment ref
  ADD COLUMN IF NOT EXISTS trial_started_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_expires_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS amount_inr         INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS notified_expiry    BOOLEAN DEFAULT FALSE;

-- ── 4. Index for quick trial expiry queries ───────────────────────────────────
CREATE INDEX IF NOT EXISTS subscriptions_trial_expires_idx
  ON public.subscriptions(trial_expires_at)
  WHERE plan = 'trial' AND status = 'active';

-- ── 5. Daily usage reset function (schedule via Supabase Cron) ────────────────
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
  -- Mark subscriptions as expired
  UPDATE public.subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE plan = 'trial'
    AND status = 'active'
    AND trial_expires_at < NOW();

  -- Downgrade user plan back to free + reset tokens, clear trial_expires_at
  UPDATE public.profiles p
  SET
    plan = 'free',
    tokens = 35,
    trial_expires_at = NULL,   -- ← clear so checkUsageLimit stops blocking
    updated_at = NOW()
  FROM public.subscriptions s
  WHERE s.user_id = p.id
    AND s.plan = 'trial'
    AND s.status = 'expired'
    AND p.plan = 'trial';
END;
$$;

-- ── 7. RLS policy for profiles (ensure users can update their own row) ─────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- ✅ Migration complete! Now schedule these in Supabase Dashboard → Database → Cron:
--   reset_daily_usage()  → every day at 00:00 IST (18:30 UTC)
--   expire_trials()      → every hour
