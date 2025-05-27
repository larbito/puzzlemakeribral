import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { BookContent } from '../KDPBookFormatter';
import { v4 as uuidv4 } from 'uuid';
import {
  FileText,
  Upload,
  File,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface FileUploadStepProps {
  onFileUploaded: (file: File) => void;
  onContentExtracted: (content: Partial<BookContent>) => void;
  onTextExtracted: () => void;
}

export const FileUploadStep: React.FC<FileUploadStepProps> = ({
  onFileUploaded,
  onContentExtracted,
  onTextExtracted
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string>('');
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      onFileUploaded(selectedFile);
      extractContent(selectedFile);
    }
  }, [onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  const extractContent = async (selectedFile: File) => {
    setExtracting(true);
    setExtractProgress(10);
    setExtractError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);

      setExtractProgress(30);

      // Send file to backend for processing
      const response = await fetch(`http://localhost:3000/api/kdp-formatter/extract`, {
        method: 'POST',
        body: formData,
      });

      setExtractProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process file');
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        setExtractProgress(100);
        
        // Set the raw text preview
        const rawText = data.content.rawText || '';
        setPreviewText(rawText.substring(0, 1000) + (rawText.length > 1000 ? '...' : ''));
        
        // Update the parent component with the extracted content
        onContentExtracted(data.content);
        
        // Notify that text has been successfully extracted
        onTextExtracted();

        toast({
          title: 'Content extracted successfully',
          description: `Extracted ${rawText.length} characters from ${selectedFile.name}`,
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error extracting content:', error);
      
      let errorMessage = 'There was a problem processing your file. Please try another file or format.';
      
      if (error instanceof Error) {
        if (error.message.includes('file type')) {
          errorMessage = 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.';
        } else if (error.message.includes('size')) {
          errorMessage = 'File is too large. Please upload a file smaller than 50MB.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      setExtractError(errorMessage);
      
      toast({
        title: 'Error extracting content',
        description: errorMessage,
      });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Upload Your Manuscript</h2>
          <p className="text-muted-foreground">
            Upload a .docx, .pdf, or .txt file to get started
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground/80" />
              <p className="text-sm mb-2">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supported formats: .docx, .pdf, .txt
              </p>
              <Button size="sm" variant="outline">
                Browse Files
              </Button>
            </div>
            
            {file && (
              <div className="mt-6 flex items-center gap-3 border rounded-md p-3">
                <div className="bg-secondary p-2 rounded-md">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB • {file.type || 'Unknown type'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreviewText('');
                    setExtractError(null);
                    setExtractProgress(0);
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
            
            {extracting && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Extracting content...</span>
                  <span>{extractProgress}%</span>
                </div>
                <Progress value={extractProgress} className="h-2" />
              </div>
            )}
            
            {extractError && (
              <div className="mt-6 border border-destructive/50 bg-destructive/10 rounded-md p-3 text-sm">
                <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error extracting content</span>
                </div>
                <p>{extractError}</p>
              </div>
            )}
            
            {!extracting && extractProgress === 100 && (
              <div className="mt-6 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-md p-3 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Content extracted successfully</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Content Preview</h3>
            </div>
            <Separator className="mb-4" />
            
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {extracting ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
                </div>
              ) : previewText ? (
                <pre className="text-sm whitespace-pre-wrap">{previewText}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Upload a file to see content preview</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 