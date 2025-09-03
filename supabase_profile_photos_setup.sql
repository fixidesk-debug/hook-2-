-- Ensure photos column exists and is properly configured
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing profiles to have empty photos array if null
UPDATE public.profiles 
SET photos = ARRAY[]::TEXT[] 
WHERE photos IS NULL;

-- Create storage bucket for profile photos (skip if exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Photos publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Create storage policies for profile photos
CREATE POLICY "Users can upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Photos publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

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

-- Ensure RLS policies for profiles table
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to validate photo array (max 6 photos)
CREATE OR REPLACE FUNCTION validate_photos_array()
RETURNS TRIGGER AS $$
BEGIN
  IF array_length(NEW.photos, 1) > 6 THEN
    RAISE EXCEPTION 'Maximum 6 photos allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for photo validation
DROP TRIGGER IF EXISTS validate_photos_trigger ON public.profiles;
CREATE TRIGGER validate_photos_trigger
  BEFORE UPDATE OF photos ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_photos_array();