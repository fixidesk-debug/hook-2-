-- Complete setup for match creation and chat functionality

-- 1. Function to create matches when users like each other
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the target user has already liked this user
  IF EXISTS (
    SELECT 1 FROM public.likes 
    WHERE user_id = NEW.target_user_id 
    AND target_user_id = NEW.user_id
  ) THEN
    -- Create a match (prevent duplicates with ON CONFLICT)
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

-- 2. Create trigger for automatic match creation
DROP TRIGGER IF EXISTS create_match_trigger ON public.likes;
CREATE TRIGGER create_match_trigger
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- 3. Add unique constraint to matches table
ALTER TABLE public.matches 
DROP CONSTRAINT IF EXISTS unique_match;
ALTER TABLE public.matches 
ADD CONSTRAINT unique_match UNIQUE (user1_id, user2_id);

-- 4. Enable RLS for chats table
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing chat policies
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON public.chats;

-- 6. Create secure chat policies
CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches" ON public.chats
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- 7. Enable realtime for matches and chats
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;