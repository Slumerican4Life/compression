import React from 'react';
import { CheckCircle, XCircle, Clock, Loader2, RotateCcw, Trash2, Download, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { QueueItem } from '@/hooks/useCompressionQueue';
import { downloadFile, downloadSelectedFiles } from '@/utils/imageCompression';

interface QueueManagerProps {
  queue: QueueItem[];
  isProcessing: boolean;
  overallProgress: number;
  onRemoveItem: (id: string) => void;
  onRetryFailed: () => void;
  onClearQueue: () => void;
  onToggleSelection: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  queueStats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    selected: number;
    total: number;
  };
}

const QueueManager: React.FC<QueueManagerProps> = ({
  queue,
  isProcessing,
  overallProgress,
  onRemoveItem,
  onRetryFailed,
  onClearQueue,
  onToggleSelection,
  onSelectAll,
  queueStats,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: QueueItem['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
    } as const;

    const colors = {
      pending: 'text-muted-foreground',
      processing: 'text-primary',
      completed: 'text-green-600',
      failed: 'text-destructive-foreground',
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const completedItems = queue.filter(item => item.status === 'completed' && item.result);
  const selectedCompletedItems = completedItems.filter(item => item.selected);

  const handleDownloadSelected = () => {
    const filesToDownload = selectedCompletedItems.map(item => item.result!.compressedFile);
    downloadSelectedFiles(filesToDownload);
  };

  const handleDownloadAll = () => {
    const filesToDownload = completedItems.map(item => item.result!.compressedFile);
    downloadSelectedFiles(filesToDownload);
  };

  if (queue.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Queue Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-foreground">
              Compression Queue ({queueStats.total} files)
            </h3>
            {completedItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={completedItems.length > 0 && completedItems.every(item => item.selected)}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                />
                <span className="text-sm text-muted-foreground">Select All Completed</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {selectedCompletedItems.length > 0 && (
              <Button
                onClick={handleDownloadSelected}
                variant="default"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Selected ({selectedCompletedItems.length})
              </Button>
            )}
            {completedItems.length > 0 && (
              <Button
                onClick={handleDownloadAll}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All Compressed ({completedItems.length})
              </Button>
            )}
            {queueStats.failed > 0 && (
              <Button
                onClick={onRetryFailed}
                variant="outline"
                size="sm"
                disabled={isProcessing}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Failed ({queueStats.failed})
              </Button>
            )}
            <Button
              onClick={onClearQueue}
              variant="outline"
              size="sm"
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Queue
            </Button>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{queueStats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{queueStats.processing}</div>
            <div className="text-sm text-muted-foreground">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{queueStats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{queueStats.selected}</div>
            <div className="text-sm text-muted-foreground">Selected</div>
          </div>
        </div>

        {/* Overall Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
          </div>
        )}
      </Card>

      {/* Queue Items */}
      <div className="space-y-3">
        {queue.map((item, index) => (
          <Card
            key={item.id}
            className="p-4 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              {/* Selection Checkbox */}
              {item.status === 'completed' && item.result && (
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={() => onToggleSelection(item.id)}
                />
              )}

              {/* File Preview */}
              <div className="relative">
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="w-16 h-16 object-cover rounded border"
                    onError={(e) => {
                      console.error('Image failed to load:', item.preview, e);
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', item.file.name);
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No preview</span>
                  </div>
                )}
                <div className="absolute -top-1 -right-1">
                  {getStatusIcon(item.status)}
                </div>
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  {getStatusBadge(item.status)}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Original: {formatFileSize(item.file.size)}</span>
                  {item.result && (
                    <>
                      <span>Compressed: {formatFileSize(item.result.compressedSize)}</span>
                      <span className="text-green-600 font-medium">
                        Saved: {item.result.compressionRatio.toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>

                {/* Individual Progress */}
                {item.status === 'processing' && (
                  <div className="mt-2">
                    <Progress value={item.progress} className="w-full h-1" />
                  </div>
                )}

                {/* Error Message */}
                {item.status === 'failed' && item.error && (
                  <p className="text-xs text-destructive mt-1">{item.error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {item.status === 'completed' && item.result && (
                  <Button
                    onClick={() => downloadFile(item.result!.compressedFile)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => onRemoveItem(item.id)}
                  variant="ghost"
                  size="sm"
                  disabled={isProcessing && item.status === 'processing'}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QueueManager;