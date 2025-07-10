import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Trash2 } from 'lucide-react';
import { downloadFile } from '@/utils/imageCompression';
import { QueueItem } from '@/hooks/useCompressionQueue';

interface ImageCardProps {
  item: QueueItem;
  index: number;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onRemove: (id: string) => void;
  onCompare: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  item,
  index,
  isSelected,
  onSelect,
  onRemove,
  onCompare
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!item.result) return null;

  return (
    <Card 
      className={`
        overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in group cursor-pointer
        ${isSelected ? 'ring-2 ring-primary border-primary' : ''}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img
          src={item.preview}
          alt={item.file.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Selection Checkbox */}
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
            className="bg-background/80 backdrop-blur-sm border-2"
          />
        </div>

        {/* Compression Ratio Badge */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-green-600/90 backdrop-blur-sm text-white">
            -{item.result.compressionRatio.toFixed(1)}%
          </Badge>
        </div>
        
        {/* Hover Overlay */}
        <div className={`
          absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
          transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onCompare(item.id);
              }}
              className="bg-primary/90 text-primary-foreground rounded-full p-2 hover:bg-primary transition-all duration-300"
              size="sm"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(item.result!.compressedFile);
              }}
              className="bg-green-600/90 text-white rounded-full p-2 hover:bg-green-600 transition-all duration-300"
              size="sm"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              className="bg-destructive/90 text-destructive-foreground rounded-full p-2 hover:bg-destructive transition-all duration-300"
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        <h4 className="font-medium text-sm text-foreground truncate" title={item.file.name}>
          {item.result.compressedFile.name}
        </h4>
        
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Original:</span>
            <span>{formatFileSize(item.result.originalSize)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Compressed:</span>
            <span>{formatFileSize(item.result.compressedSize)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-foreground">Saved:</span>
            <span className="text-green-600">
              {formatFileSize(item.result.originalSize - item.result.compressedSize)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <Button
            onClick={() => downloadFile(item.result!.compressedFile)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
          <Button
            onClick={() => onCompare(item.id)}
            variant="ghost"
            size="sm"
            className="flex-1"
          >
            <Eye className="w-3 h-3 mr-1" />
            Compare
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ImageCard;