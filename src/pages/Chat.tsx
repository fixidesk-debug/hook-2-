import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Users, User, UsersIcon } from "lucide-react";
import { toast } from "sonner";

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
  const [user, setUser] = useState(null);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user && matchId) {
        await fetchMatchInfo();
        await fetchMessages();
        setupRealtimeSubscription();
      }
    };
    getUser();
  }, [matchId]);

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
      .channel('chat-messages')
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !matchId) return;

    const { error } = await supabase
      .from('chats')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        message: newMessage.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      toast.error("Error sending message");
    } else {
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">LOADING CHAT...</h1>
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
      <div className="border-b-4 border-black bg-white p-4 flex items-center gap-4">
        <Button 
          onClick={() => navigate('/matches')}
          className="bg-white text-black border-2 border-black hover:bg-gray-100 p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          {getTypeIcon(matchInfo.other_profile.type)}
          <h1 className="text-2xl font-black">
            {matchInfo.other_profile.username?.toUpperCase() || 'UNKNOWN USER'}
          </h1>
          <span className="bg-black text-white px-2 py-1 font-black text-sm">
            {matchInfo.other_profile.age}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center mt-12">
            <div className="bg-white border-4 border-black p-6 shadow-brutal max-w-sm mx-auto">
              <h2 className="text-xl font-black mb-2">START CHATTING!</h2>
              <p className="font-bold">Send the first message to break the ice</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 border-4 border-black font-bold ${
                  message.sender_id === user.id
                    ? 'bg-brutal-pink text-black'
                    : 'bg-white text-black'
                }`}
              >
                <p>{message.message}</p>
                <div className={`text-xs mt-1 ${
                  message.sender_id === user.id ? 'text-black' : 'text-gray-600'
                }`}>
                  {formatMessageTime(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t-4 border-black bg-white p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border-4 border-black font-bold text-lg"
          />
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-brutal-green text-black font-black border-4 border-black hover:bg-green-400 px-6"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}