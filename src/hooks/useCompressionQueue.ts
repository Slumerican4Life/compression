import { useState, useCallback, useRef, useEffect } from 'react';
import { compressImage } from '@/utils/imageCompression';
import { useToast } from '@/hooks/use-toast';

export interface QueueItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  selected: boolean;
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
  outputFormat?: 'jpeg' | 'png' | 'webp';
}

export const useCompressionQueue = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [autoProcess, setAutoProcess] = useState(false);
  const { toast } = useToast();

  const processQueueRef = useRef<((options: CompressionOptions) => Promise<void>) | null>(null);

  const addToQueue = useCallback((files: File[], subscribed: boolean, isTrial: boolean = false) => {
    const currentCount = queue.length;
    const hasPremiumAccess = subscribed || isTrial;
    const maxFiles = hasPremiumAccess ? Infinity : 3;
    const remainingSlots = maxFiles - currentCount;
    
    if (!hasPremiumAccess && currentCount >= 3) {
      throw new Error("Free users can only compress 3 images. Upgrade to Premium for unlimited compression!");
    }
    
    const filesToAdd = hasPremiumAccess ? files : files.slice(0, remainingSlots);
    if (!hasPremiumAccess && files.length > remainingSlots) {
      throw new Error(`Free users can only compress 3 images total. You can add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}.`);
    }

    const newItems: QueueItem[] = filesToAdd.map(file => {
      console.log('Adding file to queue:', file.name, file.type, file.size);
      const preview = URL.createObjectURL(file);
      console.log('Generated preview URL:', preview);
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        status: 'pending',
        progress: 0,
        selected: false,
      };
    });

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

  const toggleSelection = useCallback((id: string) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  }, []);

  const selectAll = useCallback((select: boolean) => {
    setQueue(prev => prev.map(item => ({ ...item, selected: select })));
  }, []);

  const getQueueStats = useCallback(() => {
    const pending = queue.filter(item => item.status === 'pending').length;
    const processing = queue.filter(item => item.status === 'processing').length;
    const completed = queue.filter(item => item.status === 'completed').length;
    const failed = queue.filter(item => item.status === 'failed').length;
    const selected = queue.filter(item => item.selected).length;
    
    return { pending, processing, completed, failed, selected, total: queue.length };
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
    toggleSelection,
    selectAll,
    autoProcess,
    setAutoProcess,
  };
};