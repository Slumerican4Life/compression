import React, { useState, useCallback } from 'react';
import { Upload, Settings, Loader2, Eye, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCompressionQueue } from '@/hooks/useCompressionQueue';
import { useAuth } from '@/contexts/AuthContext';
import QueueManager from '@/components/QueueManager';
import ImageComparison from '@/components/ImageComparison';
import CompletedImagesGrid from '@/components/CompletedImagesGrid';
import AdSenseAd from '@/components/AdSenseAd';
import AdminPanel from '@/components/AdminPanel';

const ImageUpload = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [quality, setQuality] = useState([0.8]);
  const [selectedComparison, setSelectedComparison] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const { toast } = useToast();
  const { user, subscribed, isTrial } = useAuth();
  
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
    toggleSelection,
    selectAll,
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
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file. All image formats are supported.`,
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
      try {
        addToQueue(validFiles, subscribed, isTrial);
        toast({
          title: "Files added to queue",
          description: `${validFiles.length} image file${validFiles.length > 1 ? 's' : ''} added to compression queue.`,
        });
      } catch (error: any) {
        toast({
          title: "Queue limit reached",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  }, [toast, addToQueue, subscribed, isTrial]);

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
      {/* Admin Panel */}
      {showAdmin && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg max-w-6xl w-full max-h-[95vh] overflow-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Admin Panel</h2>
                <Button onClick={() => setShowAdmin(false)} variant="outline">
                  Close
                </Button>
              </div>
              <AdminPanel />
            </div>
          </div>
        </div>
      )}

      {/* Admin Access Button */}
      {user?.email === 'cleanasawhistle1000@gmail.com' && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowAdmin(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Admin Panel
          </Button>
        </div>
      )}

      {/* Subscription Advertisement */}
      {!subscribed && !isTrial && (
        <Card className="border-primary bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <div className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-primary mr-2" />
              <h3 className="text-xl font-bold text-primary">Upgrade to Premium!</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Free users can only compress 3 images. Get unlimited compression for just $9.99/month!
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
              <span>✓ Unlimited image compression</span>
              <span>✓ Advanced compression algorithms</span>
              <span>✓ Priority processing</span>
            </div>
            <Button
              onClick={() => window.open('/subscription', '_blank')}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now - $9.99/month
            </Button>
          </div>
        </Card>
      )}

      {/* Usage Indicator for Free Users */}
      {!subscribed && !isTrial && (
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Images used: {queue.length}/3 (Free Plan)
            </span>
            <span className="text-xs text-muted-foreground">
              {queue.length >= 3 ? 'Limit reached!' : `${3 - queue.length} remaining`}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                queue.length >= 3 ? 'bg-destructive' : 'bg-primary'
              }`}
              style={{ width: `${Math.min((queue.length / 3) * 100, 100)}%` }}
            />
          </div>
        </Card>
      )}

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
            {isDragActive ? 'Drop your images here' : 'Upload your images'}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            Drag and drop your image files here, or click to browse. All image formats supported.
          </p>
          
              <input
                type="file"
                multiple
                accept="image/*"
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
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleStartCompression}
                  disabled={isProcessing || queueStats.pending === 0}
                  size="lg"
                  className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-medium hover:shadow-large transition-all duration-300 px-6 py-3"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Compress (${queueStats.pending})`
                  )}
                </Button>
                
                {queueStats.pending > 1 && (
                  <Button 
                    onClick={() => {
                      selectAll(true);
                      handleStartCompression();
                    }}
                    disabled={isProcessing}
                    variant="outline"
                    size="lg"
                    className="px-6 py-3"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Compress All
                  </Button>
                )}
              </div>
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
            onToggleSelection={toggleSelection}
            onSelectAll={selectAll}
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