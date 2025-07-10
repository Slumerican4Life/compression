import React, { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  size: string;
}

const ImageUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
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

    fileArray.forEach(file => {
      if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        validFiles.push(file);
      } else {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a JPEG file. Only JPEG files are supported.`,
          variant: "destructive",
        });
      }
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

  const handleCompress = useCallback(() => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files to compress",
        description: "Please upload some JPEG files first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Compression started",
      description: `Starting compression for ${uploadedFiles.length} image${uploadedFiles.length > 1 ? 's' : ''}...`,
    });
  }, [uploadedFiles.length, toast]);

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
          
          {/* Compress Button */}
          <div className="flex justify-center pt-6">
            <Button 
              onClick={handleCompress}
              size="lg"
              className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-medium hover:shadow-large transition-all duration-300 px-8 py-3 text-lg font-semibold"
            >
              Compress Images ({uploadedFiles.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;