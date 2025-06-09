import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KDPBookSettings, BookContent } from '../KDPBookFormatter';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { BookPreview } from '@/components/BookPreview';
import { 
  BookOpen, 
  Edit, 
  ListTree, 
  Save, 
  Undo
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
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [editModeActive, setEditModeActive] = useState(false);
  const [editedTitle, setEditedTitle] = useState(bookContent.title);
  const [editedChapterTitle, setEditedChapterTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const { toast } = useToast();

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

  // Notify parent that we have content ready for PDF generation
  useEffect(() => {
    // Pass empty array since we're using the shared template now
    onFormattedContent([]);
  }, [bookContent, settings, onFormattedContent]);

  // Chapter selection handler
  const handleChapterSelect = (chapterId: string) => {
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
    if (editModeActive && editedContent !== originalContent) {
      if (!window.confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
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
                    <BookOpen className="h-4 w-4" />
                    <span>Book Preview</span>
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
                <BookPreview book={bookContent} settings={settings} />
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
                            onChange={(e) => setEditedContent(e.target.value)}
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