-- Check if profiles are being created properly
SELECT 
  user_id,
  username,
  name,
  age,
  interests,
  onboarded,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- Check if the handle_new_user function is working
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check if there are any RLS policy issues
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';

-- Test if we can manually update a profile
-- UPDATE public.profiles 
-- SET name = 'Test Name', age = 25, interests = 'test', onboarded = true 
-- WHERE user_id = 'YOUR_USER_ID_HERE';