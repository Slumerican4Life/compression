-- Fix AdminPanel data source and add trigger for new users

-- 1. Create trigger to automatically add new users to subscribers table when they sign up
CREATE OR REPLACE FUNCTION public.create_subscriber_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Add user to subscribers table with trial
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
    now() + interval '3 days',
    false,
    now(),
    now()
  ) ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created_subscriber ON auth.users;
CREATE TRIGGER on_auth_user_created_subscriber
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_subscriber_on_signup();

-- 2. Add the admin user to subscribers table so they can gift themselves
INSERT INTO public.subscribers (
  email,
  trial_start,
  trial_end,
  subscribed,
  created_at,
  updated_at
) VALUES (
  'cleanasawhistle1000@gmail.com',
  now(),
  now() + interval '3 days',
  false,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;