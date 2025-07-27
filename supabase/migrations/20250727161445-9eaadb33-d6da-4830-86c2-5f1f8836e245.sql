-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view feedback (public reviews)
CREATE POLICY "Anyone can view feedback" 
ON public.feedback 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own feedback
CREATE POLICY "Users can create feedback" 
ON public.feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow admins to view and manage all feedback
CREATE POLICY "Admins can manage all feedback" 
ON public.feedback 
FOR ALL 
USING (is_admin(auth.email()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();