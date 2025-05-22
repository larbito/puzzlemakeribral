import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookGeneratorSettings } from '../AIBookGenerator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Book, Type, Languages, Hash, Rows3 } from 'lucide-react';

// Fix for the book size aspect ratio calculation
const getAspectRatio = (bookSize: string) => {
  const [width, height] = bookSize.split('x').map(parseFloat);
  if (!width || !height) return 0.66; // Default aspect ratio if parsing fails
  return width / height;
};

interface BookSettingsStepProps {
  settings: BookGeneratorSettings;
  onSettingChange: (key: keyof BookGeneratorSettings, value: any) => void;
}

export const BookSettingsStep: React.FC<BookSettingsStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const bookSizes = [
    { value: '6x9', label: '6 × 9 inches (Standard)' },
    { value: '5x8', label: '5 × 8 inches (Compact)' },
    { value: '7x10', label: '7 × 10 inches (Large)' },
    { value: '8.5x11', label: '8.5 × 11 inches (Letter)' },
  ];

  const fontOptions = [
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Garamond', label: 'Garamond' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Calibri', label: 'Calibri' },
  ];

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
    { value: 'German', label: 'German' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Portuguese', label: 'Portuguese' },
  ];

  return (
    <div className="space-y-8">
      <Tabs defaultValue="layout" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="layout" className="flex items-center gap-1">
            <Book className="h-4 w-4" /> Book Layout
          </TabsTrigger>
          <TabsTrigger value="formatting" className="flex items-center gap-1">
            <Type className="h-4 w-4" /> Text Formatting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layout">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Book Information</h3>
                <Separator className="mb-4" />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Book Title</Label>
                    <Input
                      id="title"
                      value={settings.title}
                      onChange={(e) => onSettingChange('title', e.target.value)}
                      placeholder="Enter your book title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle (optional)</Label>
                    <Input
                      id="subtitle"
                      value={settings.subtitle}
                      onChange={(e) => onSettingChange('subtitle', e.target.value)}
                      placeholder="Enter a subtitle"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bookSize">Book Size</Label>
                    <Select
                      value={settings.bookSize}
                      onValueChange={(value) => onSettingChange('bookSize', value)}
                    >
                      <SelectTrigger id="bookSize">
                        <SelectValue placeholder="Select book size" />
                      </SelectTrigger>
                      <SelectContent>
                        {bookSizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      6 × 9 is the most common size for paperback books on Amazon KDP
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pageCount">Target Page Count: {settings.pageCount}</Label>
                    <Slider
                      id="pageCount"
                      min={30}
                      max={500}
                      step={10}
                      value={[settings.pageCount]}
                      onValueChange={(value) => onSettingChange('pageCount', value[0])}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The AI will generate content to match this exact page count
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Book Structure</h3>
                <Separator className="mb-4" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="includePageNumbers">Page Numbers</Label>
                      <p className="text-xs text-muted-foreground">Add page numbers to your book</p>
                    </div>
                    <Switch
                      id="includePageNumbers"
                      checked={settings.includePageNumbers}
                      onCheckedChange={(checked) => onSettingChange('includePageNumbers', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="includeTOC">Table of Contents</Label>
                      <p className="text-xs text-muted-foreground">Include an automatic table of contents</p>
                    </div>
                    <Switch
                      id="includeTOC"
                      checked={settings.includeTOC}
                      onCheckedChange={(checked) => onSettingChange('includeTOC', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="includeCopyright">Copyright Page</Label>
                      <p className="text-xs text-muted-foreground">Include standard copyright information</p>
                    </div>
                    <Switch
                      id="includeCopyright"
                      checked={settings.includeCopyright}
                      onCheckedChange={(checked) => onSettingChange('includeCopyright', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="includeAuthorBio">Author Bio</Label>
                      <p className="text-xs text-muted-foreground">Include an about the author section</p>
                    </div>
                    <Switch
                      id="includeAuthorBio"
                      checked={settings.includeAuthorBio}
                      onCheckedChange={(checked) => onSettingChange('includeAuthorBio', checked)}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Label htmlFor="language">Book Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => onSettingChange('language', value)}
                    >
                      <SelectTrigger id="language" className="mt-1">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="formatting">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Text Formatting</h3>
                <Separator className="mb-4" />
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fontFamily">Font Family</Label>
                      <Select
                        value={settings.fontFamily}
                        onValueChange={(value) => onSettingChange('fontFamily', value)}
                      >
                        <SelectTrigger id="fontFamily">
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Font Size: {settings.fontSize}pt</Label>
                      <Slider
                        id="fontSize"
                        min={10}
                        max={14}
                        step={0.5}
                        value={[settings.fontSize]}
                        onValueChange={(value) => onSettingChange('fontSize', value[0])}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lineSpacing">Line Spacing: {settings.lineSpacing}</Label>
                    <Slider
                      id="lineSpacing"
                      min={1}
                      max={2}
                      step={0.05}
                      value={[settings.lineSpacing]}
                      onValueChange={(value) => onSettingChange('lineSpacing', value[0])}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Standard spacing is 1.15, higher values improve readability
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Preview</h3>
                <Separator className="mb-4" />
                
                <div
                  className="p-4 border rounded-md bg-white overflow-hidden relative"
                  style={{
                    fontFamily: settings.fontFamily,
                    fontSize: `${settings.fontSize}pt`,
                    lineHeight: settings.lineSpacing,
                    aspectRatio: getAspectRatio(settings.bookSize),
                  }}
                >
                  <div className="border-b pb-2 mb-2 text-center">
                    <p className="font-bold">{settings.title || 'Book Title'}</p>
                    {settings.subtitle && <p className="text-sm italic">{settings.subtitle}</p>}
                  </div>
                  
                  <p>
                    This is an example of how your text will appear in your book. The current settings are:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Font: {settings.fontFamily}</li>
                    <li>Size: {settings.fontSize}pt</li>
                    <li>Line spacing: {settings.lineSpacing}</li>
                    <li>Book dimensions: {settings.bookSize} inches</li>
                  </ul>
                  
                  <p className="mt-3">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. 
                    Sed cursus ante dapibus diam. Sed nisi.
                  </p>
                  
                  {settings.includePageNumbers && (
                    <div className="absolute bottom-2 right-2 text-xs">1</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 