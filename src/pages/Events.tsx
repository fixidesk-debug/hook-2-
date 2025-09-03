import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Plus } from "lucide-react";
import { toast } from "sonner";

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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchEvents();
      }
    };
    getUser();
  }, []);

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
      <div className="border-b-4 border-black bg-white p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <h1 className="text-3xl font-black">COMMUNITY EVENTS</h1>
          <Button className="bg-brutal-green text-black font-black border-4 border-black">
            <Plus className="h-5 w-5 mr-2" />
            CREATE EVENT
          </Button>
        </div>
      </div>

      <div className="p-4">
        {events.length === 0 ? (
          <div className="text-center mt-12">
            <div className="bg-white border-4 border-black p-8 shadow-brutal max-w-md mx-auto">
              <h2 className="text-2xl font-black mb-4">NO UPCOMING EVENTS</h2>
              <p className="font-bold mb-6">Be the first to create a community event!</p>
              <Button className="bg-brutal-pink text-black font-black border-4 border-black">
                CREATE FIRST EVENT
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 max-w-4xl mx-auto">
            {events.map((event) => (
              <div key={event.id} className="bg-white border-4 border-black shadow-brutal">
                <div className="bg-brutal-blue border-b-4 border-black p-4">
                  <h2 className="text-2xl font-black text-white">{event.title.toUpperCase()}</h2>
                  <div className="flex items-center gap-4 mt-2 text-white font-bold">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <p className="font-bold mb-2">Hosted by:</p>
                    <div className="inline-flex items-center gap-2">
                      <span className="bg-black text-white px-2 py-1 font-black text-sm">
                        {event.host_profile?.username?.toUpperCase() || 'UNKNOWN HOST'}
                      </span>
                      <span className="bg-gray-200 px-2 py-1 font-black text-sm border-2 border-black">
                        {event.host_profile?.type?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {event.description && (
                    <div className="mb-6">
                      <p className="font-bold">{event.description}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="font-black">
                        {event.attendees.length} ATTENDING
                      </span>
                    </div>

                    <Button
                      onClick={() => handleRSVP(event.id)}
                      className={`font-black border-4 border-black ${
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
    </div>
  );
}