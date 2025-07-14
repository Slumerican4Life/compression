-- Update trial period from 7 days to 3 days
ALTER TABLE public.subscribers ALTER COLUMN trial_end SET DEFAULT (now() + interval '3 days');

-- Update the trigger function to use 3 days instead of 7
CREATE OR REPLACE FUNCTION public.start_trial_if_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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