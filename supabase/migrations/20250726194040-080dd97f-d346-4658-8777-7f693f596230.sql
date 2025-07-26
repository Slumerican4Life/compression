-- Let's add a test user to demonstrate the admin panel
-- First, let's add a profile for a test user
INSERT INTO public.profiles (user_id, display_name, phone_number)
VALUES (
  gen_random_uuid(), 
  'Test User', 
  '+1234567890'
);

-- Add a corresponding subscriber record
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, trial_start, trial_end)
VALUES (
  (SELECT user_id FROM public.profiles WHERE display_name = 'Test User'),
  'testuser@example.com',
  false,
  NULL,
  now(),
  now() + interval '3 days'
);