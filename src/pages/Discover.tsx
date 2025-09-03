import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, X, Users, User, UsersIcon, RotateCcw, Flag, Shield, Settings, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ReportModal } from "@/components/moderation/ReportModal";
import { AdvancedFilters, FilterOptions } from "@/components/matching/AdvancedFilters";
import { requestNotificationPermission, setupNotificationListeners } from "@/lib/notifications";
import { useNavigate } from "react-router-dom";

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
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    ageRange: [18, 65],
    maxDistance: 50,
    interests: [],
    profileType: 'all'
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
      fetchProfiles();
      requestNotificationPermission();
      const cleanup = setupNotificationListeners(user.id);
      return cleanup;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [filters]);

  const fetchBlockedUsers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reports')
      .select('reported_user_id')
      .eq('reporter_id', user.id);
    setBlockedUsers(data?.map(r => r.reported_user_id) || []);
  };

  const fetchProfiles = async () => {
    if (!user) return;
    setIsLoading(true);

    // Get profiles excluding current user and already liked/passed ones
    const { data: likedProfiles } = await supabase
      .from('likes')
      .select('target_user_id')
      .eq('user_id', user.id);

    const likedIds = likedProfiles?.map(l => l.target_user_id) || [];

    const allExcludedIds = [...likedIds, ...blockedUsers];
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('user_id', user.id)
      .not('user_id', 'in', `(${allExcludedIds.join(',') || 'null'})`)
      .gte('age', filters.ageRange[0])
      .lte('age', filters.ageRange[1]);

    if (filters.profileType !== 'all') {
      query = query.eq('type', filters.profileType);
    }

    if (filters.interests.length > 0) {
      query = query.overlaps('tags', filters.interests);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error('Error fetching profiles:', error);
      toast.error("Error loading profiles");
    } else {
      setProfiles(data || []);
      setCurrentIndex(0);
    }
    setIsLoading(false);
  };

  const handleLike = async () => {
    if (!user || currentIndex >= profiles.length) return;

    setSwipeDirection('right');
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
      // Check for match (the trigger will create it automatically)
      const { data: mutualLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', targetProfile.user_id)
        .eq('target_user_id', user.id)
        .single();

      if (mutualLike) {
        toast.success("🎉 IT'S A MATCH! Check your matches to start chatting!");
      } else {
        toast.success("Liked!");
      }
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handlePass = () => {
    setSwipeDirection('left');
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handleBlock = async () => {
    if (!user || !currentProfile) return;

    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: currentProfile.user_id,
        reason: 'Blocked',
      });

    if (!error) {
      toast.success('User blocked');
      setBlockedUsers(prev => [...prev, currentProfile.user_id]);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const viewProfile = () => {
    if (currentProfile) {
      navigate(`/user/${currentProfile.user_id}`);
    }
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl md:text-4xl font-black">LOADING...</h1>
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
      <div className="border-b-4 border-black bg-white p-3 md:p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-black">DISCOVER</h1>
          <Button
            onClick={() => setShowFilters(true)}
            className="bg-brutal-blue text-white border-2 border-black font-black p-2"
          >
            <Settings className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="flex justify-center p-2 md:p-4">
        <div className="w-full max-w-md mx-2">
          <div className="bg-white border-4 border-black shadow-brutal relative">
            {/* Report/Block buttons */}
            <div className="absolute top-2 right-2 z-10 flex gap-1">
              <Button
                onClick={() => setShowReportModal(true)}
                className="bg-red-500 text-white border-2 border-black p-2 hover:bg-red-600"
                size="sm"
              >
                <Flag className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleBlock}
                className="bg-gray-800 text-white border-2 border-black p-2 hover:bg-gray-900"
                size="sm"
              >
                <Shield className="h-4 w-4" />
              </Button>
            </div>
            {/* Profile Images */}
            <div className="h-80 md:h-96 bg-brutal-blue border-b-4 border-black relative overflow-hidden">
              {currentProfile.photos && currentProfile.photos.length > 0 ? (
                <img 
                  src={currentProfile.photos[0]} 
                  alt={currentProfile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-6xl font-black text-white">
                    {currentProfile.username.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              
              {/* Swipe overlay */}
              {swipeDirection && (
                <div className={`absolute inset-0 flex items-center justify-center ${
                  swipeDirection === 'right' ? 'bg-green-500/80' : 'bg-red-500/80'
                }`}>
                  <div className="text-6xl font-black text-white">
                    {swipeDirection === 'right' ? '💚' : '❌'}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {getTypeIcon(currentProfile.type)}
                <h2 className="text-xl md:text-2xl font-black break-words">{currentProfile.username.toUpperCase()}</h2>
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
                <div className="flex flex-wrap gap-1 md:gap-2 mb-4">
                  {currentProfile.tags.slice(0, 6).map((tag, index) => (
                    <span key={index} className="bg-gray-200 text-black px-2 py-1 text-xs md:text-sm font-bold border-2 border-black">
                      #{tag}
                    </span>
                  ))}
                  {currentProfile.tags.length > 6 && (
                    <span className="text-xs text-gray-500 font-bold">+{currentProfile.tags.length - 6} more</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 md:gap-4 mt-4 md:mt-6">
            <Button
              onClick={handlePass}
              className="flex-1 bg-red-500 text-white border-4 border-black font-black text-lg md:text-xl py-3 md:py-4 hover:bg-red-600"
            >
              <X className="h-6 w-6 md:h-8 md:w-8 mr-1 md:mr-2" />
              <span className="hidden sm:inline">PASS</span>
            </Button>
            <Button
              onClick={viewProfile}
              className="flex-1 bg-brutal-blue text-white border-4 border-black font-black text-lg md:text-xl py-3 md:py-4 hover:bg-blue-600"
            >
              <Eye className="h-6 w-6 md:h-8 md:w-8 mr-1 md:mr-2" />
              <span className="hidden sm:inline">VIEW</span>
            </Button>
            <Button
              onClick={handleLike}
              className="flex-1 bg-brutal-green text-black border-4 border-black font-black text-lg md:text-xl py-3 md:py-4 hover:bg-green-400"
            >
              <Heart className="h-6 w-6 md:h-8 md:w-8 mr-1 md:mr-2" />
              <span className="hidden sm:inline">LIKE</span>
            </Button>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm font-bold">
              {currentIndex + 1} / {profiles.length}
            </div>
            <Button
              onClick={fetchProfiles}
              className="bg-gray-300 text-black border-2 border-black font-black text-xs md:text-sm px-2 md:px-3 py-1"
            >
              <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span className="hidden sm:inline">REFRESH</span>
            </Button>
          </div>
        </div>
      </div>
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={currentProfile?.user_id || ''}
        reportedUsername={currentProfile?.username || ''}
      />
      
      <AdvancedFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
        currentFilters={filters}
      />
    </div>
  );
}
