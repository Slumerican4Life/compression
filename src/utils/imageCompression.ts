interface CompressionOptions {
  quality: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  outputFormat?: 'jpeg' | 'png' | 'webp';
}

interface CompressedResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

// Helper function to detect and validate image formats
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const getSupportedImageFormats = (): string[] => {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
};

export const compressImage = (file: File, options: CompressionOptions): Promise<CompressedResult> => {
  return new Promise((resolve, reject) => {
    // Validate that it's an image file
    if (!isImageFile(file)) {
      reject(new Error('File must be an image'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      const maxWidth = options.maxWidth || 1920;
      const maxHeight = options.maxHeight || 1080;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        // Determine output format - default to JPEG for best compression
        const outputFormat = options.outputFormat || 'jpeg';
        const mimeType = outputFormat === 'jpeg' ? 'image/jpeg' : 
                        outputFormat === 'png' ? 'image/png' : 
                        outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
        
        // Get file extension for output format
        const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, `_compressed.${extension}`),
                {
                  type: mimeType,
                  lastModified: Date.now(),
                }
              );

              const originalSize = file.size;
              const compressedSize = compressedFile.size;
              const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

              resolve({
                compressedFile,
                originalSize,
                compressedSize,
                compressionRatio,
              });
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          mimeType,
          options.quality
        );
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

export const downloadFile = (file: File, filename?: string) => {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadAllFiles = (files: File[], zipName: string = 'compressed_images.zip') => {
  // For multiple files, we'll download them individually for now
  // In a future version, we could implement ZIP compression
  files.forEach((file, index) => {
    setTimeout(() => {
      downloadFile(file);
    }, index * 100); // Stagger downloads to avoid browser blocking
  });
};

export const downloadSelectedFiles = (files: File[]) => {
  files.forEach((file, index) => {
    setTimeout(() => {
      downloadFile(file);
    }, index * 100); // Stagger downloads to avoid browser blocking
  });
};