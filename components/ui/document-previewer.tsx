"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, Image as ImageIcon, File } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DocumentPreviewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName: string;
  mimeType: string;
}

export function DocumentPreviewer({ open, onOpenChange, fileUrl, fileName, mimeType }: DocumentPreviewerProps) {
  const [loading, setLoading] = useState(true);

  const isImage = mimeType.startsWith("image/");
  const isPDF = mimeType.includes("pdf");
  const isText = mimeType.startsWith("text/");

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-muted/50 rounded-lg overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          <Image
            src={fileUrl}
            alt={fileName}
            fill
            className="object-contain"
            onLoadingComplete={() => setLoading(false)}
            unoptimized
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-full rounded-lg border"
          title={fileName}
          onLoad={() => setLoading(false)}
        />
      );
    }

    if (isText) {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-full rounded-lg border bg-white"
          title={fileName}
          onLoad={() => setLoading(false)}
        />
      );
    }

    return (
      <Card className="w-full">
        <CardContent className="p-12 text-center space-y-4">
          <div className="flex justify-center">
            <File className="h-24 w-24 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Preview not available</p>
            <p className="text-sm text-muted-foreground">
              This file type cannot be previewed in the browser.
            </p>
            <p className="text-xs text-muted-foreground">
              {fileName} ({mimeType})
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-4">
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
            <Button asChild variant="outline">
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {isImage ? (
                <ImageIcon className="h-5 w-5" />
              ) : isPDF ? (
                <FileText className="h-5 w-5" />
              ) : (
                <File className="h-5 w-5" />
              )}
              {fileName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
