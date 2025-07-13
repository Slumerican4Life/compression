-- Add trial_start and trial_end columns to subscribers table for 7-day free trial
ALTER TABLE public.subscribers 
ADD COLUMN trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_end TIMESTAMP WITH TIME ZONE;

-- Add 2FA columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN two_factor_secret TEXT,
ADD COLUMN backup_codes TEXT[];

-- Create function to check if user is in trial period or has active subscription
CREATE OR REPLACE FUNCTION public.has_premium_access(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN subscribed = true THEN true
        WHEN is_gifted = true AND subscription_end > now() THEN true
        WHEN trial_end IS NOT NULL AND trial_end > now() THEN true
        ELSE false
      END
    FROM public.subscribers 
    WHERE email = user_email
    LIMIT 1), 
    false
  );
$$;

-- Create function to start trial for new users
CREATE OR REPLACE FUNCTION public.start_trial_if_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only start trial if no existing record
  IF NOT EXISTS (SELECT 1 FROM public.subscribers WHERE email = NEW.email) THEN
    INSERT INTO public.subscribers (
      user_id, 
      email, 
      trial_start, 
      trial_end, 
      subscribed,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      now(),
      now() + interval '7 days',
      false,
      now(),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically start trial for new users
CREATE TRIGGER on_auth_user_created_start_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.start_trial_if_new_user();