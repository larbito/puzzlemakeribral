import React from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Layers } from 'lucide-react';

interface TShirtModeSelectorProps {
  onModeSelect: (mode: string) => void;
}

export const TShirtModeSelector: React.FC<TShirtModeSelectorProps> = ({ onModeSelect }) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-md shadow-md">
      <Button 
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => onModeSelect('image')}
      >
        <ImageIcon className="w-5 h-5" />
        <span>Image to Design</span>
      </Button>
      
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => onModeSelect('bulk')}
      >
        <Layers className="w-5 h-5" />
        <span>Bulk Image to Designs</span>
      </Button>
    </div>
  );
};

export default TShirtModeSelector; 