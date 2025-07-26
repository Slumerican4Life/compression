import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { ToggleLeft } from 'lucide-react';
import { compressImage } from '@/utils/imageCompression';

interface LivePreviewComparisonProps {
  originalFile: File;
  originalPreview: string;
  quality: number;
}

const LivePreviewComparison: React.FC<LivePreviewComparisonProps> = ({
  originalFile,
  originalPreview,
  quality,
}) => {
  const [sliderPosition, setSliderPosition] = useState([50]);
  const [compressedPreview, setCompressedPreview] = useState<string>('');
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Generate compressed preview when quality changes
  useEffect(() => {
    const generatePreview = async () => {
      try {
        const result = await compressImage(originalFile, { quality });
        const url = URL.createObjectURL(result.compressedFile);
        setCompressedPreview(url);
        setOriginalSize(result.originalSize);
        setCompressedSize(result.compressedSize);
        
        return () => URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    };

    const cleanup = generatePreview();
    return () => {
      if (compressedPreview) {
        URL.revokeObjectURL(compressedPreview);
      }
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [originalFile, quality]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition([percentage]);
  }, []);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const compressionRatio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* File Size Info */}
      <div className="grid grid-cols-3 gap-4 p-3 bg-background/50 rounded text-sm">
        <div className="text-center">
          <div className="text-muted-foreground">Original</div>
          <div className="font-medium">{formatFileSize(originalSize)}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Compressed</div>
          <div className="font-medium">{formatFileSize(compressedSize)}</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Saved</div>
          <div className="font-medium text-green-600">{compressionRatio.toFixed(1)}%</div>
        </div>
      </div>

      {/* Image Comparison */}
      <div
        ref={containerRef}
        className="relative h-64 overflow-hidden cursor-crosshair rounded border bg-checkerboard"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Original Image */}
        <img
          src={originalPreview}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain"
        />
        
        {/* Compressed Image with Clip Path */}
        {compressedPreview && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: `inset(0 ${100 - sliderPosition[0]}% 0 0)`,
            }}
          >
            <img
              src={compressedPreview}
              alt="Compressed"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg pointer-events-none"
          style={{ left: `${sliderPosition[0]}%` }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg pointer-events-auto cursor-grab">
            <ToggleLeft className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
          Original
        </div>
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
          Compressed
        </div>
      </div>

      {/* Slider Control */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Original</span>
          <span>Compressed</span>
        </div>
        <Slider
          value={sliderPosition}
          onValueChange={setSliderPosition}
          max={100}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default LivePreviewComparison;