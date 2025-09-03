-- Function to create matches when users like each other
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the target user has already liked this user
  IF EXISTS (
    SELECT 1 FROM public.likes 
    WHERE user_id = NEW.target_user_id 
    AND target_user_id = NEW.user_id
  ) THEN
    -- Create a match
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.user_id, NEW.target_user_id),
      GREATEST(NEW.user_id, NEW.target_user_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic match creation
DROP TRIGGER IF EXISTS create_match_trigger ON public.likes;
CREATE TRIGGER create_match_trigger
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- Ensure matches table has unique constraint
ALTER TABLE public.matches 
ADD CONSTRAINT unique_match UNIQUE (user1_id, user2_id);

-- Enable RLS for chats table
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- RLS policies for chats
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their matches" ON public.chats;
CREATE POLICY "Users can send messages in their matches" ON public.chats
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );