import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, X, Users, User, UsersIcon } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  type: 'solo' | 'couple' | 'group';
  age: number;
  bio: string;
  location: string;
  photos: string[];
  tags: string[];
}

export default function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchProfiles();
      }
    };
    getUser();
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get profiles excluding current user and already liked ones
    const { data: likedProfiles } = await supabase
      .from('likes')
      .select('target_user_id')
      .eq('user_id', user.id);

    const likedIds = likedProfiles?.map(l => l.target_user_id) || [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user.id)
      .not('user_id', 'in', `(${likedIds.join(',') || 'null'})`)
      .limit(10);

    if (error) {
      console.error('Error fetching profiles:', error);
      toast.error("Error loading profiles");
    } else {
      setProfiles(data || []);
    }
    setIsLoading(false);
  };

  const handleLike = async () => {
    if (!user || currentIndex >= profiles.length) return;

    const targetProfile = profiles[currentIndex];
    const { error } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        target_user_id: targetProfile.user_id
      });

    if (error) {
      console.error('Error liking profile:', error);
      toast.error("Error liking profile");
    } else {
      toast.success("Liked!");
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePass = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'couple': return <UsersIcon className="h-5 w-5" />;
      case 'group': return <Users className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">PLEASE LOG IN</h1>
          <p className="text-lg">You need to be logged in to discover profiles</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">LOADING...</h1>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-4xl font-black mb-4 text-foreground">NO MORE PROFILES</h1>
          <p className="text-lg mb-6">You've seen everyone! Check back later for new profiles.</p>
          <Button onClick={fetchProfiles} className="bg-brutal-pink text-black font-black">
            REFRESH
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-4 border-black bg-white p-4">
        <h1 className="text-3xl font-black text-center">DISCOVER</h1>
      </div>

      {/* Profile Card */}
      <div className="flex justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white border-4 border-black shadow-brutal">
            {/* Profile Image Placeholder */}
            <div className="h-96 bg-brutal-blue flex items-center justify-center border-b-4 border-black">
              <div className="text-6xl font-black text-white">
                {currentProfile.username.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                {getTypeIcon(currentProfile.type)}
                <h2 className="text-2xl font-black">{currentProfile.username.toUpperCase()}</h2>
                <span className="bg-black text-white px-2 py-1 font-black text-sm">
                  {currentProfile.age}
                </span>
              </div>

              <div className="mb-4">
                <span className="bg-brutal-green text-black px-2 py-1 font-black text-sm border-2 border-black">
                  {currentProfile.type.toUpperCase()}
                </span>
                {currentProfile.location && (
                  <span className="ml-2 text-sm font-bold">📍 {currentProfile.location}</span>
                )}
              </div>

              {currentProfile.bio && (
                <p className="mb-4 font-bold">{currentProfile.bio}</p>
              )}

              {currentProfile.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentProfile.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-200 text-black px-2 py-1 text-sm font-bold border-2 border-black">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <Button
              onClick={handlePass}
              className="flex-1 bg-red-500 text-white border-4 border-black font-black text-xl py-4 hover:bg-red-600"
            >
              <X className="h-8 w-8 mr-2" />
              PASS
            </Button>
            <Button
              onClick={handleLike}
              className="flex-1 bg-brutal-green text-black border-4 border-black font-black text-xl py-4 hover:bg-green-400"
            >
              <Heart className="h-8 w-8 mr-2" />
              LIKE
            </Button>
          </div>

          <div className="text-center mt-4 text-sm font-bold">
            {currentIndex + 1} / {profiles.length}
          </div>
        </div>
      </div>
    </div>
  );
}