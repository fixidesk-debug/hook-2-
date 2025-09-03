import { supabase } from '@/integrations/supabase/client';

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
};

export const setupNotificationListeners = (userId: string) => {
  // Listen for new matches
  const matchChannel = supabase
    .channel('matches-notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'matches',
      filter: `user1_id=eq.${userId},user2_id=eq.${userId}`
    }, () => {
      showNotification('🎉 New Match!', {
        body: 'You have a new connection!',
        tag: 'match'
      });
    })
    .subscribe();

  // Listen for new messages
  const messageChannel = supabase
    .channel('messages-notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chats'
    }, async (payload: any) => {
      if (payload.new.sender_id !== userId) {
        const { data: match } = await supabase
          .from('matches')
          .select('user1_id, user2_id')
          .eq('id', payload.new.match_id)
          .single();
        
        if (match && (match.user1_id === userId || match.user2_id === userId)) {
          showNotification('💬 New Message', {
            body: payload.new.message.substring(0, 50) + '...',
            tag: 'message'
          });
        }
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(matchChannel);
    supabase.removeChannel(messageChannel);
  };
};