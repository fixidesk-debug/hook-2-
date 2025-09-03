import React, { useState } from 'react';
import { Button } from '@/components/ui/button-brutal';
import { Input } from '@/components/ui/input-brutal';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'signup';

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/discover`
          }
        });
        if (error) throw error;
        navigate('/discover');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        navigate('/discover');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pure-white flex items-center justify-center p-brutal">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-brutal">
          <h1 className="text-brutal-display text-pure-black mb-4">
            HOOK
          </h1>
          <p className="text-brutal-mono text-lg">
            CONNECT • DISCOVER • EXPLORE
          </p>
        </div>

        {/* Auth Form */}
        <div className="card-brutal bg-neon-pink border-pure-black p-8">
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-pure-white text-brutal-mono text-sm mb-2">
                EMAIL
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOUR@EMAIL.COM"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-pure-white text-brutal-mono text-sm mb-2">
                PASSWORD
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                required
                className="w-full"
              />
            </div>

            {error && (
              <div className="bg-pure-black text-neon-pink p-4 border-4 border-pure-black">
                <p className="text-brutal-mono text-sm">{error.toUpperCase()}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled={isLoading}
              className="w-full bg-pure-white text-pure-black hover:bg-pure-black hover:text-pure-white"
            >
              {isLoading ? 'PROCESSING...' : (mode === 'login' ? 'LOG IN' : 'SIGN UP')}
            </Button>
            
            {mode === 'signup' && (
              <p className="text-pure-white text-brutal-mono text-xs mt-2 text-center">
                AFTER SIGNUP, COMPLETE YOUR PROFILE
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-pure-white text-brutal-mono underline hover:no-underline"
            >
              {mode === 'login' ? 'NEED ACCOUNT? SIGN UP' : 'HAVE ACCOUNT? LOG IN'}
            </button>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-8">
          <p className="text-brutal-mono text-sm text-gray-600">
            DARING • OPEN-MINDED • BOLD
          </p>
        </div>
      </div>
    </div>
  );
};