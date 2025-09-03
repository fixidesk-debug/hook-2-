import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Users, User, UsersIcon, Heart, Smile } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MediaUpload } from "@/components/chat/MediaUpload";

interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  message: string;
  media_url?: string;
  created_at: string;
}

interface MatchInfo {
  id: string;
  user1_id: string;
  user2_id: string;
  other_profile: {
    username?: string;
    type?: 'solo' | 'couple' | 'group';
    age?: number;
  };
}

export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [reactions, setReactions] = useState<{[key: string]: string}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && matchId) {
      fetchMatchInfo();
      fetchMessages();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user, matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMatchInfo = async () => {
    if (!matchId || !user) return;

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error) {
      console.error('Error fetching match:', error);
      toast.error("Error loading chat");
      return;
    }

    // Verify user is part of this match
    if (data.user1_id !== user.id && data.user2_id !== user.id) {
      toast.error("You don't have access to this chat");
      navigate('/matches');
      return;
    }

    // Get the other user's profile
    const otherUserId = data.user1_id === user.id ? data.user2_id : data.user1_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, type, age')
      .eq('user_id', otherUserId)
      .single();

    setMatchInfo({
      ...data,
      other_profile: profile || {}
    });
  };

  const fetchMessages = async () => {
    if (!matchId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast.error("Error loading messages");
    } else {
      setMessages(data || []);
    }
    setIsLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (messageText?: string, mediaUrl?: string) => {
    if ((!messageText?.trim() && !mediaUrl) || !user || !matchId) return;

    const { error } = await supabase
      .from('chats')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        message: messageText?.trim() || '',
        media_url: mediaUrl
      });

    if (error) {
      console.error('Error sending message:', error);
      toast.error("Error sending message");
    } else {
      setNewMessage("");
    }
  };

  const handleReaction = async (messageId: string, reaction: string) => {
    setReactions(prev => ({ ...prev, [messageId]: reaction }));
    // In a real app, you'd save this to the database
  };

  const handleTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage);
    } else {
      handleTyping();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'couple': return <UsersIcon className="h-4 w-4" />;
      case 'group': return <Users className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">PLEASE LOG IN</h1>
          <p className="text-lg">You need to be logged in to chat</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl md:text-4xl font-black">LOADING CHAT...</h1>
        </div>
      </div>
    );
  }

  if (!matchInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">CHAT NOT FOUND</h1>
          <Button onClick={() => navigate('/matches')} className="bg-brutal-pink text-black font-black">
            BACK TO MATCHES
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b-4 border-black bg-white p-3 md:p-4 flex items-center gap-2 md:gap-4">
        <Button 
          onClick={() => navigate('/matches')}
          className="bg-white text-black border-2 border-black hover:bg-gray-100 p-2 flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getTypeIcon(matchInfo.other_profile.type)}
          <h1 className="text-lg md:text-2xl font-black truncate">
            {matchInfo.other_profile.username?.toUpperCase() || 'UNKNOWN USER'}
          </h1>
          <span className="bg-black text-white px-2 py-1 font-black text-xs md:text-sm flex-shrink-0">
            {matchInfo.other_profile.age}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4">
        {messages.length === 0 ? (
          <div className="text-center mt-8 md:mt-12">
            <div className="bg-white border-4 border-black p-4 md:p-6 shadow-brutal max-w-sm mx-auto">
              <h2 className="text-lg md:text-xl font-black mb-2">START CHATTING!</h2>
              <p className="font-bold text-sm md:text-base">Send the first message to break the ice</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 border-4 border-black font-bold relative group ${
                  message.sender_id === user.id
                    ? 'bg-brutal-pink text-black'
                    : 'bg-white text-black'
                }`}
              >
                {message.media_url && (
                  <img 
                    src={message.media_url} 
                    alt="Shared media" 
                    className="w-full max-w-xs rounded border-2 border-black mb-2"
                  />
                )}
                {message.message && (
                  <p className="text-sm md:text-base break-words">{message.message}</p>
                )}
                <div className={`text-xs mt-1 flex justify-between items-center ${
                  message.sender_id === user.id ? 'text-black' : 'text-gray-600'
                }`}>
                  <span>{formatMessageTime(message.created_at)}</span>
                  {reactions[message.id] && (
                    <span className="text-lg">{reactions[message.id]}</span>
                  )}
                </div>
                
                {/* Reaction buttons */}
                <div className="absolute -top-8 left-0 hidden group-hover:flex gap-1 bg-white border-2 border-black p-1">
                  {['❤️', '😂', '👍', '😮'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(message.id, emoji)}
                      className="hover:bg-gray-100 p-1 text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-2 border-4 border-black font-bold">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t-4 border-black bg-white p-3 md:p-4">
        <div className="flex gap-2 items-end">
          <MediaUpload onMediaSent={(mediaUrl) => sendMessage('', mediaUrl)} />
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border-4 border-black font-bold text-sm md:text-lg"
          />
          <Button 
            onClick={() => sendMessage(newMessage)}
            disabled={!newMessage.trim()}
            className="bg-brutal-green text-black font-black border-4 border-black hover:bg-green-400 px-4 md:px-6"
          >
            <Send className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}