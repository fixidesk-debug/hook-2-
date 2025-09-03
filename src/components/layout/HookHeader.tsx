import React from 'react';
import { Button } from '@/components/ui/button-brutal';
import { Link } from 'react-router-dom';

interface HookHeaderProps {
  onAuthClick: () => void;
}

export const HookHeader = ({ onAuthClick }: HookHeaderProps) => {
  return (
    <header className="w-full border-b-brutal border-pure-black bg-pure-white">
      <div className="container mx-auto px-brutal py-6 flex items-center justify-between">
        <Link to="/">
          <h1 className="text-brutal-headline text-pure-black font-grotesk">
            HOOK
          </h1>
        </Link>
        
        <Button 
          variant="primary" 
          size="sm"
          onClick={onAuthClick}
        >
          GET STARTED
        </Button>
      </div>
    </header>
  );
};