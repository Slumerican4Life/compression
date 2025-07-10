import { useState, useCallback, useRef, useEffect } from 'react';
import { compressImage } from '@/utils/imageCompression';
import { useToast } from '@/hooks/use-toast';

export interface QueueItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    compressedFile: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
  error?: string;
}

export interface CompressionOptions {
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const useCompressionQueue = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [autoProcess, setAutoProcess] = useState(false);
  const { toast } = useToast();

  const processQueueRef = useRef<((options: CompressionOptions) => Promise<void>) | null>(null);

  const addToQueue = useCallback((files: File[], subscribed: boolean) => {
    const currentCount = queue.length;
    const maxFiles = subscribed ? Infinity : 3;
    const remainingSlots = maxFiles - currentCount;
    
    if (!subscribed && currentCount >= 3) {
      throw new Error("Free users can only compress 3 images. Upgrade to Premium for unlimited compression!");
    }
    
    const filesToAdd = subscribed ? files : files.slice(0, remainingSlots);
    if (!subscribed && files.length > remainingSlots) {
      throw new Error(`Free users can only compress 3 images total. You can add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}.`);
    }

    const newItems: QueueItem[] = filesToAdd.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
    }));

    setQueue(prev => [...prev, ...newItems]);
    
    return newItems;
  }, [queue]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const processQueue = useCallback(async (options: CompressionOptions) => {
    const pendingItems = queue.filter(item => item.status === 'pending');
    
    if (pendingItems.length === 0) {
      toast({
        title: "No files to process",
        description: "Please add some files to the queue first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setOverallProgress(0);

    const totalItems = pendingItems.length;
    let completedItems = 0;

    // Process items in batches of 3 to prevent overwhelming the browser
    const batchSize = 3;
    
    for (let i = 0; i < pendingItems.length; i += batchSize) {
      const batch = pendingItems.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item) => {
        try {
          // Update status to processing
          setQueue(prev => prev.map(qItem => 
            qItem.id === item.id 
              ? { ...qItem, status: 'processing' as const, progress: 10 }
              : qItem
          ));

          // Simulate progress updates during compression
          const progressInterval = setInterval(() => {
            setQueue(prev => prev.map(qItem => 
              qItem.id === item.id && qItem.progress < 90
                ? { ...qItem, progress: qItem.progress + 10 }
                : qItem
            ));
          }, 200);

          const result = await compressImage(item.file, options);
          
          clearInterval(progressInterval);

          // Update with completed result
          setQueue(prev => prev.map(qItem => 
            qItem.id === item.id 
              ? { 
                  ...qItem, 
                  status: 'completed' as const, 
                  progress: 100,
                  result
                }
              : qItem
          ));

          completedItems++;
          setOverallProgress((completedItems / totalItems) * 100);

        } catch (error) {
          setQueue(prev => prev.map(qItem => 
            qItem.id === item.id 
              ? { 
                  ...qItem, 
                  status: 'failed' as const, 
                  progress: 0,
                  error: error instanceof Error ? error.message : 'Compression failed'
                }
              : qItem
          ));
          
          completedItems++;
          setOverallProgress((completedItems / totalItems) * 100);
        }
      });

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
    }

    setIsProcessing(false);
    
    const successCount = queue.filter(item => item.status === 'completed').length;
    const failCount = queue.filter(item => item.status === 'failed').length;
    
    toast({
      title: "Batch processing completed",
      description: `${successCount} files compressed successfully${failCount > 0 ? `, ${failCount} failed` : ''}.`,
    });
  }, [queue, toast]);

  // Store processQueue ref for auto-processing
  useEffect(() => {
    processQueueRef.current = processQueue;
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setOverallProgress(0);
  }, []);

  const retryFailed = useCallback(async (options: CompressionOptions) => {
    const failedItems = queue.filter(item => item.status === 'failed');
    
    if (failedItems.length === 0) return;

    // Reset failed items to pending
    setQueue(prev => prev.map(item => 
      item.status === 'failed' 
        ? { ...item, status: 'pending', progress: 0, error: undefined }
        : item
    ));

    // Process the queue again
    await processQueue(options);
  }, [queue, processQueue]);

  const getQueueStats = useCallback(() => {
    const pending = queue.filter(item => item.status === 'pending').length;
    const processing = queue.filter(item => item.status === 'processing').length;
    const completed = queue.filter(item => item.status === 'completed').length;
    const failed = queue.filter(item => item.status === 'failed').length;
    
    return { pending, processing, completed, failed, total: queue.length };
  }, [queue]);

  return {
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
  };
};