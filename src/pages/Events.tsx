import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CreateEventModal } from "@/components/events/CreateEventModal";

interface Event {
  id: string;
  host_id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  attendees: string[];
  created_at: string;
  host_profile?: {
    username: string;
    type: string;
  };
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    setIsLoading(true);
    
    // Get upcoming events
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      toast.error("Error loading events");
      setIsLoading(false);
      return;
    }

    // Fetch host profile for each event
    const eventsWithHosts = await Promise.all(
      (data || []).map(async (event) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, type')
          .eq('user_id', event.host_id)
          .single();

        return {
          ...event,
          host_profile: profile
        };
      })
    );

    setEvents(eventsWithHosts);
    setIsLoading(false);
  };

  const handleRSVP = async (eventId: string) => {
    if (!user) {
      toast.error("Please log in to RSVP");
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const isAttending = event.attendees.includes(user.id);
    
    let newAttendees;
    if (isAttending) {
      // Remove user from attendees
      newAttendees = event.attendees.filter(id => id !== user.id);
    } else {
      // Add user to attendees
      newAttendees = [...event.attendees, user.id];
    }

    const { error } = await supabase
      .from('events')
      .update({ attendees: newAttendees })
      .eq('id', eventId);

    if (error) {
      console.error('Error updating RSVP:', error);
      toast.error("Error updating RSVP");
    } else {
      toast.success(isAttending ? "RSVP Removed!" : "RSVP'd!");
      // Update local state
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, attendees: newAttendees } : e
      ));
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options).toUpperCase();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">PLEASE LOG IN</h1>
          <p className="text-lg">You need to be logged in to view events</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">LOADING EVENTS...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b-4 border-black bg-white p-3 md:p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto gap-2">
          <h1 className="text-xl md:text-3xl font-black">COMMUNITY EVENTS</h1>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-brutal-green text-black font-black border-4 border-black text-sm md:text-base"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
            <span className="hidden sm:inline">CREATE EVENT</span>
            <span className="sm:hidden">CREATE</span>
          </Button>
        </div>
      </div>

      <div className="p-2 md:p-4">
        {events.length === 0 ? (
          <div className="text-center mt-8 md:mt-12">
            <div className="bg-white border-4 border-black p-6 md:p-8 shadow-brutal max-w-md mx-auto">
              <h2 className="text-xl md:text-2xl font-black mb-4">NO UPCOMING EVENTS</h2>
              <p className="font-bold mb-6 text-sm md:text-base">Be the first to create a community event!</p>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-brutal-pink text-black font-black border-4 border-black w-full md:w-auto"
              >
                CREATE FIRST EVENT
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 max-w-4xl mx-auto">
            {events.map((event) => (
              <div key={event.id} className="bg-white border-4 border-black shadow-brutal">
                <div className="bg-brutal-blue border-b-4 border-black p-3 md:p-4">
                  <h2 className="text-lg md:text-2xl font-black text-white break-words">{event.title.toUpperCase()}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-white font-bold text-sm md:text-base">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span className="break-words">{event.location}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <div className="mb-4">
                    <p className="font-bold mb-2 text-sm md:text-base">Hosted by:</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-black text-white px-2 py-1 font-black text-xs md:text-sm">
                        {event.host_profile?.username?.toUpperCase() || 'UNKNOWN HOST'}
                      </span>
                      <span className="bg-gray-200 px-2 py-1 font-black text-xs md:text-sm border-2 border-black">
                        {event.host_profile?.type?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {event.description && (
                    <div className="mb-4 md:mb-6">
                      <p className="font-bold text-sm md:text-base break-words">{event.description}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 md:h-5 md:w-5" />
                      <span className="font-black text-sm md:text-base">
                        {event.attendees.length} ATTENDING
                      </span>
                    </div>

                    <Button
                      onClick={() => handleRSVP(event.id)}
                      className={`font-black border-4 border-black text-sm md:text-base w-full sm:w-auto ${
                        event.attendees.includes(user.id)
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-brutal-green text-black hover:bg-green-400'
                      }`}
                    >
                      {event.attendees.includes(user.id) ? 'CANCEL RSVP' : 'RSVP'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={fetchEvents}
      />
    </div>
  );
}