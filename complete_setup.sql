-- Add onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT,
ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE;

-- Update existing profiles to have onboarded = false
UPDATE public.profiles SET onboarded = FALSE WHERE onboarded IS NULL;

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, age, gender_orientation, bio, location, onboarded)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE((NEW.raw_user_meta_data ->> 'age')::INTEGER, 18),
    COALESCE(NEW.raw_user_meta_data ->> 'gender_orientation', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'bio', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'location', ''),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- Storage policies for profile photos
CREATE POLICY "Users can upload their own photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Photos are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update their own photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for chats table
ALTER PUBLICATION supabase_realtime ADD TABLE chats;