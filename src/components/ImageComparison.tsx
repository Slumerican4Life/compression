import React, { useState, useRef, useCallback } from 'react';
import { Star, RotateCcw, Download, ZoomIn, ZoomOut, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { downloadFile } from '@/utils/imageCompression';

interface ImageComparisonProps {
  originalFile: File;
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  preview: string;
  onRatingChange?: (rating: number) => void;
  initialRating?: number;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalFile,
  compressedFile,
  originalSize,
  compressedSize,
  compressionRatio,
  preview,
  onRatingChange,
  initialRating = 0,
}) => {
  const [sliderPosition, setSliderPosition] = useState([50]);
  const [currentView, setCurrentView] = useState<'comparison' | 'original' | 'compressed'>('comparison');
  const [zoom, setZoom] = useState(100);
  const [rating, setRating] = useState(initialRating);
  const [compressedPreview, setCompressedPreview] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Create compressed file preview
  React.useEffect(() => {
    const url = URL.createObjectURL(compressedFile);
    setCompressedPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [compressedFile]);

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

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
    onRatingChange?.(starRating);
  };

  const resetZoom = () => setZoom(100);
  const zoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const zoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  const renderStars = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => handleStarClick(star)}
          className="transition-colors duration-200 hover:scale-110"
        >
          <Star
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground hover:text-yellow-300'
            }`}
          />
        </button>
      ))}
      <span className="text-sm text-muted-foreground ml-2">
        ({rating}/5)
      </span>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground">
            Quality Comparison
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant={currentView === 'comparison' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('comparison')}
            >
              Compare
            </Button>
            <Button
              variant={currentView === 'original' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('original')}
            >
              Original
            </Button>
            <Button
              variant={currentView === 'compressed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('compressed')}
            >
              Compressed
            </Button>
          </div>
        </div>

        {/* File Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Original Size</div>
            <div className="font-medium">{formatFileSize(originalSize)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Compressed Size</div>
            <div className="font-medium">{formatFileSize(compressedSize)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Space Saved</div>
            <div className="font-medium text-green-600">
              {compressionRatio.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer */}
      <div className="relative bg-checkerboard">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2">
          <Button variant="ghost" size="sm" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground px-2">{zoom}%</span>
          <Button variant="ghost" size="sm" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetZoom}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Image Container */}
        <div
          ref={containerRef}
          className="relative h-96 overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {currentView === 'comparison' && (
            <>
              {/* Original Image */}
              <img
                src={preview}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center',
                }}
              />
              
              {/* Compressed Image with Clip Path */}
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
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'center',
                  }}
                />
              </div>

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
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
                Original
              </div>
              <div className="absolute top-4 right-16 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
                Compressed
              </div>
            </>
          )}

          {currentView === 'original' && (
            <img
              src={preview}
              alt="Original"
              className="w-full h-full object-contain"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center',
              }}
            />
          )}

          {currentView === 'compressed' && (
            <img
              src={compressedPreview}
              alt="Compressed"
              className="w-full h-full object-contain"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center',
              }}
            />
          )}
        </div>

        {/* Slider Control for Comparison Mode */}
        {currentView === 'comparison' && (
          <div className="p-4 border-t bg-muted/30">
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
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Quality Rating</div>
            {renderStars()}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => downloadFile(originalFile)}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Original
            </Button>
            <Button
              onClick={() => downloadFile(compressedFile)}
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Compressed
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ImageComparison;