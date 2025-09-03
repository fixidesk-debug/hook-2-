-- Check if all required columns exist
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'chats', 'matches', 'likes', 'events', 'reports')
ORDER BY table_name, ordinal_position;

-- Check storage buckets
SELECT id, name, public FROM storage.buckets WHERE id IN ('profile-photos', 'chat-media');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'chats', 'matches', 'likes', 'events', 'reports');

-- Check storage policies (alternative query)
SELECT policyname, bucket_id 
FROM storage.objects_policies 
WHERE bucket_id IN ('profile-photos', 'chat-media');

-- Check realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Check functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('handle_new_user', 'create_match_on_mutual_like', 'update_updated_at_column');

-- Check triggers
SELECT trigger_name, event_object_table, action_timing, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check enum types
SELECT typname, enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'profile_type';