import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export interface FilterOptions {
  ageRange: [number, number];
  maxDistance: number;
  interests: string[];
  profileType: 'all' | 'solo' | 'couple' | 'group';
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-4 border-black max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">FILTERS</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label className="font-black mb-2 block">AGE RANGE</Label>
            <div className="px-2">
              <Slider
                value={filters.ageRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, ageRange: value as [number, number] }))}
                min={18}
                max={65}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-sm font-bold">
                <span>{filters.ageRange[0]}</span>
                <span>{filters.ageRange[1]}</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="font-black mb-2 block">MAX DISTANCE (KM)</Label>
            <div className="px-2">
              <Slider
                value={[filters.maxDistance]}
                onValueChange={(value) => setFilters(prev => ({ ...prev, maxDistance: value[0] }))}
                min={1}
                max={100}
                step={1}
                className="mb-2"
              />
              <div className="text-center text-sm font-bold">{filters.maxDistance} km</div>
            </div>
          </div>

          <div>
            <Label className="font-black mb-2 block">PROFILE TYPE</Label>
            <div className="grid grid-cols-2 gap-2">
              {['all', 'solo', 'couple', 'group'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilters(prev => ({ ...prev, profileType: type as any }))}
                  className={`p-2 font-black border-2 border-black ${
                    filters.profileType === type ? 'bg-brutal-pink' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-black mb-2 block">INTERESTS</Label>
            <Input
              value={filters.interests.join(', ')}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
              placeholder="music, art, sports..."
              className="border-2 border-black font-bold"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-black border-2 border-black font-black"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-brutal-green text-black border-2 border-black font-black"
            >
              APPLY
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};