-- Create enum for profile types
CREATE TYPE public.profile_type AS ENUM ('solo', 'couple', 'group');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  type public.profile_type NOT NULL DEFAULT 'solo',
  age INTEGER NOT NULL,
  gender_orientation TEXT,
  bio TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  location TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  privacy_settings JSONB DEFAULT '{"blur_photos": false, "events_only": false}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id)
);

-- Create matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create chats table
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  attendees UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_likes_target_user_id ON public.likes(target_user_id);
CREATE INDEX idx_matches_user1_id ON public.matches(user1_id);
CREATE INDEX idx_matches_user2_id ON public.matches(user2_id);
CREATE INDEX idx_chats_match_id ON public.chats(match_id);
CREATE INDEX idx_chats_sender_id ON public.chats(sender_id);
CREATE INDEX idx_events_host_id ON public.events(host_id);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON public.reports(reported_user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for likes
CREATE POLICY "Users can view their own likes" ON public.likes
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_user_id);

CREATE POLICY "Users can create likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for matches
CREATE POLICY "Users can view their own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for chats
CREATE POLICY "Users can view chats in their matches" ON public.chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches" ON public.chats
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
      SELECT 1 FROM public.matches 
      WHERE id = match_id 
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- RLS Policies for events
CREATE POLICY "All users can view events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Event hosts can update their events" ON public.events
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Event hosts can delete their events" ON public.events
  FOR DELETE USING (auth.uid() = host_id);

-- RLS Policies for reports
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, age, gender_orientation, bio, location)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE((NEW.raw_user_meta_data ->> 'age')::INTEGER, 18),
    COALESCE(NEW.raw_user_meta_data ->> 'gender_orientation', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'bio', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'location', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to create matches when mutual likes exist
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a mutual like and create a match
  IF EXISTS (
    SELECT 1 FROM public.likes 
    WHERE user_id = NEW.target_user_id 
    AND target_user_id = NEW.user_id
  ) THEN
    INSERT INTO public.matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.user_id, NEW.target_user_id),
      GREATEST(NEW.user_id, NEW.target_user_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically create matches
CREATE TRIGGER create_match_on_like
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_match_on_mutual_like();