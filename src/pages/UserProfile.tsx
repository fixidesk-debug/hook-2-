import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, X, Users, User, UsersIcon, ArrowLeft, Flag, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ReportModal } from "@/components/moderation/ReportModal";

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  type: 'solo' | 'couple' | 'group';
  age: number;
  gender_orientation: string;
  bio: string;
  location: string;
  tags: string[];
  photos: string[];
  privacy_settings: any;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (userId && user) {
      fetchProfile();
      checkIfLiked();
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    if (!userId) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      toast.error("Profile not found");
      navigate('/discover');
    } else {
      setProfile(data);
    }
    setIsLoading(false);
  };

  const checkIfLiked = async () => {
    if (!user || !userId) return;

    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('target_user_id', userId)
      .single();

    setHasLiked(!!data);
  };

  const handleLike = async () => {
    if (!user || !profile) return;

    if (hasLiked) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_user_id', profile.user_id);

      if (!error) {
        setHasLiked(false);
        toast.success("Unliked!");
      }
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          target_user_id: profile.user_id
        });

      if (!error) {
        setHasLiked(true);
        // Check for match
        const { data: mutualLike } = await supabase
          .from('likes')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('target_user_id', user.id)
          .single();

        if (mutualLike) {
          toast.success("🎉 IT'S A MATCH! Check your matches to start chatting!");
        } else {
          toast.success("Liked!");
        }
      }
    }
  };

  const handleBlock = async () => {
    if (!user || !profile) return;
    
    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: profile.user_id,
        reason: 'Blocked',
      });

    if (!error) {
      toast.success('User blocked');
      navigate('/discover');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'couple': return <UsersIcon className="h-6 w-6" />;
      case 'group': return <Users className="h-6 w-6" />;
      default: return <User className="h-6 w-6" />;
    }
  };

  const nextPhoto = () => {
    if (profile?.photos && currentPhotoIndex < profile.photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">PLEASE LOG IN</h1>
          <p className="text-lg">You need to be logged in to view profiles</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h1 className="text-4xl font-black mb-4">LOADING PROFILE...</h1>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">PROFILE NOT FOUND</h1>
          <Button onClick={() => navigate('/discover')} className="bg-brutal-pink text-black font-black">
            BACK TO DISCOVER
          </Button>
        </div>
      </div>
    );
  }

  // Don't let users view their own profile here
  if (profile.user_id === user.id) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-4 border-black bg-white p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate(-1)}
              className="bg-gray-300 text-black font-black border-4 border-black"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-black">{profile.username.toUpperCase()}'S PROFILE</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowReportModal(true)}
              className="bg-red-500 text-white border-4 border-black font-black hover:bg-red-600"
            >
              <Flag className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleBlock}
              className="bg-gray-800 text-white border-4 border-black font-black hover:bg-gray-900"
            >
              <Shield className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border-4 border-black shadow-brutal">
            {/* Profile Photos */}
            <div className="bg-brutal-blue border-b-4 border-black p-8">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 text-white mb-4">
                  {getTypeIcon(profile.type)}
                  <h2 className="text-3xl font-black">{profile.username.toUpperCase()}</h2>
                  <span className="bg-white text-black px-2 py-1 font-black text-lg">
                    {profile.age}
                  </span>
                </div>
                <div className="mb-4">
                  <span className="bg-brutal-green text-black px-3 py-1 font-black text-sm border-2 border-black">
                    {profile.type.toUpperCase()}
                  </span>
                  {profile.location && (
                    <span className="ml-3 text-white font-bold">📍 {profile.location}</span>
                  )}
                </div>
              </div>
              
              {/* Photo Gallery */}
              {profile.photos && profile.photos.length > 0 ? (
                <div className="relative">
                  <div className="aspect-square max-w-sm mx-auto border-4 border-black overflow-hidden">
                    <img 
                      src={profile.photos[currentPhotoIndex]} 
                      alt={`${profile.username} - Photo ${currentPhotoIndex + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => window.open(profile.photos[currentPhotoIndex], '_blank')}
                    />
                  </div>
                  
                  {/* Photo navigation */}
                  {profile.photos.length > 1 && (
                    <>
                      <div className="flex justify-center mt-4 gap-2">
                        {profile.photos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`w-3 h-3 border-2 border-black ${
                              index === currentPhotoIndex ? 'bg-white' : 'bg-gray-400'
                            }`}
                          />
                        ))}
                      </div>
                      
                      {/* Navigation buttons */}
                      {currentPhotoIndex > 0 && (
                        <button
                          onClick={prevPhoto}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/70 text-white p-2 border-2 border-black font-black"
                        >
                          ‹
                        </button>
                      )}
                      {currentPhotoIndex < profile.photos.length - 1 && (
                        <button
                          onClick={nextPhoto}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/70 text-white p-2 border-2 border-black font-black"
                        >
                          ›
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 bg-white border-4 border-black mx-auto flex items-center justify-center">
                    <span className="text-6xl font-black text-brutal-blue">
                      {profile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="p-6 space-y-6">
              {profile.gender_orientation && (
                <div>
                  <h3 className="text-sm font-black mb-2">GENDER/ORIENTATION</h3>
                  <p className="font-bold text-lg">{profile.gender_orientation}</p>
                </div>
              )}

              {profile.bio && (
                <div>
                  <h3 className="text-sm font-black mb-2">BIO</h3>
                  <p className="font-bold text-lg">{profile.bio}</p>
                </div>
              )}

              {profile.tags && profile.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-black mb-2">INTERESTS</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-200 text-black px-2 py-1 text-sm font-bold border-2 border-black">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t-4 border-black">
              <div className="flex gap-4">
                <Button
                  onClick={handleLike}
                  className={`flex-1 font-black text-xl py-4 border-4 border-black ${
                    hasLiked 
                      ? 'bg-gray-400 text-black hover:bg-gray-500' 
                      : 'bg-brutal-green text-black hover:bg-green-400'
                  }`}
                >
                  <Heart className={`h-8 w-8 mr-2 ${hasLiked ? 'fill-current' : ''}`} />
                  {hasLiked ? 'LIKED' : 'LIKE'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={profile.user_id}
        reportedUsername={profile.username}
      />
    </div>
  );
}
