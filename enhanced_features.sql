-- Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat media
DROP POLICY IF EXISTS "Users upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Chat media publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users update own chat media" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own chat media" ON storage.objects;

CREATE POLICY "Users upload chat media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Chat media publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-media');

CREATE POLICY "Users update own chat media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own chat media" ON storage.objects
  FOR DELETE USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add location fields to profiles for distance filtering
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;