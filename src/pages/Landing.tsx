import React from 'react';
import { Button } from '@/components/ui/button-brutal';
import { HookHeader } from '@/components/layout/HookHeader';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import hookHero from '@/assets/hook-hero.jpg';

export const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      // User is already logged in, go directly to discover
      navigate('/discover');
    } else {
      // User needs to authenticate first
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-pure-white">
      <HookHeader onAuthClick={handleGetStarted} />
      
      {/* Hero Section */}
      <main className="container mx-auto px-brutal py-brutal">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-brutal items-center min-h-[80vh]">
          
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-brutal-display text-pure-black font-grotesk leading-none">
                SOCIAL
                <br />
                <span className="text-neon-pink">DISCOVERY</span>
                <br />
                REIMAGINED
              </h2>
              
              <p className="text-brutal-mono text-lg text-gray-700 max-w-md">
                SWIPE • MATCH • CONNECT • EXPLORE EVENTS • BUILD COMMUNITIES
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="xl"
                onClick={handleGetStarted}
                className="flex-1 sm:flex-none"
              >
                {user ? 'DISCOVER USERS' : 'START EXPLORING'}
              </Button>
              
              <Button 
                variant="secondary" 
                size="xl"
                className="flex-1 sm:flex-none"
              >
                LEARN MORE
              </Button>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-neon-pink border-2 border-pure-black"></div>
                <span className="text-brutal-mono text-sm">DARING & OPEN-MINDED</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-toxic-green border-2 border-pure-black"></div>
                <span className="text-brutal-mono text-sm">COMMUNITY EVENTS</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-electric-blue border-2 border-pure-black"></div>
                <span className="text-brutal-mono text-sm">BOLD CONNECTIONS</span>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative">
            <div className="card-brutal bg-pure-black p-0 overflow-hidden">
              <img 
                src={hookHero}
                alt="HOOK - Daring Social Discovery"
                className="w-full h-auto border-none"
              />
            </div>
            
            {/* Overlay Text */}
            <div className="absolute top-8 left-8 bg-neon-pink px-4 py-2 border-4 border-pure-black">
              <span className="text-brutal-mono text-pure-white font-bold">
                BE BOLD
              </span>
            </div>
            
            <div className="absolute bottom-8 right-8 bg-toxic-green px-4 py-2 border-4 border-pure-black">
              <span className="text-brutal-mono text-pure-black font-bold">
                HOOK UP
              </span>
            </div>
          </div>
        </div>
        {/* Features Section */}
        <section className="py-brutal">
          <div className="text-center mb-brutal">
            <h3 className="text-brutal-lg font-grotesk text-pure-black">
              WHAT MAKES HOOK DIFFERENT?
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-brutal bg-neon-pink text-pure-white p-6 hover:bg-pure-black hover:text-neon-pink">
              <div className="text-4xl mb-4 font-bold font-mono">01</div>
              <h4 className="text-brutal-title text-lg mb-4 font-grotesk">
                SWIPE
              </h4>
              <p className="text-brutal-mono text-sm">
                DISCOVER PROFILES WITH BOLD SWIPING MECHANICS
              </p>
            </div>

            <div className="card-brutal bg-toxic-green text-pure-black p-6 hover:bg-pure-black hover:text-toxic-green">
              <div className="text-4xl mb-4 font-bold font-mono">02</div>
              <h4 className="text-brutal-title text-lg mb-4 font-grotesk">
                EVENTS
              </h4>
              <p className="text-brutal-mono text-sm">
                JOIN COMMUNITY GATHERINGS & CREATE CONNECTIONS
              </p>
            </div>

            <div className="card-brutal bg-electric-blue text-pure-white p-6 hover:bg-pure-black hover:text-electric-blue">
              <div className="text-4xl mb-4 font-bold font-mono">03</div>
              <h4 className="text-brutal-title text-lg mb-4 font-grotesk">
                CHAT
              </h4>
              <p className="text-brutal-mono text-sm">
                REAL-TIME MESSAGING WITH BRUTAL HONESTY
              </p>
            </div>

            <div className="card-brutal bg-pure-black text-pure-white p-6 hover:bg-pure-white hover:text-pure-black">
              <div className="text-4xl mb-4 font-bold font-mono">04</div>
              <h4 className="text-brutal-title text-lg mb-4 font-grotesk">
                SAFETY
              </h4>
              <p className="text-brutal-mono text-sm">
                ROBUST MODERATION & USER PROTECTION
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section className="py-brutal mt-brutal border-t-brutal border-pure-black">
          <div className="text-center space-y-8">
            <h3 className="text-brutal-lg font-grotesk text-pure-black">
              READY TO HOOK UP?
            </h3>
            
            <div className="flex justify-center">
              <Button
                variant="accent"
                size="xl"
                onClick={handleGetStarted}
              >
                {user ? 'START DISCOVERING' : 'JOIN THE REVOLUTION'}
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-brutal border-pure-black bg-pure-black text-pure-white">
        <div className="container mx-auto px-brutal py-8">
          <div className="text-center">
            <p className="text-brutal-mono text-sm">
              © 2024 HOOK • DARING SOCIAL DISCOVERY
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
