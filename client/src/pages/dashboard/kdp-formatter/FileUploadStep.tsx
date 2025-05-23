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
      let text = '';
      const fileType = selectedFile.type;

      // Create a synthetic progress simulation
      const progressInterval = setInterval(() => {
        setExtractProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      if (fileType === 'text/plain') {
        // Handle .txt files
        text = await readTextFile(selectedFile);
      } else if (fileType === 'application/pdf') {
        // Handle PDF files
        text = await extractPdfText(selectedFile);
      } else if (fileType.includes('wordprocessingml.document')) {
        // Handle .docx files
        text = await extractDocxText(selectedFile);
      } else {
        throw new Error('Unsupported file type');
      }

      clearInterval(progressInterval);
      setExtractProgress(100);
      
      // Set the raw text preview
      setPreviewText(text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
      
      // Process the text into structured content
      const structuredContent = processTextIntoChapters(text);
      
      // Update the parent component with the extracted content
      onContentExtracted({
        rawText: text,
        ...structuredContent
      });
      
      // Notify that text has been successfully extracted
      onTextExtracted();

      toast({
        title: 'Content extracted successfully',
        description: `Extracted ${text.length} characters from ${selectedFile.name}`,
      });
    } catch (error) {
      console.error('Error extracting content:', error);
      setExtractError(error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: 'Error extracting content',
        description: 'There was a problem processing your file. Please try another file or format.',
      });
    } finally {
      setExtracting(false);
    }
  };

  // Read text file
  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read text file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  // Extract text from PDF
  const extractPdfText = async (file: File): Promise<string> => {
    try {
      // For actual implementation, we'd need to use a library like pdf.js
      // This is a placeholder implementation - in production, you would:
      // 1. Load pdf.js
      // 2. Parse the PDF
      // 3. Extract text from each page
      
      // For now, we'll mock this with a simple file reader and notify that proper parsing would be needed
      const text = await readTextFile(file);
      
      toast({
        title: 'PDF parsing limited',
        description: 'Full PDF parsing requires pdf.js integration. Text extraction may be incomplete.',
      });
      
      return text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  // Extract text from DOCX
  const extractDocxText = async (file: File): Promise<string> => {
    try {
      // For actual implementation, we'd need to use a library like mammoth.js
      // This is a placeholder implementation
      
      // For now, we'll mock this with a simple file reader and notify that proper parsing would be needed
      const text = await readTextFile(file);
      
      toast({
        title: 'DOCX parsing limited',
        description: 'Full DOCX parsing requires mammoth.js integration. Text extraction may be incomplete.',
      });
      
      return text;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  };

  // Process text into chapters
  const processTextIntoChapters = (text: string): Partial<BookContent> => {
    // Extract title (assume first line is title if it's short enough)
    const lines = text.split('\n').filter(line => line.trim() !== '');
    let title = 'Untitled Book';
    
    if (lines.length > 0 && lines[0].length < 100) {
      title = lines[0].trim();
    }
    
    // Try to identify chapters - look for patterns like:
    // "Chapter X" or "X. Chapter Title" or lines in all caps or lines that start with #
    const chapterPatterns = [
      /^Chapter\s+\d+(?:[:.]\s*|\s+)(.+)$/i,  // "Chapter 1: Title" or "Chapter 1. Title" or "Chapter 1 Title"
      /^(\d+)\.\s+(.+)$/,                     // "1. Chapter Title"
      /^#+\s+(.+)$/,                          // "# Chapter Title" (Markdown heading)
      /^([A-Z][A-Z\s]+[A-Z])$/                // "ALL CAPS LINE"
    ];
    
    const chapters = [];
    let currentChapterTitle = 'Introduction';
    let currentChapterContent = '';
    let chapterStarted = false;
    
    for (const line of lines) {
      let isChapterHeading = false;
      
      // Skip the first line if it's the title
      if (line === title && !chapterStarted) {
        continue;
      }
      
      // Check if the line is a chapter heading
      for (const pattern of chapterPatterns) {
        const match = line.match(pattern);
        if (match) {
          // If we already have content, save the previous chapter
          if (chapterStarted && currentChapterContent.trim()) {
            chapters.push({
              id: uuidv4(),
              title: currentChapterTitle,
              content: currentChapterContent.trim(),
              level: 1
            });
          }
          
          // Start a new chapter
          currentChapterTitle = match[1] || line;
          currentChapterContent = '';
          chapterStarted = true;
          isChapterHeading = true;
          break;
        }
      }
      
      // If not a chapter heading, add to current chapter
      if (!isChapterHeading) {
        // If we haven't started a chapter yet, start the introduction
        if (!chapterStarted) {
          chapterStarted = true;
        }
        currentChapterContent += line + '\n\n';
      }
    }
    
    // Add the last chapter
    if (chapterStarted && currentChapterContent.trim()) {
      chapters.push({
        id: uuidv4(),
        title: currentChapterTitle,
        content: currentChapterContent.trim(),
        level: 1
      });
    }
    
    // If no chapters were identified, create a single chapter with all content
    if (chapters.length === 0 && text.trim()) {
      chapters.push({
        id: uuidv4(),
        title: 'Chapter 1',
        content: text.trim(),
        level: 1
      });
    }
    
    return {
      title,
      chapters,
      metadata: {}
    };
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