import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingFlow } from './OnboardingFlow';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setCheckingProfile(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('user_id', user.id)
          .single();

        setNeedsOnboarding(!profile?.onboarded);
      } catch (error) {
        // Profile doesn't exist, needs onboarding
        setNeedsOnboarding(true);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [user]);

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-pure-white flex items-center justify-center">
        <div className="text-brutal-mono text-lg">LOADING...</div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingFlow />;
  }

  return <>{children}</>;
};