import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Download, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { compressImage, downloadFile, downloadAllFiles } from '@/utils/imageCompression';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  size: string;
}

interface CompressedFile {
  id: string;
  originalFile: File;
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  preview: string;
}

const ImageUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [compressedFiles, setCompressedFiles] = useState<CompressedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [quality, setQuality] = useState([0.8]);
  const { toast } = useToast();

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

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: e.target?.result as string,
          size: formatFileSize(file.size),
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });

    if (validFiles.length > 0) {
      toast({
        title: "Files uploaded successfully",
        description: `${validFiles.length} JPEG file${validFiles.length > 1 ? 's' : ''} ready for compression.`,
      });
    }
  }, [toast]);

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

  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const handleCompress = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files to compress",
        description: "Please upload some JPEG files first.",
        variant: "destructive",
      });
      return;
    }

    setIsCompressing(true);
    setCompressedFiles([]);

    try {
      const compressionPromises = uploadedFiles.map(async (uploadedFile) => {
        const result = await compressImage(uploadedFile.file, {
          quality: quality[0],
          maxWidth: 1920,
          maxHeight: 1080,
        });

        const compressedFile: CompressedFile = {
          id: uploadedFile.id,
          originalFile: uploadedFile.file,
          compressedFile: result.compressedFile,
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          compressionRatio: result.compressionRatio,
          preview: uploadedFile.preview,
        };

        return compressedFile;
      });

      const results = await Promise.all(compressionPromises);
      setCompressedFiles(results);

      toast({
        title: "Compression completed",
        description: `Successfully compressed ${results.length} image${results.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      toast({
        title: "Compression failed",
        description: "Some images failed to compress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  }, [uploadedFiles, quality, toast]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
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

      {/* Uploaded Files Grid */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Uploaded Images ({uploadedFiles.length})
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {uploadedFiles.map((file, index) => (
              <Card 
                key={file.id} 
                className="overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-destructive/90"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-medium text-sm text-foreground truncate mb-1" title={file.file.name}>
                    {file.file.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {file.size}
                  </p>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Compression Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Compression Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
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
            </div>
          </Card>

          {/* Compress Button */}
          <div className="flex justify-center pt-6">
            <Button 
              onClick={handleCompress}
              disabled={isCompressing}
              size="lg"
              className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-medium hover:shadow-large transition-all duration-300 px-8 py-3 text-lg font-semibold"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Compressing...
                </>
              ) : (
                `Compress Images (${uploadedFiles.length})`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Compressed Files Grid */}
      {compressedFiles.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              Compressed Images ({compressedFiles.length})
            </h2>
            <Button 
              onClick={() => downloadAllFiles(compressedFiles.map(f => f.compressedFile))}
              variant="outline"
              className="hover:bg-primary hover:text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {compressedFiles.map((file, index) => (
              <Card 
                key={file.id} 
                className="overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <img
                    src={file.preview}
                    alt={file.originalFile.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <Button
                    onClick={() => downloadFile(file.compressedFile)}
                    className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary/90"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="p-4 space-y-2">
                  <h4 className="font-medium text-sm text-foreground truncate" title={file.originalFile.name}>
                    {file.compressedFile.name}
                  </h4>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Original:</span>
                      <span>{formatFileSize(file.originalSize)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Compressed:</span>
                      <span>{formatFileSize(file.compressedSize)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-foreground">Saved:</span>
                      <span className="text-green-600">
                        {file.compressionRatio.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;