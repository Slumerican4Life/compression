-- Create a function to get all users with their subscription info (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  phone_number text,
  subscribed boolean,
  subscription_tier text,
  subscription_end timestamp with time zone,
  is_gifted boolean,
  gifted_by text,
  trial_end timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.email()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    COALESCE(s.email, au.email) as email,
    p.display_name,
    p.phone_number,
    COALESCE(s.subscribed, false) as subscribed,
    s.subscription_tier,
    s.subscription_end,
    COALESCE(s.is_gifted, false) as is_gifted,
    s.gifted_by,
    s.trial_end,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.subscribers s ON p.user_id = s.user_id OR s.email = (
    SELECT email FROM auth.users WHERE id = p.user_id
  )
  LEFT JOIN auth.users au ON au.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;