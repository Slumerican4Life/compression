-- Fix security issues and set up proper admin access

-- 1. Fix function search paths for security
CREATE OR REPLACE FUNCTION public.has_premium_access(user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
$function$;

CREATE OR REPLACE FUNCTION public.start_trial_if_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
      now() + interval '3 days',
      false,
      now(),
      now()
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$function$;

-- 2. Add your admin account
INSERT INTO public.admin_users (email, role) 
VALUES ('cleanasawhistle1000@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 3. Add phone number to profiles for search functionality
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 4. Create index for faster user search
CREATE INDEX IF NOT EXISTS idx_profiles_email_search ON public.profiles USING gin(to_tsvector('english', COALESCE(display_name, '')));
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;