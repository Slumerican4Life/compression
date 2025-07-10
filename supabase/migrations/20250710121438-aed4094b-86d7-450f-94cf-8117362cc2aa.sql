-- Create admin_users table for special accounts
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view admin users
CREATE POLICY "Admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (email = auth.email());

-- Insert the initial owner email
INSERT INTO public.admin_users (email, role) 
VALUES ('cleanasawhistle1000@gmail.com', 'owner');

-- Add gifted_by column to subscribers table to track who gifted the subscription
ALTER TABLE public.subscribers 
ADD COLUMN gifted_by TEXT,
ADD COLUMN gift_message TEXT,
ADD COLUMN is_gifted BOOLEAN DEFAULT false;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
$$;

-- Create policy for admins to view all subscribers
CREATE POLICY "Admins can view all subscribers" 
ON public.subscribers 
FOR SELECT 
USING (public.is_admin(auth.email()));

-- Create policy for admins to update all subscribers
CREATE POLICY "Admins can update all subscribers" 
ON public.subscribers 
FOR UPDATE 
USING (public.is_admin(auth.email()));

-- Add trigger for updated_at on admin_users
CREATE TRIGGER update_admin_users_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();