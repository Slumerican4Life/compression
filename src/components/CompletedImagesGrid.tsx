import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, CheckSquare, Square } from 'lucide-react';
import { downloadAllFiles } from '@/utils/imageCompression';
import { QueueItem } from '@/hooks/useCompressionQueue';
import ImageCard from './ImageCard';
import AdSenseAd from './AdSenseAd';

interface CompletedImagesGridProps {
  completedItems: QueueItem[];
  onRemoveItem: (id: string) => void;
  onCompareImage: (id: string) => void;
}

const CompletedImagesGrid: React.FC<CompletedImagesGridProps> = ({
  completedItems,
  onRemoveItem,
  onCompareImage
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleSelectItem = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === completedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(completedItems.map(item => item.id)));
    }
  };

  const handleDownloadSelected = () => {
    const selectedFiles = completedItems
      .filter(item => selectedItems.has(item.id) && item.result)
      .map(item => item.result!.compressedFile);
    
    if (selectedFiles.length > 0) {
      downloadAllFiles(selectedFiles);
    }
  };

  const handleRemoveSelected = () => {
    selectedItems.forEach(id => onRemoveItem(id));
    setSelectedItems(new Set());
  };

  const formatTotalSaved = () => {
    const totalOriginal = completedItems.reduce((sum, item) => 
      sum + (item.result?.originalSize || 0), 0
    );
    const totalCompressed = completedItems.reduce((sum, item) => 
      sum + (item.result?.compressedSize || 0), 0
    );
    const saved = totalOriginal - totalCompressed;
    const percentage = totalOriginal > 0 ? ((saved / totalOriginal) * 100) : 0;
    
    return { saved, percentage };
  };

  const { saved, percentage } = formatTotalSaved();

  if (completedItems.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Header with Selection Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Compressed Images ({completedItems.length})
            </h2>
            <Badge variant="secondary" className="text-green-600">
              Total Saved: {(saved / (1024 * 1024)).toFixed(1)} MB ({percentage.toFixed(1)}%)
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {selectedItems.size === completedItems.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedItems.size === completedItems.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            {selectedItems.size > 0 && (
              <>
                <Button
                  onClick={handleDownloadSelected}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Selected ({selectedItems.size})
                </Button>
                <Button
                  onClick={handleRemoveSelected}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Selected
                </Button>
              </>
            )}
            
            <Button 
              onClick={() => downloadAllFiles(completedItems.map(item => item.result!.compressedFile))}
              variant="outline"
              className="hover:bg-primary hover:text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedItems.size > 0 && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-sm text-foreground">
              <span className="font-medium">{selectedItems.size}</span> of{' '}
              <span className="font-medium">{completedItems.length}</span> images selected
            </div>
          </div>
        )}
      </Card>

      {/* AdSense Ad - Header */}
      <AdSenseAd 
        slot="header-ad" 
        format="horizontal" 
        className="max-w-4xl mx-auto"
      />

      {/* Images Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {completedItems.map((item, index) => {
          // Insert ads every 6 images
          const shouldShowAd = index > 0 && (index + 1) % 6 === 0;
          
          return (
            <React.Fragment key={item.id}>
              <ImageCard
                item={item}
                index={index}
                isSelected={selectedItems.has(item.id)}
                onSelect={handleSelectItem}
                onRemove={onRemoveItem}
                onCompare={onCompareImage}
              />
              
              {shouldShowAd && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <AdSenseAd 
                    slot={`multiplex-ad-${Math.floor(index / 6)}`}
                    format="auto"
                    responsive={true}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom AdSense Ads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <AdSenseAd 
          slot="sidebar-left" 
          format="vertical" 
          className="h-64"
        />
        <AdSenseAd 
          slot="sidebar-right" 
          format="vertical" 
          className="h-64"
        />
      </div>

      {/* Bottom Multiplex Ad */}
      <AdSenseAd 
        slot="bottom-multiplex" 
        format="auto" 
        responsive={true}
        className="mt-6"
      />
    </div>
  );
};

export default CompletedImagesGrid;