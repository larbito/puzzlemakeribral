import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { KDPBookSettings } from '../KDPBookFormatter';
import { 
  Sliders, 
  Ruler, 
  BookOpen, 
  PaintBucket, 
  TextQuote, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Sparkles,
  Eye,
  Settings,
  Palette
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BookSettingsStepProps {
  settings: KDPBookSettings;
  onSettingChange: (key: keyof KDPBookSettings, value: any) => void;
}

export const BookSettingsStep: React.FC<BookSettingsStepProps> = ({
  settings,
  onSettingChange
}) => {
  const [activePreview, setActivePreview] = useState<'book' | 'page'>('book');

  // Font options - common book fonts with categories
  const fontCategories = {
    serif: [
      'Times New Roman',
      'Georgia',
      'Garamond',
      'Baskerville',
      'Palatino',
      'Bookman',
      'Cambria',
      'Minion Pro'
    ],
    sansSerif: [
      'Arial',
      'Helvetica',
      'Verdana',
      'Calibri',
      'Futura'
    ]
  };

  // Book size information with enhanced details
  const bookSizeInfo = {
    '6x9': {
      description: 'Standard paperback size for most fiction and non-fiction books',
      popularity: 'Most Popular',
      bestFor: 'Novels, memoirs, self-help books',
      color: 'bg-green-100 text-green-800'
    },
    '5x8': {
      description: 'Common size for smaller paperbacks like romance novels',
      popularity: 'Popular',
      bestFor: 'Romance, poetry, small guides',
      color: 'bg-blue-100 text-blue-800'
    },
    '7x10': {
      description: 'Good for textbooks, workbooks, and other educational material',
      popularity: 'Educational',
      bestFor: 'Textbooks, workbooks, manuals',
      color: 'bg-purple-100 text-purple-800'
    },
    '8.5x11': {
      description: 'Letter size - for large format books, manuals, and workbooks',
      popularity: 'Professional',
      bestFor: 'Manuals, large format books, journals',
      color: 'bg-orange-100 text-orange-800'
    }
  };

  // Handle switch toggle
  const handleSwitchChange = (key: keyof KDPBookSettings) => {
    onSettingChange(key, !settings[key]);
  };

  // Get margin validation status
  const getMarginStatus = () => {
    const minMargin = 0.25;
    const recommendedInside = 0.375;
    
    if (settings.marginTop < minMargin || settings.marginBottom < minMargin || 
        settings.marginInside < minMargin || settings.marginOutside < minMargin) {
      return { status: 'error', message: 'Some margins are below KDP minimum requirements' };
    }
    
    if (settings.marginInside < recommendedInside) {
      return { status: 'warning', message: 'Inside margin below recommended for books with 150+ pages' };
    }
    
    return { status: 'success', message: 'All margins meet KDP requirements' };
  };

  const marginStatus = getMarginStatus();

  // Enhanced book preview component
  const BookPreview = () => (
    <div className="relative">
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border-2 border-dashed border-slate-300">
        <div 
          className="bg-white shadow-lg rounded-lg mx-auto relative overflow-hidden"
          style={{
            width: `${settings.trimSize === '6x9' ? '120px' : settings.trimSize === '5x8' ? '100px' : settings.trimSize === '7x10' ? '140px' : '170px'}`,
            height: `${settings.trimSize === '6x9' ? '180px' : settings.trimSize === '5x8' ? '160px' : settings.trimSize === '7x10' ? '200px' : '220px'}`,
            aspectRatio: settings.trimSize === '6x9' ? '6/9' : settings.trimSize === '5x8' ? '5/8' : settings.trimSize === '7x10' ? '7/10' : '8.5/11'
          }}
        >
          {/* Book cover simulation */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-20"></div>
          
          {/* Margin indicators */}
          <div 
            className="absolute bg-red-200 opacity-50"
            style={{
              top: `${(settings.marginTop / (settings.trimSize === '6x9' ? 9 : settings.trimSize === '5x8' ? 8 : settings.trimSize === '7x10' ? 10 : 11)) * 100}%`,
              left: `${(settings.marginInside / (settings.trimSize === '6x9' ? 6 : settings.trimSize === '5x8' ? 5 : settings.trimSize === '7x10' ? 7 : 8.5)) * 100}%`,
              right: `${(settings.marginOutside / (settings.trimSize === '6x9' ? 6 : settings.trimSize === '5x8' ? 5 : settings.trimSize === '7x10' ? 7 : 8.5)) * 100}%`,
              bottom: `${(settings.marginBottom / (settings.trimSize === '6x9' ? 9 : settings.trimSize === '5x8' ? 8 : settings.trimSize === '7x10' ? 10 : 11)) * 100}%`,
            }}
          >
            {/* Text content simulation */}
            <div 
              className="text-gray-700 leading-relaxed text-xs"
              style={{
                fontFamily: settings.fontFamily,
                lineHeight: settings.lineSpacing,
                fontSize: `${Math.max(6, settings.fontSize * 0.5)}px`
              }}
            >
              <div className="space-y-1">
                <div className="h-1 bg-gray-400 rounded w-3/4"></div>
                <div className="h-1 bg-gray-300 rounded w-full"></div>
                <div className="h-1 bg-gray-300 rounded w-5/6"></div>
                <div className="h-1 bg-gray-300 rounded w-full"></div>
                <div className="h-1 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>
          
          {/* Page numbers indicator */}
          {settings.includePageNumbers && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
              1
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <Badge variant="outline" className="text-xs">
          {settings.trimSize.replace('x', '" × ')} inches
        </Badge>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Header with enhanced styling */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200">
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Book Settings
            </h2>
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Configure your book's physical attributes and formatting options to create a professional KDP-ready publication
          </p>
        </div>

        {/* Status Alert */}
        <Alert className={`border-l-4 ${
          marginStatus.status === 'error' ? 'border-red-500 bg-red-50' :
          marginStatus.status === 'warning' ? 'border-yellow-500 bg-yellow-50' :
          'border-green-500 bg-green-50'
        }`}>
          <div className="flex items-center gap-2">
            {marginStatus.status === 'error' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
             marginStatus.status === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-600" /> :
             <CheckCircle className="h-4 w-4 text-green-600" />}
            <AlertDescription className={
              marginStatus.status === 'error' ? 'text-red-800' :
              marginStatus.status === 'warning' ? 'text-yellow-800' :
              'text-green-800'
            }>
              {marginStatus.message}
            </AlertDescription>
          </div>
        </Alert>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings Panel */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="size-margins" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-8 h-12 bg-gradient-to-r from-slate-100 to-slate-200">
                <TabsTrigger value="size-margins" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <Ruler className="h-4 w-4" />
                  <span className="hidden sm:inline">Size & Margins</span>
                  <span className="sm:hidden">Size</span>
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <TextQuote className="h-4 w-4" />
                  <span className="hidden sm:inline">Typography</span>
                  <span className="sm:hidden">Text</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Features</span>
                  <span className="sm:hidden">Extra</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Size & Margins Tab */}
              <TabsContent value="size-margins" className="space-y-6">
                {/* Book Size Section */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      Book Dimensions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label htmlFor="trimSize" className="text-base font-medium">Trim Size</Label>
                        <Select 
                          value={settings.trimSize} 
                          onValueChange={(value) => onSettingChange('trimSize', value)}
                        >
                          <SelectTrigger className="h-12 border-2 hover:border-blue-300 transition-colors">
                            <SelectValue placeholder="Select trim size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6x9" className="py-3">
                              <div className="flex items-center justify-between w-full">
                                <span>6" × 9" (15.24 × 22.86 cm)</span>
                                <Badge className="ml-2 bg-green-100 text-green-800">Most Popular</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="5x8" className="py-3">
                              <div className="flex items-center justify-between w-full">
                                <span>5" × 8" (12.7 × 20.32 cm)</span>
                                <Badge className="ml-2 bg-blue-100 text-blue-800">Popular</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="7x10" className="py-3">
                              <div className="flex items-center justify-between w-full">
                                <span>7" × 10" (17.78 × 25.4 cm)</span>
                                <Badge className="ml-2 bg-purple-100 text-purple-800">Educational</Badge>
                              </div>
                            </SelectItem>
                            <SelectItem value="8.5x11" className="py-3">
                              <div className="flex items-center justify-between w-full">
                                <span>8.5" × 11" (21.59 × 27.94 cm)</span>
                                <Badge className="ml-2 bg-orange-100 text-orange-800">Professional</Badge>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                {bookSizeInfo[settings.trimSize as keyof typeof bookSizeInfo]?.bestFor}
                              </p>
                              <p className="text-xs text-blue-700">
                                {bookSizeInfo[settings.trimSize as keyof typeof bookSizeInfo]?.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base font-medium">Bleed</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              For images extending to page edges
                            </p>
                          </div>
                          <Switch 
                            checked={settings.bleed}
                            onCheckedChange={() => handleSwitchChange('bleed')}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                        
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-amber-900 mb-1">
                                Bleed Information
                              </p>
                              <p className="text-xs text-amber-700">
                                Adds 0.125" (3.2 mm) margin that will be trimmed during printing. 
                                Only enable if your book contains full-bleed images.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Margins Section */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Sliders className="h-5 w-5 text-purple-600" />
                      </div>
                      Page Margins
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { key: 'marginTop', label: 'Top', icon: '↑' },
                        { key: 'marginBottom', label: 'Bottom', icon: '↓' },
                        { key: 'marginInside', label: 'Inside (Binding)', icon: '←' },
                        { key: 'marginOutside', label: 'Outside', icon: '→' }
                      ].map(({ key, label, icon }) => (
                        <div key={key} className="space-y-3">
                          <Label htmlFor={key} className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-lg">{icon}</span>
                            {label}
                          </Label>
                          <div className="space-y-2">
                            <Input
                              id={key}
                              type="number"
                              step="0.125"
                              min="0.25"
                              max="3"
                              value={settings[key as keyof KDPBookSettings] as number}
                              onChange={(e) => onSettingChange(key as keyof KDPBookSettings, parseFloat(e.target.value))}
                              className="h-10 text-center font-mono"
                            />
                            <div className="px-2">
                              <Slider
                                value={[settings[key as keyof KDPBookSettings] as number]}
                                onValueChange={(value) => onSettingChange(key as keyof KDPBookSettings, value[0])}
                                max={3}
                                min={0.25}
                                step={0.125}
                                className="w-full"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-center text-muted-foreground">
                            {settings[key as keyof KDPBookSettings]} inches
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <Alert className="border-blue-200 bg-blue-50">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>KDP Requirements:</strong> Minimum 0.25" for all sides. 
                        Inside margin of 0.375"+ recommended for books with 150+ pages.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Typography Tab */}
              <TabsContent value="typography" className="space-y-6">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TextQuote className="h-5 w-5 text-green-600" />
                      </div>
                      Typography Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <div className="space-y-4">
                        <Label htmlFor="fontFamily" className="text-base font-medium">Font Family</Label>
                        <Select 
                          value={settings.fontFamily} 
                          onValueChange={(value) => onSettingChange('fontFamily', value)}
                        >
                          <SelectTrigger className="h-12 border-2 hover:border-green-300 transition-colors">
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2">
                              <p className="text-xs font-semibold text-gray-500 mb-2">SERIF FONTS (Recommended for books)</p>
                              {fontCategories.serif.map(font => (
                                <SelectItem key={font} value={font} className="py-2">
                                  <span style={{ fontFamily: font }}>{font}</span>
                                </SelectItem>
                              ))}
                              <Separator className="my-2" />
                              <p className="text-xs font-semibold text-gray-500 mb-2">SANS-SERIF FONTS</p>
                              {fontCategories.sansSerif.map(font => (
                                <SelectItem key={font} value={font} className="py-2">
                                  <span style={{ fontFamily: font }}>{font}</span>
                                </SelectItem>
                              ))}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-4">
                        <Label htmlFor="fontSize" className="text-base font-medium">Font Size</Label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <Input
                              id="fontSize"
                              type="number"
                              step="0.5"
                              min="8"
                              max="16"
                              value={settings.fontSize}
                              onChange={(e) => onSettingChange('fontSize', parseFloat(e.target.value))}
                              className="h-10 text-center font-mono flex-1"
                            />
                            <span className="text-sm text-muted-foreground min-w-[2rem]">pt</span>
                          </div>
                          <Slider
                            value={[settings.fontSize]}
                            onValueChange={(value) => onSettingChange('fontSize', value[0])}
                            max={16}
                            min={8}
                            step={0.5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>8pt</span>
                            <span>12pt (Standard)</span>
                            <span>16pt</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="lineSpacing" className="text-base font-medium">Line Spacing</Label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.lineSpacing]}
                            onValueChange={(value) => onSettingChange('lineSpacing', value[0])}
                            max={2}
                            min={1}
                            step={0.05}
                            className="flex-1"
                          />
                          <Badge variant="outline" className="min-w-[4rem] text-center font-mono">
                            {settings.lineSpacing.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1.0 (Single)</span>
                          <span>1.5 (Standard)</span>
                          <span>2.0 (Double)</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Typography Preview */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Typography Preview
                      </Label>
                      <div 
                        className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-white shadow-inner"
                        style={{ 
                          fontFamily: settings.fontFamily,
                          fontSize: `${settings.fontSize}pt`,
                          lineHeight: settings.lineSpacing
                        }}
                      >
                        <h3 className="font-bold mb-4 text-lg">Chapter 1: The Beginning</h3>
                        <p className="mb-4">
                          This is a preview of your selected typography settings. The quick brown fox jumps over the lazy dog. 
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero.
                        </p>
                        <p className="mb-4">
                          Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. 
                          Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta.
                        </p>
                        <p>
                          Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora 
                          torquent per conubia nostra, per inceptos himenaeos.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Features Tab */}
              <TabsContent value="appearance" className="space-y-6">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <PaintBucket className="h-5 w-5 text-orange-600" />
                      </div>
                      Book Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Table of Contents</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically generate a table of contents from chapter headings
                          </p>
                        </div>
                        <Switch 
                          checked={settings.includeTOC}
                          onCheckedChange={() => handleSwitchChange('includeTOC')}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Page Numbers</Label>
                          <p className="text-sm text-muted-foreground">
                            Add page numbers at the bottom of each page
                          </p>
                        </div>
                        <Switch 
                          checked={settings.includePageNumbers}
                          onCheckedChange={() => handleSwitchChange('includePageNumbers')}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    </div>
                    
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Professional Tip:</strong> Both features are recommended for most books to improve readability and navigation.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Enhanced Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActivePreview('book')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      activePreview === 'book' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Book View
                  </button>
                  <button
                    onClick={() => setActivePreview('page')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      activePreview === 'page' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Page View
                  </button>
                </div>

                {activePreview === 'book' ? (
                  <BookPreview />
                ) : (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border-2 border-dashed border-slate-300">
                    <div 
                      className="bg-white shadow-lg rounded-lg p-4 mx-auto"
                      style={{
                        width: '200px',
                        height: '280px',
                        fontFamily: settings.fontFamily,
                        fontSize: '8px',
                        lineHeight: settings.lineSpacing
                      }}
                    >
                      <div 
                        className="h-full border border-gray-300 p-2"
                        style={{
                          marginTop: `${settings.marginTop * 8}px`,
                          marginBottom: `${settings.marginBottom * 8}px`,
                          marginLeft: `${settings.marginInside * 8}px`,
                          marginRight: `${settings.marginOutside * 8}px`,
                        }}
                      >
                        <div className="space-y-1 text-gray-700">
                          <div className="font-bold text-xs mb-2">Chapter Title</div>
                          <div className="space-y-1">
                            {Array.from({ length: 15 }, (_, i) => (
                              <div key={i} className={`h-1 bg-gray-400 rounded ${
                                i % 4 === 3 ? 'w-2/3' : 'w-full'
                              }`}></div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {settings.includePageNumbers && (
                        <div className="text-center text-xs text-gray-500 mt-2">1</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Settings Summary */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium text-sm text-gray-700">Current Settings</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{settings.trimSize}"</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Font:</span>
                      <span className="font-medium">{settings.fontFamily}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{settings.fontSize}pt</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spacing:</span>
                      <span className="font-medium">{settings.lineSpacing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TOC:</span>
                      <span className="font-medium">{settings.includeTOC ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Page #:</span>
                      <span className="font-medium">{settings.includePageNumbers ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}; 