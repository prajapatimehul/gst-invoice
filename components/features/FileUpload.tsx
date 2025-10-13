'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.csv')) {
          onFileSelect(file);
        } else {
          alert('Please upload a CSV file');
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <Card
      className={cn(
        'border-2 border-dashed transition-all duration-200 hover:border-primary/50',
        isDragging && 'border-primary bg-primary/5',
        isProcessing && 'opacity-50 pointer-events-none'
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-4">
          {isProcessing ? (
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          ) : (
            <Upload className="h-12 w-12 text-primary" />
          )}
        </div>

        <h3 className="text-xl font-semibold mb-2">
          {isProcessing ? 'Processing CSV...' : 'Upload Upwork Transaction Report'}
        </h3>

        <p className="text-muted-foreground mb-6 max-w-md">
          Drag and drop your Upwork transaction CSV here, or click to browse
        </p>

        <label
          htmlFor="file-upload"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium cursor-pointer hover:bg-primary/90 transition-colors"
        >
          <FileSpreadsheet className="h-5 w-5" />
          Choose CSV File
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        <p className="text-xs text-muted-foreground mt-4">
          Supports Upwork transaction report CSV files only
        </p>
      </CardContent>
    </Card>
  );
}
