"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image as ImageIcon, File, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (file: File) => Promise<{ url: string; fileName: string; mimeType: string }>;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({ onUpload, accept, maxSize = 10 * 1024 * 1024, disabled, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    if (maxSize && file.size > maxSize) {
      setError(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`);
      return;
    }

    setUploading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await onUpload(file);
      setProgress(100);
      setUploadedFile({
        name: result.fileName || file.name,
        url: result.url,
        type: result.mimeType || file.type,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || uploading) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [disabled, uploading, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled && !uploading) {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-8 w-8" />;
    if (type.includes("pdf")) return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card
        className={cn(
          "border-2 border-dashed transition-all cursor-pointer",
          isDragging && "border-primary bg-primary/5 scale-[1.02]",
          uploadedFile && "border-green-500 bg-green-50",
          error && "border-destructive bg-destructive/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <CardContent className="p-8">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled || uploading}
          />

          {uploading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Upload className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-center text-sm font-medium">Uploading...</p>
                <Progress value={progress} className="h-2" />
                <p className="text-center text-xs text-muted-foreground">{progress}%</p>
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center text-green-600">
                <CheckCircle className="h-12 w-12" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-sm">File uploaded successfully</p>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  {getFileIcon(uploadedFile.type)}
                  <span className="text-xs">{uploadedFile.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="mt-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  {accept ? `Accepted formats: ${accept}` : "All file types accepted"}
                  {maxSize && ` · Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
