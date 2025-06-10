import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { BookContent } from '../KDPBookFormatter';
import { getApiUrl, API_CONFIG } from '@/config/api';
import { v4 as uuidv4 } from 'uuid';
import {
  FileText,
  Upload,
  File,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileType,
  FileCheck,
  Zap,
  Brain
} from 'lucide-react';

interface FileUploadStepProps {
  onFileUploaded: (file: File) => void;
  onContentExtracted: (content: Partial<BookContent>) => void;
  onTextExtracted: () => void;
}

const supportedFormats = [
  { ext: '.PDF', type: 'application/pdf', icon: FileText, desc: 'PDF documents' },
  { ext: '.DOCX', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', icon: FileType, desc: 'Word documents' },
  { ext: '.TXT', type: 'text/plain', icon: File, desc: 'Plain text files' }
];

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
  const [extractedStats, setExtractedStats] = useState<{characters: number, words: number, chapters: number} | null>(null);
  const [quickMode, setQuickMode] = useState(false);
  const [processingMode, setProcessingMode] = useState<'quick' | 'ai' | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractError(null);
      setPreviewText('');
      setExtractedStats(null);
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
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const extractContent = async (selectedFile: File) => {
    setExtracting(true);
    setExtractProgress(10);
    setExtractError(null);
    setProcessingMode(quickMode ? 'quick' : 'ai');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('quickMode', quickMode.toString());

      setExtractProgress(30);

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.KDP_FORMATTER.EXTRACT), {
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
        setProcessingMode(data.processingMode || (quickMode ? 'quick' : 'ai'));
        
        const rawText = data.content.rawText || '';
        const wordCount = rawText.split(/\s+/).filter((word: string) => word.length > 0).length;
        const chapterCount = data.content.chapters ? data.content.chapters.length : 0;
        
        setPreviewText(rawText.substring(0, 2000) + (rawText.length > 2000 ? '...' : ''));
        setExtractedStats({
          characters: rawText.length,
          words: wordCount,
          chapters: chapterCount
        });
        
        // Auto-populate metadata if detected by AI
        const enhancedContent = {
          ...data.content,
          // Set title from AI detection or fallback to filename
          title: data.content.title && data.content.title !== 'Untitled Book' 
            ? data.content.title 
            : selectedFile.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          
          // Merge metadata from AI detection
          metadata: {
            author: data.content.metadata?.author || '',
            publisher: data.content.metadata?.publisher || '',
            year: data.content.metadata?.year || new Date().getFullYear().toString(),
            isbn: data.content.metadata?.isbn || '',
            ...data.content.metadata // Include any additional metadata from AI
          }
        };
        
        onContentExtracted(enhancedContent);
        onTextExtracted();

        // Show enhanced success message with detected info and processing mode
        const detectedInfo = [];
        if (enhancedContent.title && enhancedContent.title !== selectedFile.name.replace(/\.[^/.]+$/, '')) {
          detectedInfo.push(`Title: "${enhancedContent.title}"`);
        }
        if (enhancedContent.metadata.author) {
          detectedInfo.push(`Author: ${enhancedContent.metadata.author}`);
        }
        
        const modeText = data.processingMode === 'quick' ? ' (Quick Mode)' : ' (AI Enhanced)';
        const successMessage = detectedInfo.length > 0 
          ? `Found ${chapterCount} chapters, ${wordCount.toLocaleString()} words${modeText}. ${detectedInfo.join(', ')}`
          : `Found ${chapterCount} chapters, ${wordCount.toLocaleString()} words${modeText}`;

        toast({
          title: 'Content extracted successfully',
          description: successMessage,
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Upload Your Manuscript</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload your manuscript in PDF, DOCX, or TXT format. We'll extract the content and prepare it for professional KDP formatting.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragActive 
                  ? 'border-primary bg-primary/5 scale-105' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop your manuscript here' : 'Drag & drop your manuscript'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse files
                  </p>
                </div>
                <Button variant="outline" size="lg" className="mt-4">
                  Choose File
                </Button>
              </div>
            </div>

            {/* Processing Mode Toggle */}
            <div className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    quickMode ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-blue-100 dark:bg-blue-900/20'
                  }`}>
                    {quickMode ? (
                      <Zap className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Brain className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="quick-mode" className="text-sm font-medium cursor-pointer">
                      {quickMode ? 'Quick Mode' : 'AI Enhanced Mode'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {quickMode 
                        ? 'Fast processing with basic chapter detection' 
                        : 'Comprehensive AI analysis for better chapter detection'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  id="quick-mode"
                  checked={quickMode}
                  onCheckedChange={setQuickMode}
                  disabled={extracting}
                />
              </div>
              
              {processingMode && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {processingMode === 'quick' ? (
                    <>
                      <Zap className="h-3 w-3" />
                      Last processed in Quick Mode
                    </>
                  ) : (
                    <>
                      <Brain className="h-3 w-3" />
                      Last processed with AI Enhancement
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Supported Formats */}
            <div>
              <p className="text-sm font-medium mb-3">Supported Formats:</p>
              <div className="grid grid-cols-1 gap-2">
                {supportedFormats.map((format) => (
                  <div key={format.ext} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <format.icon className="h-4 w-4 text-primary" />
                    <span className="font-mono text-sm font-medium">{format.ext}</span>
                    <span className="text-xs text-muted-foreground">{format.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Maximum file size: 50MB
              </p>
            </div>
            
            {/* File Info */}
            {file && (
              <div className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type?.split('/')[1]?.toUpperCase() || 'Unknown'}
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
                      setExtractedStats(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
                
                {/* Progress */}
                {extracting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Extracting content...
                      </span>
                      <span>{extractProgress}%</span>
                    </div>
                    <Progress value={extractProgress} className="h-2" />
                  </div>
                )}
                
                {/* Error */}
                {extractError && (
                  <div className="flex items-start gap-2 p-3 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      {extractError}
                    </div>
                  </div>
                )}
                
                {/* Success Stats */}
                {extractedStats && (
                  <div className="flex items-start gap-2 p-3 border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p className="font-medium">Content extracted successfully!</p>
                      <p className="mt-1">
                        {extractedStats.chapters} chapters • {extractedStats.words.toLocaleString()} words • {extractedStats.characters.toLocaleString()} characters
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewText ? (
              <ScrollArea className="h-96 w-full">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                    {previewText}
                  </pre>
                </div>
              </ScrollArea>
            ) : (
              <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Upload a file to see content preview</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2">Content Preservation</h3>
              <p className="text-sm text-muted-foreground">
                We never modify your original content - only structure and formatting
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">Smart Detection</h3>
              <p className="text-sm text-muted-foreground">
                Automatically detects chapters, headings, and book structure
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium mb-2">Secure Processing</h3>
              <p className="text-sm text-muted-foreground">
                Files are processed securely and deleted after formatting
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 