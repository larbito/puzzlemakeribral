import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BookGeneratorSettings } from '../AIBookGenerator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Download, 
  FileDown, 
  BookOpen,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Eye,
  Printer,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

interface PreviewExportStepProps {
  settings: BookGeneratorSettings;
  onSettingChange: (key: keyof BookGeneratorSettings, value: any) => void;
  onGenerateBook: () => Promise<void>;
  generationStatus: 'idle' | 'generating' | 'complete' | 'error';
  downloadUrl: string | null;
  generationError: string;
  onTryAgain: () => void;
  onDownload: () => void;
}

export const PreviewExportStep: React.FC<PreviewExportStepProps> = ({
  settings,
  onSettingChange,
  onGenerateBook,
  generationStatus,
  downloadUrl,
  generationError,
  onTryAgain,
  onDownload,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const totalPages = Math.max(
    settings.chapters.reduce((total, chapter) => {
      const chapterPages = Math.ceil(chapter.wordCount / 250); // Approx. 250 words per page
      return total + chapterPages;
    }, 0) +
    (settings.includeTOC ? 1 : 0) +
    (settings.includeCopyright ? 1 : 0) +
    (settings.titlePage ? 1 : 0) +
    (settings.dedicationPage ? 1 : 0) +
    (settings.authorBio && settings.includeAuthorBio ? 1 : 0) +
    (settings.closingThoughts ? 1 : 0) +
    (settings.includeGlossary && settings.glossaryContent ? 1 : 0),
    1
  );

  const getTotalWordCount = () => {
    return settings.chapters.reduce((total, chapter) => total + chapter.wordCount, 0);
  };

  const isBookComplete = () => {
    if (settings.chapters.length === 0) return false;
    
    const hasAllChapterContent = settings.chapters.every(chapter => chapter.content);
    const hasTitlePage = !!settings.titlePage;
    const hasCopyrightPage = settings.includeCopyright ? !!settings.copyrightPage : true;
    
    return hasAllChapterContent && hasTitlePage && hasCopyrightPage;
  };

  const handleSendByEmail = () => {
    if (!email || !email.includes('@') || !downloadUrl) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
      });
      return;
    }
    
    // This would connect to a backend API to send the email
    toast({
      title: 'Book sent!',
      description: `Your book has been sent to ${email}`,
    });
  };

  const renderBookPreview = () => {
    // Mock preview pages - in a real implementation, this would render actual pages from the book
    return (
      <div className="flex flex-col items-center">
        <div 
          className="border rounded-md p-6 bg-white mb-4 w-full"
          style={{
            aspectRatio: settings.bookSize === '6x9' ? '6/9' : 
                         settings.bookSize === '5x8' ? '5/8' : 
                         settings.bookSize === '7x10' ? '7/10' : '8.5/11',
            fontFamily: settings.fontFamily,
            fontSize: `${settings.fontSize}pt`,
            lineHeight: settings.lineSpacing,
            position: 'relative',
          }}
        >
          {currentPage === 0 && settings.titlePage ? (
            // Title page
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h1 className="text-3xl font-bold mb-2">{settings.title}</h1>
              {settings.subtitle && <h2 className="text-xl mb-8">{settings.subtitle}</h2>}
              <div className="mt-auto">By [Author Name]</div>
            </div>
          ) : currentPage === 1 && settings.includeTOC ? (
            // Table of Contents
            <div>
              <h2 className="text-xl font-bold mb-4 text-center">Table of Contents</h2>
              <div className="space-y-2">
                {settings.chapters.map((chapter, index) => (
                  <div key={chapter.id} className="flex justify-between">
                    <span>{chapter.title}</span>
                    <span className="text-muted-foreground">Page {index + 3}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Content pages - simplistic implementation for the mockup
            <div className="prose max-w-none">
              <h2 className="text-xl font-bold mb-4">
                {currentPage < 2 ? 'Front Matter' : `Sample Page ${currentPage - 1}`}
              </h2>
              <p>
                This is a preview of page {currentPage + 1} of your book. In the final PDF, 
                this will contain the actual content from your chapters, formatted according 
                to your settings.
              </p>
              <p>
                Your book will be approximately {totalPages} pages long with about {getTotalWordCount()} 
                words of content, using {settings.fontFamily} font at {settings.fontSize}pt size.
              </p>
            </div>
          )}
          
          {settings.includePageNumbers && (
            <div className="absolute bottom-4 w-full text-center text-sm">
              Page {currentPage + 1}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          
          <span className="text-sm px-2">
            Page {currentPage + 1} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Preview & Export</h2>
          <p className="text-muted-foreground">Review your book and export it as a KDP-ready PDF</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Book Summary
            </h3>
            <Separator className="mb-4" />
            
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Title</Label>
                <p className="font-medium">{settings.title}</p>
              </div>
              
              {settings.subtitle && (
                <div>
                  <Label className="text-muted-foreground text-sm">Subtitle</Label>
                  <p>{settings.subtitle}</p>
                </div>
              )}
              
              <div>
                <Label className="text-muted-foreground text-sm">Book Size</Label>
                <p>{settings.bookSize} inches</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Font</Label>
                <p>{settings.fontFamily}, {settings.fontSize}pt</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Content</Label>
                <p>{settings.chapters.length} chapters, approx. {totalPages} pages</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-sm">Word Count</Label>
                <p>{getTotalWordCount()} words</p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Book Completion</span>
                  <span>{isBookComplete() ? '100%' : 'Incomplete'}</span>
                </div>
                <Progress value={isBookComplete() ? 100 : 70} className="h-2" />
                
                {!isBookComplete() && (
                  <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Some content is missing. Go back to complete all sections.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Book Preview</h3>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" /> Full Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
              </div>
            </div>
            <Separator className="mb-4" />
            
            <ScrollArea className="h-[500px]">
              {renderBookPreview()}
            </ScrollArea>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Export Options</h3>
              
              {generationStatus === 'idle' && (
                <Button
                  onClick={onGenerateBook}
                  disabled={!isBookComplete()}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Generate KDP-Ready PDF
                </Button>
              )}
              
              {generationStatus === 'generating' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-6">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <h3 className="font-medium mb-1">Generating Your Book...</h3>
                      <p className="text-sm text-muted-foreground">This may take a minute or two</p>
                    </div>
                  </div>
                </div>
              )}
              
              {generationStatus === 'error' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-6 text-center">
                    <div>
                      <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
                      <h3 className="font-medium mb-1">Error Generating PDF</h3>
                      <p className="text-sm text-muted-foreground mb-4">{generationError}</p>
                      <Button onClick={onTryAgain} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {generationStatus === 'complete' && downloadUrl && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-4 text-center">
                    <div>
                      <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-600" />
                      <h3 className="font-medium mb-1">Your Book is Ready!</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Your PDF has been generated and is ready for download.
                      </p>
                      
                      <div className="flex flex-col gap-3">
                        <Button onClick={onDownload} className="w-full bg-gradient-to-r from-primary to-secondary">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                        
                        <div className="flex gap-2 items-center">
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <Button 
                            variant="outline" 
                            onClick={handleSendByEmail}
                            disabled={!email || !email.includes('@')}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 