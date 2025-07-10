import React, { useState, useCallback } from 'react';
import { Upload, Settings, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCompressionQueue } from '@/hooks/useCompressionQueue';
import QueueManager from '@/components/QueueManager';
import ImageComparison from '@/components/ImageComparison';
import CompletedImagesGrid from '@/components/CompletedImagesGrid';
import AdSenseAd from '@/components/AdSenseAd';

const ImageUpload = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [quality, setQuality] = useState([0.8]);
  const [selectedComparison, setSelectedComparison] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use the new queue management hook
  const {
    queue,
    isProcessing,
    overallProgress,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearQueue,
    retryFailed,
    getQueueStats,
    autoProcess,
    setAutoProcess,
  } = useCompressionQueue();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateAndProcessFiles = useCallback((files: FileList | File[]) => {
    const validFiles: File[] = [];
    const fileArray = Array.from(files);
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes

    fileArray.forEach(file => {
      if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a JPEG file. Only JPEG files are supported.`,
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is ${formatFileSize(file.size)}. Maximum size is 10MB.`,
          variant: "destructive",
        });
        return;
      }
      
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      addToQueue(validFiles);
      toast({
        title: "Files added to queue",
        description: `${validFiles.length} JPEG file${validFiles.length > 1 ? 's' : ''} added to compression queue.`,
      });
    }
  }, [toast, addToQueue]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndProcessFiles(files);
    }
  }, [validateAndProcessFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  }, [validateAndProcessFiles]);

  const handleStartCompression = useCallback(async () => {
    await processQueue({
      quality: quality[0],
      maxWidth: 1920,
      maxHeight: 1080,
    });
  }, [processQueue, quality]);

  const completedItems = queue.filter(item => item.status === 'completed');
  const queueStats = getQueueStats();

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Top AdSense Ad */}
      <AdSenseAd 
        slot="top-banner" 
        format="horizontal" 
        className="max-w-4xl mx-auto"
      />

      {/* Upload Area */}
      <Card 
        className={`
          relative border-2 border-dashed transition-all duration-300 ease-smooth
          ${isDragActive 
            ? 'border-primary bg-gradient-upload shadow-medium scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-gradient-upload/50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <div className="p-12 text-center">
          <div className={`
            inline-flex items-center justify-center w-16 h-16 rounded-full mb-6
            transition-all duration-300 ease-smooth
            ${isDragActive 
              ? 'bg-primary text-primary-foreground scale-110' 
              : 'bg-gradient-secondary text-muted-foreground'
            }
          `}>
            <Upload className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2 text-foreground">
            {isDragActive ? 'Drop your images here' : 'Upload your JPEG images'}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            Drag and drop your JPEG files here, or click to browse
          </p>
          
          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          
          <Button 
            variant="outline" 
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Choose Files
          </Button>
        </div>
      </Card>

      {/* Side AdSense Ads */}
      {queue.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdSenseAd 
            slot="left-sidebar" 
            format="rectangle" 
          />
          <AdSenseAd 
            slot="right-sidebar" 
            format="rectangle" 
          />
        </div>
      )}

      {/* Queue Management */}
      {queue.length > 0 && (
        <>
          {/* Compression Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Compression Settings</h3>
              <div className="ml-auto flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Auto-process:</label>
                <input
                  type="checkbox"
                  checked={autoProcess}
                  onChange={(e) => setAutoProcess(e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <Label htmlFor="quality" className="text-sm font-medium">
                  Quality: {Math.round(quality[0] * 100)}%
                </Label>
                <div className="mt-2">
                  <Slider
                    id="quality"
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    value={quality}
                    onValueChange={setQuality}
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Higher quality = larger file size, Lower quality = smaller file size
                </p>
              </div>
              
              <Button 
                onClick={handleStartCompression}
                disabled={isProcessing || queueStats.pending === 0}
                size="lg"
                className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-medium hover:shadow-large transition-all duration-300 px-8 py-3"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing Queue...
                  </>
                ) : (
                  `Start Compression (${queueStats.pending})`
                )}
              </Button>
            </div>
          </Card>

          <QueueManager
            queue={queue}
            isProcessing={isProcessing}
            overallProgress={overallProgress}
            onRemoveItem={removeFromQueue}
            onRetryFailed={() => retryFailed({
              quality: quality[0],
              maxWidth: 1920,
              maxHeight: 1080,
            })}
            onClearQueue={clearQueue}
            queueStats={queueStats}
          />
        </>
      )}

      {/* Completed Images Grid */}
      <CompletedImagesGrid
        completedItems={completedItems}
        onRemoveItem={removeFromQueue}
        onCompareImage={setSelectedComparison}
      />

      {/* Image Comparison Modal */}
      {selectedComparison && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg max-w-6xl w-full max-h-[95vh] overflow-auto shadow-2xl">
            {(() => {
              const item = completedItems.find(item => item.id === selectedComparison);
              if (!item || !item.result) return null;
              
              return (
                <ImageComparison
                  originalFile={item.file}
                  compressedFile={item.result.compressedFile}
                  originalSize={item.result.originalSize}
                  compressedSize={item.result.compressedSize}
                  compressionRatio={item.result.compressionRatio}
                  preview={item.preview}
                  onRatingChange={(rating) => {
                    console.log(`Image ${item.file.name} rated: ${rating}/5`);
                  }}
                />
              );
            })()}
            
            <div className="p-4 border-t">
              <Button 
                onClick={() => setSelectedComparison(null)}
                variant="outline"
                className="w-full"
              >
                Close Comparison
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;