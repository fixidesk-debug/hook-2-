-- Add onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT,
ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update existing profiles
UPDATE public.profiles SET onboarded = FALSE WHERE onboarded IS NULL;

-- Update user creation function
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

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true), ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Photos publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Chat media publicly viewable" ON storage.objects;

CREATE POLICY "Users upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Photos publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id IN ('profile-photos', 'chat-media'));

CREATE POLICY "Users update own photos" ON storage.objects
  FOR UPDATE USING (bucket_id IN ('profile-photos', 'chat-media') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own photos" ON storage.objects
  FOR DELETE USING (bucket_id IN ('profile-photos', 'chat-media') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for chats and matches
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;