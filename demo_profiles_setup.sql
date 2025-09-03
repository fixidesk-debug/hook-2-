-- =====================================================
-- DEMO PROFILES FOR TESTING DISCOVERY FUNCTIONALITY
-- =====================================================
-- Run this in Supabase SQL Editor to create test profiles

-- First, insert demo users into auth.users (with dummy IDs)
-- Note: In production, users are created through Supabase Auth signup

-- Insert demo profiles directly (these will be discoverable)
INSERT INTO public.profiles (
  id, user_id, username, type, age, gender_orientation, bio, location, tags, photos, onboarded
) VALUES
-- Demo Profile 1
(
  gen_random_uuid(),
  gen_random_uuid(),
  'alex_adventurer',
  'solo',
  25,
  'Open to all',
  'Love hiking, photography, and meeting new people! Always up for an adventure 🌍',
  'San Francisco, CA',
  ARRAY['hiking', 'photography', 'travel', 'music', 'coffee'],
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'],
  true
),
-- Demo Profile 2  
(
  gen_random_uuid(),
  gen_random_uuid(),
  'sarah_and_mike',
  'couple',
  28,
  'Couple seeking friends',
  'We are Sarah (26) and Mike (30), looking to expand our social circle and meet other couples or individuals for friendship and fun activities!',
  'Los Angeles, CA',
  ARRAY['couple', 'social', 'parties', 'beach', 'movies', 'cooking'],
  ARRAY['https://images.unsplash.com/photo-1522075469751-3847ae2b1b5c?w=400'],
  true
),
-- Demo Profile 3
(
  gen_random_uuid(),
  gen_random_uuid(),
  'creative_collective',
  'group',
  30,
  'Creative group',
  'We are a group of 4 artists and creators looking to collaborate and meet like-minded people. Into art, music, design, and good vibes ✨',
  'Brooklyn, NY',
  ARRAY['art', 'music', 'design', 'collaboration', 'creativity', 'events'],
  ARRAY['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400'],
  true
),
-- Demo Profile 4
(
  gen_random_uuid(),
  gen_random_uuid(),
  'emma_explorer',
  'solo',
  23,
  'Straight',
  'Psychology student who loves books, yoga, and exploring new cafes. Looking for genuine connections and interesting conversations 📚',
  'Seattle, WA',
  ARRAY['books', 'yoga', 'psychology', 'coffee', 'nature', 'wellness'],
  ARRAY['https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400'],
  true
),
-- Demo Profile 5
(
  gen_random_uuid(),
  gen_random_uuid(),
  'jake_tech',
  'solo',
  27,
  'Gay',
  'Software engineer by day, DJ by night! Love electronic music, gaming, and tech. Always down to chat about the latest gadgets or grab drinks 🎧',
  'Austin, TX',
  ARRAY['tech', 'music', 'gaming', 'programming', 'electronic', 'nightlife'],
  ARRAY['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400', 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400'],
  true
),
-- Demo Profile 6
(
  gen_random_uuid(),
  gen_random_uuid(),
  'fit_couple_goals',
  'couple',
  26,
  'Fitness couple',
  'Fitness enthusiasts looking for workout buddies and health-conscious friends. We love rock climbing, running, and trying new healthy recipes!',
  'Denver, CO',
  ARRAY['fitness', 'climbing', 'running', 'health', 'outdoors', 'nutrition'],
  ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'],
  true
),
-- Demo Profile 7
(
  gen_random_uuid(),
  gen_random_uuid(),
  'maya_musician',
  'solo',
  24,
  'Bisexual',
  'Indie musician and vinyl collector. Love live music, vintage clothes, and late-night conversations about life and art 🎵',
  'Portland, OR',
  ARRAY['music', 'indie', 'vinyl', 'vintage', 'art', 'concerts'],
  ARRAY['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'],
  true
),
-- Demo Profile 8
(
  gen_random_uuid(),
  gen_random_uuid(),
  'party_squad',
  'group',
  25,
  'Social group',
  'We are a fun group of 6 friends who love hosting parties, game nights, and social events. Always looking to meet new people and grow our community!',
  'Miami, FL',
  ARRAY['parties', 'social', 'games', 'events', 'dancing', 'beach'],
  ARRAY['https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400', 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400'],
  true
);

-- Verify the profiles were created
SELECT username, type, age, location, array_length(tags, 1) as tag_count 
FROM public.profiles 
WHERE onboarded = true
ORDER BY created_at DESC;

-- =====================================================
-- DEMO PROFILES CREATED!
-- Users can now discover these profiles in the app
-- =====================================================
