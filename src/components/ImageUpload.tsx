import React, { useState, useCallback } from 'react';
import { Upload, Settings, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { downloadAllFiles } from '@/utils/imageCompression';
import { useCompressionQueue } from '@/hooks/useCompressionQueue';
import QueueManager from '@/components/QueueManager';
import ImageComparison from '@/components/ImageComparison';

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

      {/* Queue Management */}
      {queue.length > 0 && (
        <>
          {/* Compression Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Compression Settings</h3>
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

      {/* Completed Images with Download All */}
      {completedItems.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              Compressed Images ({completedItems.length})
            </h2>
            <Button 
              onClick={() => downloadAllFiles(completedItems.map(item => item.result!.compressedFile))}
              variant="outline"
              className="hover:bg-primary hover:text-primary-foreground"
            >
              Download All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedItems.map((item, index) => (
              <Card 
                key={item.id} 
                className="overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <Button
                    onClick={() => setSelectedComparison(item.id)}
                    className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary/90"
                    size="sm"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="p-4 space-y-2">
                  <h4 className="font-medium text-sm text-foreground truncate" title={item.file.name}>
                    {item.result!.compressedFile.name}
                  </h4>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Original:</span>
                      <span>{formatFileSize(item.result!.originalSize)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Compressed:</span>
                      <span>{formatFileSize(item.result!.compressedSize)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-foreground">Saved:</span>
                      <span className="text-green-600">
                        {item.result!.compressionRatio.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Image Comparison Modal */}
      {selectedComparison && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
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