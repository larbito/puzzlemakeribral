import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KDPBookSettings, BookContent, Chapter } from '../KDPBookFormatter';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Edit, 
  ListTree, 
  Save, 
  Undo,
  Layout
} from 'lucide-react';

interface PreviewEditStepProps {
  settings: KDPBookSettings;
  bookContent: BookContent;
  onContentChange: (content: Partial<BookContent>) => void;
  onChapterEdit: (chapterId: string, newContent: string) => void;
  onFormattedContent: (formattedPages: string[]) => void;
}

export const PreviewEditStep: React.FC<PreviewEditStepProps> = ({
  settings,
  bookContent,
  onContentChange,
  onChapterEdit,
  onFormattedContent
}) => {
  // State for the preview navigation
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [editModeActive, setEditModeActive] = useState(false);
  const [editedTitle, setEditedTitle] = useState(bookContent.title);
  const [editedChapterTitle, setEditedChapterTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // State for inline editing
  const [inlineEditMode, setInlineEditMode] = useState(false);
  const [editingElement, setEditingElement] = useState<{
    type: 'title' | 'chapter-title' | 'paragraph';
    chapterId?: string;
    paragraphIndex?: number;
    content: string;
  } | null>(null);

  // When chapters change, select the first chapter as default
  useEffect(() => {
    if (bookContent.chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(bookContent.chapters[0].id);
    }
  }, [bookContent.chapters, selectedChapterId]);

  // When selected chapter changes, update edited content
  useEffect(() => {
    if (selectedChapterId) {
      const chapter = bookContent.chapters.find(c => c.id === selectedChapterId);
      if (chapter) {
        setEditedChapterTitle(chapter.title);
        setEditedContent(chapter.content);
        setOriginalContent(chapter.content);
      }
    }
  }, [selectedChapterId, bookContent.chapters]);

  // When settings or content changes, reformat the book
  useEffect(() => {
    formatBook();
  }, [settings, bookContent]);

  // Get dimensions (in inches) based on trim size
  const getTrimSizeDimensions = (trimSize: string) => {
    switch (trimSize) {
      case '6x9':
        return { width: 6, height: 9 };
      case '5x8':
        return { width: 5, height: 8 };
      case '7x10':
        return { width: 7, height: 10 };
      case '8.5x11':
        return { width: 8.5, height: 11 };
      default:
        return { width: 6, height: 9 };
    }
  };

  // Calculate current dimensions
  const dimensions = getTrimSizeDimensions(settings.trimSize);

  // Format the book content into pages with professional typography
  const formatBook = () => {
    if (!bookContent.chapters.length) {
      console.log('No chapters to format');
      return;
    }

    console.log('Formatting book with chapters:', bookContent.chapters.length);
    console.log('First chapter content:', bookContent.chapters[0]?.content?.substring(0, 100));

    const formattedPages: string[] = [];
    
    // Professional CSS styles for book formatting
    const bookStyles = `
      <style>
        body {
          font-family: ${settings.fontFamily};
          font-size: ${settings.fontSize}pt;
          line-height: ${settings.lineSpacing};
          color: #000;
          margin: 0;
          padding: 0;
        }
        
        .page {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          box-sizing: border-box;
        }
        
        .title-page {
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
        }
        
        .book-title {
          font-size: ${Math.max(18, settings.fontSize * 1.8)}pt;
          font-weight: bold;
          margin-bottom: 2em;
          line-height: 1.2;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .book-author {
          font-size: ${Math.max(14, settings.fontSize * 1.2)}pt;
          font-style: italic;
          margin-top: 2em;
        }
        
        .toc-page {
          padding-top: 2em;
        }
        
        .toc-title {
          font-size: ${Math.max(16, settings.fontSize * 1.4)}pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 2em;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .toc-entry {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.8em;
          border-bottom: 1px dotted #ccc;
          padding-bottom: 0.2em;
        }
        
        .toc-title-text {
          flex: 1;
        }
        
        .toc-page-num {
          margin-left: 1em;
          font-weight: bold;
        }
        
        .chapter-page {
          padding-top: 1em;
        }
        
        .chapter-title {
          font-size: ${Math.max(16, settings.fontSize * 1.3)}pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 2em;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #000;
          padding-bottom: 0.5em;
        }
        
        .chapter-content {
          text-align: justify;
          hyphens: auto;
        }
        
        .chapter-content p {
          margin-bottom: 1.2em;
          text-indent: 1.5em;
          line-height: ${settings.lineSpacing};
        }
        
        .chapter-content p:first-child {
          text-indent: 0;
        }
        
        .chapter-content p:first-child:first-letter {
          font-size: ${settings.fontSize * 3}pt;
          font-weight: bold;
          float: left;
          line-height: 0.8;
          padding-right: 0.1em;
          margin-top: 0.1em;
        }
        
        .chapter-number {
          font-size: ${Math.max(12, settings.fontSize * 0.9)}pt;
          font-weight: normal;
          margin-bottom: 0.5em;
          text-align: center;
          color: #666;
        }
        
        @media print {
          .page {
            page-break-after: always;
          }
        }
      </style>
    `;
    
    // Create the title page if enabled
    if (settings.includeTitlePage) {
      const titlePage = `
        ${bookStyles}
        <div class="page title-page">
          <div>
            <h1 class="book-title">${bookContent.title}</h1>
            ${bookContent.metadata.author ? `<p class="book-author">by ${bookContent.metadata.author}</p>` : ''}
          </div>
        </div>
      `;
      formattedPages.push(titlePage);
    }
    
    // Add table of contents if enabled
    if (settings.includeTOC) {
      let tocPage = `
        ${bookStyles}
        <div class="page toc-page">
          <h2 class="toc-title">Table of Contents</h2>
          <div class="toc-list">
      `;
      
      let currentPageNum = formattedPages.length + 2; // Start after title page and TOC
      
      bookContent.chapters.forEach((chapter, index) => {
        tocPage += `
          <div class="toc-entry">
            <span class="toc-title-text">Chapter ${index + 1}: ${chapter.title}</span>
            <span class="toc-page-num">${currentPageNum}</span>
          </div>
        `;
        
        // Estimate pages needed for this chapter (rough calculation)
        const wordCount = chapter.content.split(' ').length;
        const wordsPerPage = 250; // Average words per page
        const pagesForChapter = Math.max(1, Math.ceil(wordCount / wordsPerPage));
        currentPageNum += pagesForChapter;
      });
      
      tocPage += `</div></div>`;
      formattedPages.push(tocPage);
    }
    
    // Format each chapter with professional typography
    for (const [index, chapter] of bookContent.chapters.entries()) {
      if (!chapter.content || chapter.content.trim() === '') {
        console.log(`Chapter ${index + 1} has no content`);
        continue;
      }

      // Clean and prepare chapter content
      const cleanContent = chapter.content
        .trim()
        .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
        .replace(/\s+/g, ' '); // Normalize spaces
      
      // Split into paragraphs
      const paragraphs = cleanContent.split('\n\n').filter(p => p.trim() !== '');
      
      console.log(`Chapter ${index + 1} has ${paragraphs.length} paragraphs`);
      
      // Create professionally formatted chapter page
      let chapterPage = `
        ${bookStyles}
        <div class="page chapter-page">
          <div class="chapter-number">Chapter ${index + 1}</div>
          <h2 class="chapter-title">${chapter.title}</h2>
          <div class="chapter-content">
      `;
      
      // Add each paragraph with proper formatting
      paragraphs.forEach((paragraph, paragraphIndex) => {
        const cleanParagraph = paragraph.trim()
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        
        chapterPage += `<p>${cleanParagraph}</p>`;
      });
      
      chapterPage += `</div></div>`;
      formattedPages.push(chapterPage);
    }
    
    console.log('Generated pages:', formattedPages.length);
    console.log('First page preview:', formattedPages[0]?.substring(0, 300));
    
    // Update state with formatted pages
    setPages(formattedPages);
    setTotalPages(formattedPages.length);
    onFormattedContent(formattedPages);
    
    // Reset to first page
    setCurrentPage(0);
  };

  // Page navigation handlers
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Chapter selection handler
  const handleChapterSelect = (chapterId: string) => {
    // If we're in edit mode, ask for confirmation before switching
    if (editModeActive && editedContent !== originalContent) {
      if (window.confirm('You have unsaved changes. Do you want to discard them?')) {
        setEditModeActive(false);
        setSelectedChapterId(chapterId);
      }
    } else {
      setSelectedChapterId(chapterId);
      setEditModeActive(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    // If we're exiting edit mode and there are changes, ask for confirmation
    if (editModeActive && editedContent !== originalContent) {
      if (!window.confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
      // Revert changes
      setEditedContent(originalContent);
    }
    
    setEditModeActive(!editModeActive);
  };

  // Save edited chapter
  const saveChapterEdit = () => {
    if (selectedChapterId) {
      onChapterEdit(selectedChapterId, editedContent);
      setOriginalContent(editedContent);
      setEditModeActive(false);
      
      toast({
        title: 'Chapter saved',
        description: 'Your changes have been saved.'
      });
    }
  };

  // Save edited book title
  const saveBookTitle = () => {
    onContentChange({ title: editedTitle });
    
    toast({
      title: 'Book title saved',
      description: 'Your book title has been updated.'
    });
  };

  // Handle content edit within the editor
  const handleContentEdit = (value: string) => {
    setEditedContent(value);
  };

  // Handle inline editing
  const handleInlineEdit = (element: HTMLElement, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Determine what type of element was clicked
    const isTitle = element.tagName === 'H1' || element.closest('.title-page h1');
    const isChapterTitle = element.tagName === 'H2' || element.closest('h2');
    const isParagraph = element.tagName === 'P' || element.closest('p');
    
    if (isTitle) {
      setEditingElement({
        type: 'title',
        content: bookContent.title
      });
    } else if (isChapterTitle && selectedChapterId) {
      const chapter = bookContent.chapters.find(c => c.id === selectedChapterId);
      if (chapter) {
        setEditingElement({
          type: 'chapter-title',
          chapterId: selectedChapterId,
          content: chapter.title
        });
      }
    } else if (isParagraph && selectedChapterId) {
      // Find which paragraph was clicked
      const paragraphText = element.textContent || '';
      const chapter = bookContent.chapters.find(c => c.id === selectedChapterId);
      if (chapter) {
        const paragraphs = chapter.content.split('\n\n');
        const paragraphIndex = paragraphs.findIndex(p => p.trim() === paragraphText.trim());
        if (paragraphIndex !== -1) {
          setEditingElement({
            type: 'paragraph',
            chapterId: selectedChapterId,
            paragraphIndex,
            content: paragraphs[paragraphIndex]
          });
        }
      }
    }
    
    setInlineEditMode(true);
  };

  // Save inline edit
  const saveInlineEdit = (newContent: string) => {
    if (!editingElement) return;
    
    switch (editingElement.type) {
      case 'title':
        onContentChange({ title: newContent });
        break;
      case 'chapter-title':
        if (editingElement.chapterId) {
          const chapter = bookContent.chapters.find(c => c.id === editingElement.chapterId);
          if (chapter) {
            onChapterEdit(editingElement.chapterId, chapter.content);
            onContentChange({
              chapters: bookContent.chapters.map(c => 
                c.id === editingElement.chapterId ? { ...c, title: newContent } : c
              )
            });
          }
        }
        break;
      case 'paragraph':
        if (editingElement.chapterId && editingElement.paragraphIndex !== undefined) {
          const chapter = bookContent.chapters.find(c => c.id === editingElement.chapterId);
          if (chapter) {
            const paragraphs = chapter.content.split('\n\n');
            paragraphs[editingElement.paragraphIndex] = newContent;
            const updatedContent = paragraphs.join('\n\n');
            onChapterEdit(editingElement.chapterId, updatedContent);
          }
        }
        break;
    }
    
    setInlineEditMode(false);
    setEditingElement(null);
  };

  // Cancel inline edit
  const cancelInlineEdit = () => {
    setInlineEditMode(false);
    setEditingElement(null);
  };

  // Enhanced page renderer with click-to-edit
  const renderInteractivePage = (pageContent: string, pageIndex: number) => {
    console.log(`Rendering page ${pageIndex}:`, pageContent.substring(0, 100));
    
    if (!pageContent || pageContent.trim() === '') {
      return (
        <div
          className="page-preview bg-white rounded-md flex items-center justify-center"
          style={{
            width: `${dimensions.width * 100}px`,
            height: `${dimensions.height * 100}px`,
            maxWidth: '100%',
            margin: '0 auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
          }}
        >
          <p className="text-muted-foreground">No content to display</p>
        </div>
      );
    }

    return (
      <div
        className="page-preview bg-white rounded-md overflow-auto"
        style={{
          width: `${dimensions.width * 100}px`,
          height: `${dimensions.height * 100}px`,
          maxWidth: '100%',
          margin: '0 auto',
          padding: `
            ${settings.marginTop * 100}px 
            ${settings.marginOutside * 100}px
            ${settings.marginBottom * 100}px
            ${settings.marginInside * 100}px
          `,
          fontFamily: settings.fontFamily,
          fontSize: `${settings.fontSize}pt`,
          lineHeight: String(settings.lineSpacing),
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          position: 'relative',
          color: '#000',
          backgroundColor: '#fff'
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'H1' || target.tagName === 'H2' || target.tagName === 'P') {
            handleInlineEdit(target, e);
          }
        }}
        dangerouslySetInnerHTML={{ 
          __html: pageContent.replace(
            /<(h1|h2|p)([^>]*)>/g, 
            '<$1$2 style="cursor: pointer; padding: 2px; border-radius: 2px; transition: background-color 0.2s; color: #000;" onmouseover="this.style.backgroundColor=\'rgba(59, 130, 246, 0.1)\'" onmouseout="this.style.backgroundColor=\'transparent\'">'
          )
        }}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Preview & Edit</h2>
        <p className="text-muted-foreground">
          Preview your formatted book and make edits to content
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapter List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <ListTree className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Chapters</h3>
            </div>
            <Separator className="mb-4" />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input 
                    value={editedTitle} 
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={saveBookTitle}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Book Title</p>
              </div>
              
              <Separator />
              
              <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-2">
                  {bookContent.chapters.map(chapter => (
                    <div
                      key={chapter.id}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md cursor-pointer",
                        selectedChapterId === chapter.id 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-primary/10"
                      )}
                      onClick={() => handleChapterSelect(chapter.id)}
                    >
                      <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="font-medium truncate">{chapter.title}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
        
        {/* Content Preview/Edit Area */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <Tabs defaultValue="preview" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger 
                    value="preview" 
                    onClick={() => {
                      if (editModeActive) toggleEditMode();
                    }}
                    className="flex items-center gap-1"
                  >
                    <Layout className="h-4 w-4" />
                    <span>Page Preview</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="edit" 
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Content</span>
                  </TabsTrigger>
                </TabsList>
                
                {selectedChapterId && (
                  <div className="flex items-center gap-2">
                    {editModeActive ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditedContent(originalContent);
                            toggleEditMode();
                          }}
                          className="flex items-center gap-1"
                        >
                          <Undo className="h-4 w-4" />
                          <span>Cancel</span>
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={saveChapterEdit}
                          className="flex items-center gap-1"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save</span>
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={toggleEditMode}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit Chapter</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <TabsContent value="preview" className="border rounded-md p-0 min-h-[600px]">
                {pages.length > 0 ? (
                  <div className="relative min-h-[600px]">
                    {/* Debug info */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs p-2 rounded z-10">
                        Pages: {pages.length} | Current: {currentPage + 1} | Chapters: {bookContent.chapters.length}
                      </div>
                    )}
                    
                    {/* Interactive Page preview */}
                    <div ref={previewRef}>
                      {renderInteractivePage(pages[currentPage] || '', currentPage)}
                    </div>
                    
                    {/* Add page number if enabled */}
                    {settings.includePageNumbers && currentPage > 0 && (
                      <div 
                        style={{
                          position: 'absolute',
                          bottom: `${settings.marginBottom * 50}px`,
                          width: `${dimensions.width * 100}px`,
                          textAlign: 'center',
                          fontSize: '10pt',
                          fontFamily: settings.fontFamily,
                        }}
                      >
                        {currentPage}
                      </div>
                    )}
                    
                    {/* Page navigation */}
                    <div className="flex justify-between mt-4">
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPrevPage}
                          disabled={currentPage === 0}
                          className="flex items-center gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Previous</span>
                        </Button>
                      </div>
                      
                      <div className="text-sm text-center">
                        Page <span className="font-medium">{currentPage + 1}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </div>
                      
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages - 1}
                          className="flex items-center gap-1"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Inline Edit Modal */}
                    {inlineEditMode && editingElement && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
                          <h3 className="text-lg font-semibold mb-4">
                            Edit {editingElement.type === 'title' ? 'Book Title' : 
                                 editingElement.type === 'chapter-title' ? 'Chapter Title' : 'Paragraph'}
                          </h3>
                          
                          {editingElement.type === 'paragraph' ? (
                            <Textarea
                              value={editingElement.content}
                              onChange={(e) => setEditingElement({
                                ...editingElement,
                                content: e.target.value
                              })}
                              className="min-h-[200px] mb-4"
                              placeholder="Enter your content here..."
                            />
                          ) : (
                            <Input
                              value={editingElement.content}
                              onChange={(e) => setEditingElement({
                                ...editingElement,
                                content: e.target.value
                              })}
                              className="mb-4"
                              placeholder="Enter title here..."
                            />
                          )}
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={cancelInlineEdit}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => saveInlineEdit(editingElement.content)}
                            >
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[600px] text-muted-foreground">
                    <p className="text-lg mb-2">No preview available</p>
                    <p className="text-sm">Make sure you have uploaded and processed a file with content.</p>
                    {bookContent.chapters.length > 0 && (
                      <div className="mt-4 text-xs bg-gray-100 p-2 rounded">
                        <p>Debug: Found {bookContent.chapters.length} chapters</p>
                        <p>First chapter: {bookContent.chapters[0]?.title}</p>
                        <p>Content length: {bookContent.chapters[0]?.content?.length || 0} chars</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="edit" className="border rounded-md p-4 min-h-[600px]">
                {selectedChapterId ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Chapter Title</Label>
                      <Input 
                        value={editedChapterTitle}
                        onChange={(e) => setEditedChapterTitle(e.target.value)}
                        disabled={!editModeActive}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Chapter Content</Label>
                      {editModeActive ? (
                        <div className="min-h-[500px] border rounded-md">
                          <Textarea
                            value={editedContent}
                            onChange={(e) => handleContentEdit(e.target.value)}
                            className="min-h-[500px] font-mono text-sm"
                            placeholder="Enter your chapter content here..."
                          />
                        </div>
                      ) : (
                        <div 
                          className="min-h-[500px] border rounded-md p-3 overflow-auto" 
                          style={{
                            fontFamily: settings.fontFamily,
                            fontSize: `${settings.fontSize}pt`,
                            lineHeight: String(settings.lineSpacing)
                          }}
                        >
                          {editedContent.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4">{paragraph}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[600px] text-muted-foreground">
                    <p>Select a chapter from the list to edit its content.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 