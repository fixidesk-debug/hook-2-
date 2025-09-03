import React, { useState } from 'react';
import { Button } from '@/components/ui/button-brutal';
import { Input } from '@/components/ui/input-brutal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('Updating profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name,
          age: parseInt(age),
          interests,
          onboarded: true,
        })
        .eq('user_id', user.id)
        .select();

      console.log('Update result:', { data, error });
      
      if (error) {
        console.error('Database error:', error);
        alert(`Error: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        console.error('No profile found to update');
        alert('Profile not found. Please try logging out and back in.');
        return;
      }
      
      console.log('Profile updated successfully, navigating to discover');
      navigate('/discover');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert(`Unexpected error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pure-white flex items-center justify-center p-brutal">
      <div className="w-full max-w-md">
        <div className="text-center mb-brutal">
          <h1 className="text-brutal-display text-pure-black mb-4">
            WELCOME TO HOOK
          </h1>
          <p className="text-brutal-mono text-lg">
            STEP {step} OF 3
          </p>
        </div>

        <div className="card-brutal bg-neon-pink border-pure-black p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-pure-white text-brutal-mono text-sm mb-2">
                  YOUR NAME
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ENTER YOUR NAME"
                  className="w-full"
                />
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                variant="outline"
                size="lg"
                className="w-full bg-pure-white text-pure-black hover:bg-pure-black hover:text-pure-white"
              >
                NEXT
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-pure-white text-brutal-mono text-sm mb-2">
                  YOUR AGE
                </label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="ENTER YOUR AGE"
                  className="w-full"
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  size="lg"
                  className="flex-1 bg-pure-white text-pure-black hover:bg-pure-black hover:text-pure-white"
                >
                  BACK
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!age || parseInt(age) < 18}
                  variant="outline"
                  size="lg"
                  className="flex-1 bg-pure-white text-pure-black hover:bg-pure-black hover:text-pure-white"
                >
                  NEXT
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-pure-white text-brutal-mono text-sm mb-2">
                  YOUR INTERESTS
                </label>
                <Input
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="MUSIC, SPORTS, ART..."
                  className="w-full"
                />
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  size="lg"
                  className="flex-1 bg-pure-white text-pure-black hover:bg-pure-black hover:text-pure-white"
                >
                  BACK
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!interests.trim() || isLoading}
                  variant="outline"
                  size="lg"
                  className="flex-1 bg-pure-white text-pure-black hover:bg-pure-black hover:text-pure-white"
                >
                  {isLoading ? 'SAVING...' : 'COMPLETE'}
                </Button>
                
                {/* Debug info */}
                <div className="mt-4 text-xs text-white">
                  <p>User ID: {user?.id}</p>
                  <p>Name: {name}</p>
                  <p>Age: {age}</p>
                  <p>Interests: {interests}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};