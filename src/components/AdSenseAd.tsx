import React from 'react';
import { Card } from '@/components/ui/card';

interface AdSenseAdProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  responsive?: boolean;
}

const AdSenseAd: React.FC<AdSenseAdProps> = ({ 
  slot, 
  format = 'auto', 
  className = '',
  responsive = true 
}) => {
  return (
    <Card className={`p-4 bg-muted/30 border-dashed ${className}`}>
      <div className="text-center text-muted-foreground">
        <div className="text-sm font-medium mb-2">Advertisement</div>
        <div className="text-xs">AdSense Ad Slot: {slot}</div>
        <div className="text-xs">Format: {format}</div>
        {/* This will be replaced with actual AdSense code when ready */}
        <div className="mt-4 p-8 bg-muted/50 rounded border-2 border-dashed border-muted-foreground/30">
          <div className="text-xs text-muted-foreground">
            AdSense ad will appear here
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AdSenseAd;