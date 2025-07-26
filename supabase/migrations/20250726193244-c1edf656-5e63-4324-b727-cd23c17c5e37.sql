-- Update the subscriber record to link it to the correct user profile
UPDATE public.subscribers 
SET user_id = '46d91a12-1c89-4e60-8e4d-f76d82a43172'
WHERE email = 'cleanasawhistle1000@gmail.com' AND user_id IS NULL;