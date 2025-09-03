import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUsername: string;
}

const REPORT_REASONS = [
  'Inappropriate content',
  'Harassment',
  'Fake profile',
  'Spam',
  'Underage',
  'Other'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUsername,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleReport = async () => {
    if (!user || !selectedReason) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reason: selectedReason,
      });

    if (error) {
      toast.error('Error submitting report');
    } else {
      toast.success('Report submitted');
      onClose();
      setSelectedReason('');
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-4 border-black max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">REPORT {reportedUsername.toUpperCase()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="font-bold text-sm">Why are you reporting this user?</p>
          
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`w-full p-3 text-left font-bold border-2 border-black ${
                  selectedReason === reason ? 'bg-brutal-pink' : 'bg-white hover:bg-gray-100'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-black border-2 border-black font-black"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleReport}
              disabled={!selectedReason || isLoading}
              className="flex-1 bg-red-500 text-white border-2 border-black font-black"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'REPORT'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};