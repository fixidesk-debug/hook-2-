import React from 'react';

export const FeatureGrid = () => {
  return (
    <section className="py-brutal">
      <div className="container mx-auto px-brutal">
        <h3 className="text-brutal-lg font-grotesk text-pure-black text-center mb-brutal">
          WHAT MAKES HOOK DIFFERENT?
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-brutal bg-neon-pink text-pure-white p-6 hover:bg-pure-black hover:text-neon-pink group">
            <div className="text-4xl mb-4 font-bold font-mono">01</div>
            <h4 className="text-brutal-title text-lg mb-4 font-grotesk">
              SWIPE
            </h4>
            <p className="text-brutal-mono text-sm">
              DISCOVER PROFILES WITH BOLD SWIPING MECHANICS. NO GAMES, JUST PURE CONNECTION.
            </p>
          </div>

          <div className="card-brutal bg-toxic-green text-pure-black p-6 hover:bg-pure-black hover:text-toxic-green group">
            <div className="text-4xl mb-4 font-bold font-mono">02</div>
            <h4 className="text-brutal-title text-lg mb-4 font-grotesk">
              EVENTS
            </h4>
            <p className="text-brutal-mono text-sm">
              JOIN COMMUNITY GATHERINGS & CREATE CONNECTIONS BEYOND THE SCREEN.
            </p>
          </div>

          <div className="card-brutal bg-electric-blue text-pure-white p-6 hover:bg-pure-black hover:text-electric-blue group">
            <div className="text-4xl mb-4 font-bold font-mono">03</div>
            <h4 className="text-brutal-title text-lg mb-4 font-grotesk">
              CHAT
            </h4>
            <p className="text-brutal-mono text-sm">
              REAL-TIME MESSAGING WITH BRUTAL HONESTY AND AUTHENTIC CONNECTIONS.
            </p>
          </div>

          <div className="card-brutal bg-pure-black text-pure-white p-6 hover:bg-pure-white hover:text-pure-black group">
            <div className="text-4xl mb-4 font-bold font-mono">04</div>
            <h4 className="text-brutal-title text-lg mb-4 font-grotesk">
              SAFETY
            </h4>
            <p className="text-brutal-mono text-sm">
              ROBUST MODERATION & USER PROTECTION. YOUR SAFETY IS NOT NEGOTIABLE.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};