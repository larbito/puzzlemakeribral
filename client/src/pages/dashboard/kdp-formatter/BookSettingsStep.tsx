import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { KDPBookSettings } from '../KDPBookFormatter';
import { Sliders, Ruler, BookOpen, PaintBucket, TextQuote } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface BookSettingsStepProps {
  settings: KDPBookSettings;
  onSettingChange: (key: keyof KDPBookSettings, value: any) => void;
}

export const BookSettingsStep: React.FC<BookSettingsStepProps> = ({
  settings,
  onSettingChange
}) => {
  // Font options - common book fonts
  const fontOptions = [
    'Times New Roman',
    'Georgia',
    'Garamond',
    'Baskerville',
    'Palatino',
    'Bookman',
    'Cambria',
    'Minion Pro',
    'Arial',
    'Helvetica',
    'Verdana',
    'Calibri',
    'Futura'
  ];

  // Book size information for reference
  const bookSizeInfo = {
    '6x9': 'Standard paperback size for most fiction and non-fiction books',
    '5x8': 'Common size for smaller paperbacks like romance novels',
    '7x10': 'Good for textbooks, workbooks, and other educational material',
    '8.5x11': 'Letter size - for large format books, manuals, and workbooks'
  };

  // Handle switch toggle
  const handleSwitchChange = (key: keyof KDPBookSettings) => {
    onSettingChange(key, !settings[key]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Book Settings</h2>
        <p className="text-muted-foreground">
          Configure your book's physical attributes and formatting options
        </p>
      </div>
      
      <Tabs defaultValue="size-margins" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="size-margins" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            <span>Size & Margins</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <TextQuote className="h-4 w-4" />
            <span>Typography</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <PaintBucket className="h-4 w-4" />
            <span>Appearance</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Size & Margins Tab */}
        <TabsContent value="size-margins" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Book Size</h3>
                </div>
                <Separator className="mb-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="trimSize">Trim Size</Label>
                    <Select 
                      value={settings.trimSize} 
                      onValueChange={(value) => onSettingChange('trimSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trim size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6x9">6" x 9" (15.24 x 22.86 cm)</SelectItem>
                        <SelectItem value="5x8">5" x 8" (12.7 x 20.32 cm)</SelectItem>
                        <SelectItem value="7x10">7" x 10" (17.78 x 25.4 cm)</SelectItem>
                        <SelectItem value="8.5x11">8.5" x 11" (21.59 x 27.94 cm)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <p className="text-xs text-muted-foreground">
                      {bookSizeInfo[settings.trimSize as keyof typeof bookSizeInfo]}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="flex items-center justify-between">
                      <span>Bleed</span>
                      <Switch 
                        checked={settings.bleed}
                        onCheckedChange={() => handleSwitchChange('bleed')}
                      />
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable bleed if your book contains images that extend to the edge of the page.
                      This adds a 0.125" (3.2 mm) margin to all sides that will be trimmed during printing.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Margins</h3>
                </div>
                <Separator className="mb-4" />
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="marginTop">Top Margin (inches)</Label>
                    <Input
                      id="marginTop"
                      type="number"
                      step="0.125"
                      min="0.25"
                      max="3"
                      value={settings.marginTop}
                      onChange={(e) => onSettingChange('marginTop', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marginBottom">Bottom Margin (inches)</Label>
                    <Input
                      id="marginBottom"
                      type="number"
                      step="0.125"
                      min="0.25"
                      max="3"
                      value={settings.marginBottom}
                      onChange={(e) => onSettingChange('marginBottom', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marginInside">Inside Margin (inches)</Label>
                    <Input
                      id="marginInside"
                      type="number"
                      step="0.125"
                      min="0.25"
                      max="3"
                      value={settings.marginInside}
                      onChange={(e) => onSettingChange('marginInside', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Binding side margin
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marginOutside">Outside Margin (inches)</Label>
                    <Input
                      id="marginOutside"
                      type="number"
                      step="0.125"
                      min="0.25"
                      max="3"
                      value={settings.marginOutside}
                      onChange={(e) => onSettingChange('marginOutside', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Outer edge margin
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>KDP Specifications:</strong> For most trim sizes, KDP requires minimum margins of 0.25" 
                  (6.4 mm) for all sides. For binding edge (inside), a margin of 0.375" (9.6 mm) or larger is 
                  recommended for books with 150+ pages.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TextQuote className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Font & Text</h3>
                </div>
                <Separator className="mb-4" />
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select 
                      value={settings.fontFamily} 
                      onValueChange={(value) => onSettingChange('fontFamily', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        {fontOptions.map(font => (
                          <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Common book fonts include Times New Roman, Georgia, and Garamond
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="fontSize">Font Size (pt)</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      step="0.5"
                      min="8"
                      max="16"
                      value={settings.fontSize}
                      onChange={(e) => onSettingChange('fontSize', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Standard book sizes: 10-12pt for novels, 12-14pt for non-fiction
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="lineSpacing">Line Spacing</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="lineSpacing"
                      type="range"
                      min="1"
                      max="2"
                      step="0.05"
                      value={settings.lineSpacing}
                      onChange={(e) => onSettingChange('lineSpacing', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm font-medium min-w-[3rem] text-center">
                      {settings.lineSpacing.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    1.0 = Single spacing, 1.5 = One and a half, 2.0 = Double spacing
                  </p>
                </div>
                
                <div className="mt-4 p-4 border rounded-md" style={{ 
                  fontFamily: settings.fontFamily,
                  fontSize: `${settings.fontSize}pt`,
                  lineHeight: settings.lineSpacing
                }}>
                  <p className="mb-3">This is a preview of your selected typography settings.</p>
                  <p>The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <PaintBucket className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Book Features</h3>
                </div>
                <Separator className="mb-4" />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Table of Contents</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically generate a table of contents from chapter headings
                      </p>
                    </div>
                    <Switch 
                      checked={settings.includeTOC}
                      onCheckedChange={() => handleSwitchChange('includeTOC')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Page Numbers</Label>
                      <p className="text-sm text-muted-foreground">
                        Add page numbers at the bottom of each page
                      </p>
                    </div>
                    <Switch 
                      checked={settings.includePageNumbers}
                      onCheckedChange={() => handleSwitchChange('includePageNumbers')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 