import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('events')
      .insert({
        host_id: user.id,
        title,
        description,
        date: new Date(date).toISOString(),
        location,
        attendees: [user.id], // Host automatically attends
      });

    if (error) {
      toast.error('Error creating event');
    } else {
      toast.success('Event created!');
      setTitle('');
      setDescription('');
      setDate('');
      setLocation('');
      onEventCreated();
      onClose();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-4 border-black">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">CREATE EVENT</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-black">EVENT TITLE</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="AWESOME MEETUP"
              className="border-4 border-black font-bold"
              required
            />
          </div>

          <div>
            <Label className="font-black">DESCRIPTION</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what this event is about..."
              className="border-4 border-black font-bold"
              rows={3}
            />
          </div>

          <div>
            <Label className="font-black">DATE & TIME</Label>
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-4 border-black font-bold"
              required
            />
          </div>

          <div>
            <Label className="font-black">LOCATION</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="WHERE IS IT HAPPENING?"
              className="border-4 border-black font-bold"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-black border-4 border-black font-black"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-brutal-green text-black border-4 border-black font-black"
            >
              {isLoading ? 'CREATING...' : 'CREATE EVENT'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};