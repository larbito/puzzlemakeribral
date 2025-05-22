import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { BookGeneratorSettings } from '../AIBookGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookDashed, 
  Type, 
  Layers, 
  Maximize,
  Info,
  BookText,
  PenSquare
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface BookSettingsStepProps {
  settings: BookGeneratorSettings;
  onSettingChange: (key: keyof BookGeneratorSettings, value: any) => void;
}

export const BookSettingsStep: React.FC<BookSettingsStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const handlePageCountChange = (value: number) => {
    // Enforce a maximum page count of 80 to ensure generation completes successfully
    const pageCount = Math.min(value, 80);
    onSettingChange('pageCount', pageCount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Book Physical Settings</h2>
          <p className="text-muted-foreground">Configure the physical aspects of your book</p>
        </div>
      </div>
      
      <Alert variant="info" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4" />
        <AlertTitle>Important Information</AlertTitle>
        <AlertDescription className="text-sm">
          We recommend a maximum of 80 pages for AI generation to ensure successful completion.
          For larger books, start with 80 pages and then manually expand your content after generation.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="dimensions">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="dimensions">
            <BookDashed className="h-4 w-4 mr-2" />
            <span>Dimensions</span>
          </TabsTrigger>
          <TabsTrigger value="page-setup">
            <Layers className="h-4 w-4 mr-2" />
            <span>Page Setup</span>
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            <span>Typography</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dimensions">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <BookDashed className="h-5 w-5 text-primary" /> Book Dimensions
              </h3>
              <Separator className="mb-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
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
                        <SelectItem value="5x8">5" x 8" (Small Paperback)</SelectItem>
                        <SelectItem value="6x9">6" x 9" (Standard)</SelectItem>
                        <SelectItem value="7x10">7" x 10" (Workbook)</SelectItem>
                        <SelectItem value="8.5x11">8.5" x 11" (Letter)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Standard sizes for most book publishing platforms
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pageCount">Target Page Count: {settings.pageCount}</Label>
                    <div className="flex gap-4 items-center">
                      <Slider
                        id="pageCount"
                        min={20}
                        max={80}
                        step={5}
                        value={[settings.pageCount]}
                        onValueChange={([value]) => handlePageCountChange(value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={20}
                        max={80}
                        value={settings.pageCount}
                        onChange={(e) => handlePageCountChange(parseInt(e.target.value, 10) || 20)}
                        className="w-20"
                      />
                    </div>
                    {settings.pageCount >= 80 && (
                      <p className="text-xs text-amber-500">
                        Maximum recommended page count reached. Generation may be slower.
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trimSize">Trim Size</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="trimWidth" className="text-xs">Width (inches)</Label>
                        <Input
                          id="trimWidth"
                          type="number"
                          step="0.125"
                          value={settings.trimWidth || 6}
                          onChange={(e) => onSettingChange('trimWidth', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="trimHeight" className="text-xs">Height (inches)</Label>
                        <Input
                          id="trimHeight"
                          type="number"
                          step="0.125"
                          value={settings.trimHeight || 9}
                          onChange={(e) => onSettingChange('trimHeight', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Final cut size of your book
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bleed">Bleed (inches)</Label>
                    <Input
                      id="bleed"
                      type="number"
                      step="0.025"
                      value={settings.bleed || 0.125}
                      onChange={(e) => onSettingChange('bleed', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Extra margin for cutting during printing (typically 0.125")
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="page-setup">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> Page Setup
              </h3>
              <Separator className="mb-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Margins (inches)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="marginInside" className="text-xs">Inside/Gutter</Label>
                        <Input
                          id="marginInside"
                          type="number"
                          step="0.05"
                          value={settings.marginInside || 0.75}
                          onChange={(e) => onSettingChange('marginInside', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="marginOutside" className="text-xs">Outside</Label>
                        <Input
                          id="marginOutside"
                          type="number"
                          step="0.05"
                          value={settings.marginOutside || 0.5}
                          onChange={(e) => onSettingChange('marginOutside', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <Label htmlFor="marginTop" className="text-xs">Top</Label>
                        <Input
                          id="marginTop"
                          type="number"
                          step="0.05"
                          value={settings.marginTop || 0.5}
                          onChange={(e) => onSettingChange('marginTop', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="marginBottom" className="text-xs">Bottom</Label>
                        <Input
                          id="marginBottom"
                          type="number"
                          step="0.05"
                          value={settings.marginBottom || 0.5}
                          onChange={(e) => onSettingChange('marginBottom', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 0.75" inside, 0.5" outside/top/bottom for most books
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includePageNumbers"
                      checked={settings.includePageNumbers}
                      onCheckedChange={(checked) => onSettingChange('includePageNumbers', checked)}
                    />
                    <Label htmlFor="includePageNumbers">Include page numbers</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includeTOC"
                      checked={settings.includeTOC}
                      onCheckedChange={(checked) => onSettingChange('includeTOC', checked)}
                    />
                    <Label htmlFor="includeTOC">Include table of contents</Label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="binding">Binding Type</Label>
                    <Select
                      value={settings.binding || 'perfect'}
                      onValueChange={(value) => onSettingChange('binding', value)}
                    >
                      <SelectTrigger id="binding">
                        <SelectValue placeholder="Select binding type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perfect">Perfect Bound (Paperback)</SelectItem>
                        <SelectItem value="hardcover">Hardcover</SelectItem>
                        <SelectItem value="spiral">Spiral Bound</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Affects gutter margin requirements
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paperType">Paper Type</Label>
                    <Select
                      value={settings.paperType || 'white'}
                      onValueChange={(value) => onSettingChange('paperType', value)}
                    >
                      <SelectTrigger id="paperType">
                        <SelectValue placeholder="Select paper type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="white">White (Standard)</SelectItem>
                        <SelectItem value="cream">Cream (Fiction/Literature)</SelectItem>
                        <SelectItem value="premium">Premium Color</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Paper color and quality
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="typography">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" /> Typography
              </h3>
              <Separator className="mb-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select
                      value={settings.fontFamily}
                      onValueChange={(value) => onSettingChange('fontFamily', value)}
                    >
                      <SelectTrigger id="fontFamily">
                        <SelectValue placeholder="Select font family" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Times New Roman">Times New Roman (Serif)</SelectItem>
                        <SelectItem value="Georgia">Georgia (Serif)</SelectItem>
                        <SelectItem value="Arial">Arial (Sans-serif)</SelectItem>
                        <SelectItem value="Helvetica">Helvetica (Sans-serif)</SelectItem>
                        <SelectItem value="Courier New">Courier New (Monospace)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Serif fonts are traditional for print books
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size: {settings.fontSize}pt</Label>
                    <Slider
                      id="fontSize"
                      min={8}
                      max={14}
                      step={0.5}
                      value={[settings.fontSize]}
                      onValueChange={(value) => onSettingChange('fontSize', value[0])}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      10-12pt is standard for most books
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lineSpacing">Line Spacing: {settings.lineSpacing.toFixed(2)}</Label>
                    <Slider
                      id="lineSpacing"
                      min={1}
                      max={2}
                      step={0.05}
                      value={[settings.lineSpacing]}
                      onValueChange={(value) => onSettingChange('lineSpacing', value[0])}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      1.15-1.5 is typical for most books
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="headingFontFamily">Heading Font</Label>
                    <Select
                      value={settings.headingFontFamily || settings.fontFamily}
                      onValueChange={(value) => onSettingChange('headingFontFamily', value)}
                    >
                      <SelectTrigger id="headingFontFamily">
                        <SelectValue placeholder="Select font family for headings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Times New Roman">Times New Roman (Serif)</SelectItem>
                        <SelectItem value="Georgia">Georgia (Serif)</SelectItem>
                        <SelectItem value="Arial">Arial (Sans-serif)</SelectItem>
                        <SelectItem value="Helvetica">Helvetica (Sans-serif)</SelectItem>
                        <SelectItem value="Courier New">Courier New (Monospace)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: use a different font for headings
                    </p>
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