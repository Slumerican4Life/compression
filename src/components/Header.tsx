import React from 'react';
import { Zap } from 'lucide-react';

const Header = () => {
  return (
    <header className="border-b bg-gradient-secondary">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-6 shadow-medium">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Image Compressor
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compress your JPEG images effortlessly. Upload multiple files and reduce their size 
            while maintaining excellent quality.
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;