import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BookGeneratorSettings, Chapter } from '../AIBookGenerator';
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
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("preview");
  const printFrameRef = useRef<HTMLIFrameElement>(null);
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

  const handlePrint = () => {
    // Create content for printing
    const printContent = generatePrintContent();
    
    try {
      // If we have a print iframe, use it
      if (printFrameRef.current) {
        const frameDoc = printFrameRef.current.contentDocument;
        if (frameDoc) {
          frameDoc.open();
          frameDoc.write(printContent);
          frameDoc.close();
          
          // Delay printing to allow content to render
          setTimeout(() => {
            try {
              printFrameRef.current?.contentWindow?.print();
            } catch (error) {
              console.error('Error printing from iframe:', error);
              // Fallback to window.print()
              window.print();
            }
          }, 500);
        }
      } else {
        // Fallback: open new window and print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.focus();
          // Delay printing to allow content to render
          setTimeout(() => {
            try {
              printWindow.print();
              printWindow.close();
            } catch (error) {
              console.error('Error printing from new window:', error);
              window.print();
            }
          }, 500);
        } else {
          // If popup blocked, use direct window.print()
          window.print();
        }
      }
    } catch (error) {
      console.error('General printing error:', error);
      // Last resort fallback
      window.print();
    }
  };

  const generatePrintContent = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${settings.title}</title>
        <style>
          body {
            font-family: ${settings.fontFamily || 'Times New Roman'};
            font-size: ${settings.fontSize || 12}pt;
            line-height: ${settings.lineSpacing || 1.15};
            margin: 0.5in;
          }
          .page {
            page-break-after: always;
            position: relative;
            height: ${settings.bookSize === '6x9' ? '9in' : 
                      settings.bookSize === '5x8' ? '8in' : 
                      settings.bookSize === '7x10' ? '10in' : '11in'};
            width: ${settings.bookSize === '6x9' ? '6in' : 
                     settings.bookSize === '5x8' ? '5in' : 
                     settings.bookSize === '7x10' ? '7in' : '8.5in'};
          }
          .title-page {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            text-align: center;
          }
          h1 {
            font-size: 24pt;
            margin-bottom: 12pt;
          }
          h2 {
            font-size: 18pt;
            margin-bottom: 24pt;
          }
          .author {
            margin-top: auto;
            padding-bottom: 2in;
          }
          .page-number {
            position: absolute;
            bottom: 0.5in;
            width: 100%;
            text-align: center;
            font-size: 10pt;
          }
          .chapter {
            margin-top: 1in;
          }
          .chapter-title {
            font-size: 16pt;
            margin-bottom: 24pt;
          }
        </style>
      </head>
      <body>
        <!-- Title Page -->
        <div class="page title-page">
          <h1>${settings.title}</h1>
          ${settings.subtitle ? `<h2>${settings.subtitle}</h2>` : ''}
          <div class="author">By [Author Name]</div>
        </div>

        ${settings.includeTOC ? `
        <!-- Table of Contents -->
        <div class="page">
          <h2 style="text-align: center; margin-top: 1in;">Table of Contents</h2>
          <div style="margin-top: 0.5in;">
            ${settings.chapters.map((chapter, index) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8pt;">
                <span>${chapter.title}</span>
                <span>${index + 3}</span>
              </div>
            `).join('')}
          </div>
          ${settings.includePageNumbers ? `<div class="page-number">2</div>` : ''}
        </div>
        ` : ''}

        <!-- Chapters -->
        ${settings.chapters.map((chapter, index) => `
          <div class="page chapter">
            <div class="chapter-title">${chapter.title}</div>
            <div>
              ${chapter.content || `Sample content for ${chapter.title}`}
            </div>
            ${settings.includePageNumbers ? `<div class="page-number">${index + 3}</div>` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;
  };

  const renderBookPreview = () => {
    // Determine what content to show based on current page number
    let pageContent;
    let pageTitle;
    
    // Front matter pages
    if (currentPage === 0) {
      pageTitle = "Title Page";
      pageContent = (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className="text-3xl font-bold mb-2">{settings.title}</h1>
          {settings.subtitle && <h2 className="text-xl mb-8">{settings.subtitle}</h2>}
          <div className="mt-auto">By [Author Name]</div>
        </div>
      );
    } else if (currentPage === 1 && settings.includeTOC) {
      pageTitle = "Table of Contents";
      pageContent = (
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
      );
    } else if (currentPage === 2 && settings.includeCopyright) {
      pageTitle = "Copyright Page";
      pageContent = (
        <div className="py-8">
          <p className="text-sm text-center">
            {settings.copyrightPage || `© ${new Date().getFullYear()} [Author Name]. All rights reserved.`}
          </p>
        </div>
      );
    } else {
      // Determine which chapter this page belongs to
      let pageCount = 3; // Start after title, TOC, and copyright
      let targetChapter: Chapter | null = null;
      
      for (const chapter of settings.chapters) {
        const chapterPages = Math.ceil(chapter.wordCount / 250);
        if (currentPage >= pageCount && currentPage < pageCount + chapterPages) {
          targetChapter = chapter;
          break;
        }
        pageCount += chapterPages;
      }
      
      if (targetChapter) {
        pageTitle = targetChapter.title;
        // Show a portion of the chapter content based on page number
        const pageInChapter = currentPage - pageCount;
        const wordsPerPage = 250;
        const startWord = pageInChapter * wordsPerPage;
        const words = targetChapter.content ? targetChapter.content.split(' ') : [];
        const pageWords = words.slice(startWord, startWord + wordsPerPage);
        
        pageContent = (
          <div>
            {pageInChapter === 0 && (
              <h2 className="text-xl font-bold mb-4">{targetChapter.title}</h2>
            )}
            <p className="whitespace-pre-wrap">
              {pageWords.length > 0 ? pageWords.join(' ') : `Sample content for ${targetChapter.title}`}
            </p>
          </div>
        );
      } else {
        pageTitle = "Additional Content";
        pageContent = (
          <div className="prose max-w-none">
            <p>
              This is a preview of page {currentPage + 1} of your book. In the final PDF, 
              this will contain the actual content from your chapters, formatted according 
              to your settings.
            </p>
          </div>
        );
      }
    }

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
          {pageContent}
          
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
            Page {currentPage + 1} of {totalPages} - {pageTitle}
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFullPreview(true)}
                >
                  <Eye className="h-4 w-4 mr-1" /> Full Preview
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrint}
                >
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

      {/* Full Preview Modal */}
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" 
        >
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Full Book Preview</span>
              <DialogClose 
                className="p-1" 
              >
                <X className="h-4 w-4" />
              </DialogClose>
            </DialogTitle>
          </DialogHeader>
          
          <Tabs 
            value={selectedTab} 
            onValueChange={setSelectedTab} 
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList 
              className="mb-4"
            >
              <TabsTrigger 
                value="preview" 
              >
                Page Preview
              </TabsTrigger>
              <TabsTrigger 
                value="chapters"
              >
                Chapters
              </TabsTrigger>
              <TabsTrigger 
                value="frontmatter"
              >
                Front Matter
              </TabsTrigger>
            </TabsList>
            
            <TabsContent 
              value="preview" 
              className="flex-1 overflow-hidden flex flex-col"
            >
              <ScrollArea 
                className="flex-1"
              >
                <div className="p-4">
                  {renderBookPreview()}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent 
              value="chapters" 
              className="flex-1 overflow-hidden flex flex-col"
            >
              <ScrollArea 
                className="flex-1"
              >
                <div className="grid grid-cols-1 gap-4 p-4">
                  {settings.chapters.map((chapter, index) => (
                    <Card 
                      key={chapter.id} 
                      className="overflow-hidden"
                    >
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium mb-2">{chapter.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {chapter.wordCount} words · Approximately {Math.ceil(chapter.wordCount / 250)} pages
                        </p>
                        <div className="max-h-32 overflow-hidden relative">
                          <p className="text-sm whitespace-pre-wrap">
                            {chapter.content || `Sample content for ${chapter.title}`}
                          </p>
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            // Calculate the page number for this chapter
                            let pageNum = 3; // Start after title, TOC, copyright
                            for (let i = 0; i < index; i++) {
                              pageNum += Math.ceil(settings.chapters[i].wordCount / 250);
                            }
                            setCurrentPage(pageNum);
                            setSelectedTab("preview");
                          }}
                        >
                          View Chapter
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent 
              value="frontmatter" 
              className="flex-1 overflow-hidden flex flex-col"
            >
              <ScrollArea 
                className="flex-1"
              >
                <div className="grid grid-cols-1 gap-4 p-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-medium mb-2">Title Page</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setCurrentPage(0);
                          setSelectedTab("preview");
                        }}
                      >
                        View Page
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {settings.includeTOC && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium mb-2">Table of Contents</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            setCurrentPage(1);
                            setSelectedTab("preview");
                          }}
                        >
                          View Page
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {settings.includeCopyright && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium mb-2">Copyright Page</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => {
                            setCurrentPage(2);
                            setSelectedTab("preview");
                          }}
                        >
                          View Page
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {settings.dedicationPage && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium mb-2">Dedication</h3>
                        <p className="text-sm whitespace-pre-wrap">{settings.dedicationPage}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {settings.includeAuthorBio && settings.authorBio && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium mb-2">Author Bio</h3>
                        <p className="text-sm whitespace-pre-wrap">{settings.authorBio}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-1" /> Print Book
            </Button>
            <Button 
              onClick={() => setShowFullPreview(false)}
            >
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hidden iframe for printing */}
      <iframe
        ref={printFrameRef}
        style={{ display: 'none' }}
        title="Print Frame"
      />
    </div>
  );
}; 