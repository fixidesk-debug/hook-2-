import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, User, UsersIcon, Eye } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  profile: {
    username?: string;
    type?: 'solo' | 'couple' | 'group';
    age?: number;
    bio?: string;
    location?: string;
    photos?: string[];
  };
}

export default function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    if (!user) return;
    setIsLoading(true);

    // Get matches and profile data for the other user
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        user1_id,
        user2_id,
        created_at
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching matches:', error);
      toast.error("Error loading matches");
      setIsLoading(false);
      return;
    }

    // Fetch profile data for each match
    const matchesWithProfiles = await Promise.all(
      (data || []).map(async (match) => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, type, age, bio, location, photos')
          .eq('user_id', otherUserId)
          .single();

        return {
          ...match,
          profile: profile || {}
        };
      })
    );

    setMatches(matchesWithProfiles);
    setIsLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'couple': return <UsersIcon className="h-5 w-5" />;
      case 'group': return <Users className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "TODAY";
    if (diffDays === 1) return "YESTERDAY";
    if (diffDays < 7) return `${diffDays} DAYS AGO`;
    return date.toLocaleDateString().toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">PLEASE LOG IN</h1>
          <p className="text-lg">You need to be logged in to view matches</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl md:text-4xl font-black">LOADING MATCHES...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-4 border-black bg-white p-4">
        <h1 className="text-3xl font-black text-center">YOUR MATCHES</h1>
      </div>

      <div className="p-2 md:p-4">
        {matches.length === 0 ? (
          <div className="text-center mt-8 md:mt-12">
            <div className="bg-white border-4 border-black p-6 md:p-8 shadow-brutal max-w-md mx-auto">
              <h2 className="text-xl md:text-2xl font-black mb-4">NO MATCHES YET</h2>
              <p className="font-bold mb-6 text-sm md:text-base">Start swiping to find your connections!</p>
              <Button 
                onClick={() => navigate('/discover')}
                className="bg-brutal-pink text-black font-black border-4 border-black w-full md:w-auto"
              >
                START DISCOVERING
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4 max-w-2xl mx-auto">
            {matches.map((match) => (
              <div key={match.id} className="bg-white border-4 border-black shadow-brutal">
                <div className="p-3 md:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getTypeIcon(match.profile.type)}
                        <h3 className="text-lg md:text-xl font-black break-words">{match.profile.username?.toUpperCase()}</h3>
                        <span className="bg-black text-white px-2 py-1 font-black text-xs md:text-sm">
                          {match.profile.age}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <span className="bg-brutal-green text-black px-2 py-1 font-black text-sm border-2 border-black">
                          {match.profile.type?.toUpperCase()}
                        </span>
                        {match.profile.location && (
                          <span className="ml-2 text-sm font-bold">📍 {match.profile.location}</span>
                        )}
                      </div>

                      {match.profile.bio && (
                        <p className="text-xs md:text-sm font-bold mb-2 line-clamp-2">{match.profile.bio}</p>
                      )}

                      <div className="text-xs font-bold text-gray-600">
                        MATCHED {formatMatchDate(match.created_at)}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-brutal-blue border-2 border-black flex items-center justify-center overflow-hidden">
                        {match.profile.photos && match.profile.photos.length > 0 ? (
                          <img 
                            src={match.profile.photos[0]} 
                            alt={match.profile.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg md:text-2xl font-black text-white">
                            {match.profile.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t-2 border-black">
                    <Button 
                      className="w-full bg-brutal-pink text-black font-black border-2 border-black hover:bg-pink-400 text-sm md:text-base"
                      onClick={() => navigate(`/chat/${match.id}`)}
                    >
                      <MessageCircle className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      START CHAT
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
