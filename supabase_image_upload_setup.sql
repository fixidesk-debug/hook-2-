-- =====================================================
-- COMPLETE SUPABASE SETUP FOR IMAGE UPLOAD FEATURES
-- =====================================================
-- Run this in Supabase SQL Editor to enable image uploads

-- 1. CREATE STORAGE BUCKETS
-- ========================

-- Create profile-photos bucket (public for easy access)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create chat-media bucket (public for easy access)  
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. STORAGE SECURITY POLICIES  
-- ============================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Photos publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Chat media publicly viewable" ON storage.objects;

-- PROFILE PHOTOS POLICIES
-- Profile uploads use format: {user_id}/{filename}
CREATE POLICY "Users can upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- CHAT MEDIA POLICIES  
-- Chat uploads use format: chat/{user_id}/{filename}
CREATE POLICY "Users upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-media' 
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND (storage.foldername(name))[1] = 'chat'
  );

CREATE POLICY "Users update chat media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'chat-media' 
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND (storage.foldername(name))[1] = 'chat'
  );

CREATE POLICY "Users delete chat media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-media' 
    AND auth.uid()::text = (storage.foldername(name))[2]
    AND (storage.foldername(name))[1] = 'chat'
  );

-- PUBLIC READ ACCESS for both buckets
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('profile-photos', 'chat-media'));

-- 3. PHOTO VALIDATION (Optional but recommended)
-- =============================================

-- Function to limit photos to 6 per profile
CREATE OR REPLACE FUNCTION validate_photos_array()
RETURNS TRIGGER AS $$
BEGIN
  IF array_length(NEW.photos, 1) > 6 THEN
    RAISE EXCEPTION 'Maximum 6 photos allowed per profile';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce photo limit
DROP TRIGGER IF EXISTS validate_photos_trigger ON public.profiles;
CREATE TRIGGER validate_photos_trigger
  BEFORE UPDATE OF photos ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_photos_array();

-- 4. ENABLE REALTIME (for live updates)
-- =====================================

-- Enable realtime for matches and chats
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE matches;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN  
    ALTER PUBLICATION supabase_realtime ADD TABLE chats;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 5. VERIFY SETUP
-- ===============

-- Check that buckets exist
SELECT name, public FROM storage.buckets WHERE id IN ('profile-photos', 'chat-media');

-- Check that policies are created  
SELECT policyname, tablename FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check that photos column exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'photos';

-- =====================================================
-- SETUP COMPLETE! 
-- Your app can now upload and display profile images
-- =====================================================
