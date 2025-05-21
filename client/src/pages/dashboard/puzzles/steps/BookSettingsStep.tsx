import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Info, BookText } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { WordSearchSettings } from '../WordSearch';

interface BookSettingsStepProps {
  settings: WordSearchSettings;
  onSettingChange: (key: keyof WordSearchSettings, value: any) => void;
}

export const BookSettingsStep: React.FC<BookSettingsStepProps> = ({
  settings,
  onSettingChange,
}) => {
  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookText className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Book Details</h2>
        </div>

        <div className="space-y-8">
          {/* Basic Book Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Book Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={settings.title}
                  onChange={(e) => onSettingChange('title', e.target.value)}
                  placeholder="My Word Search Collection"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a descriptive title for your puzzle book
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                <Input
                  id="subtitle"
                  value={settings.subtitle}
                  onChange={(e) => onSettingChange('subtitle', e.target.value)}
                  placeholder="Fun puzzles for all ages"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Add a subtitle to provide more context
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorName">Author Name</Label>
                <Input
                  id="authorName"
                  value={settings.authorName}
                  onChange={(e) => onSettingChange('authorName', e.target.value)}
                  placeholder="Your Name"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  This will appear on the title page
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Total Number of Puzzles</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="5"
                  max="100"
                  value={settings.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 5 && value <= 100) {
                      onSettingChange('quantity', value);
                    }
                  }}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 20-50 puzzles for a typical book
                </p>
              </div>
            </div>
          </div>

          {/* Book Layout & Format */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">Layout & Format</h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pageSize">Book Size (Trim Size)</Label>
                <Select
                  value={settings.pageSize}
                  onValueChange={(value) => onSettingChange('pageSize', value)}
                >
                  <SelectTrigger id="pageSize" className="w-full">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="6x9">6" x 9" (Standard)</SelectItem>
                    <SelectItem value="8.5x11">8.5" x 11" (Letter)</SelectItem>
                    <SelectItem value="5x8">5" x 8" (Small)</SelectItem>
                    <SelectItem value="7x10">7" x 10" (Medium)</SelectItem>
                    <SelectItem value="8x10">8" x 10" (Large)</SelectItem>
                    <SelectItem value="8.25x8.25">8.25" x 8.25" (Square)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Standard KDP-compliant trim sizes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interiorTheme">Interior Theme</Label>
                <Select
                  value={settings.interiorTheme}
                  onValueChange={(value) => onSettingChange('interiorTheme', value as 'light' | 'dark')}
                >
                  <SelectTrigger id="interiorTheme" className="w-full">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="light">Light (Black on White)</SelectItem>
                    <SelectItem value="dark">Dark (White on Black)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose light for standard books or dark for low-ink printing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Style</Label>
                <Select
                  value={settings.fontFamily}
                  onValueChange={(value) => onSettingChange('fontFamily', value)}
                >
                  <SelectTrigger id="fontFamily" className="w-full">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="sans">Sans-serif (Modern)</SelectItem>
                    <SelectItem value="serif">Serif (Traditional)</SelectItem>
                    <SelectItem value="mono">Monospace (Clear)</SelectItem>
                    <SelectItem value="handwritten">Handwritten (Casual)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  KDP-compatible fonts for optimal printing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="puzzlesPerPage">Puzzles Per Page</Label>
                <Select
                  value={String(settings.puzzlesPerPage)}
                  onValueChange={(value) => onSettingChange('puzzlesPerPage', parseInt(value))}
                >
                  <SelectTrigger id="puzzlesPerPage" className="w-full">
                    <SelectValue placeholder="Select puzzles per page" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="1">1 per page</SelectItem>
                    <SelectItem value="2">2 per page</SelectItem>
                    <SelectItem value="4">4 per page</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Automatically adjusts puzzle grid size
                </p>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">Additional Options</h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => onSettingChange('bleed', !settings.bleed)}
                  >
                    <Checkbox
                      id="bleed"
                      checked={settings.bleed}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        const newValue = checked === 'indeterminate' ? false : checked;
                        onSettingChange('bleed', newValue);
                      }}
                    />
                    <span>Include bleed (0.125" margin)</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">A bleed extends the printed area beyond the final trim size to ensure no white edges when the book is cut to its final size.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => onSettingChange('includePageNumbers', !settings.includePageNumbers)}
                  >
                    <Checkbox
                      id="includePageNumbers"
                      checked={settings.includePageNumbers}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        const newValue = checked === 'indeterminate' ? false : checked;
                        onSettingChange('includePageNumbers', newValue);
                      }}
                    />
                    <span>Include page numbers</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => onSettingChange('includeCoverPage', !settings.includeCoverPage)}
                  >
                    <Checkbox
                      id="includeCoverPage"
                      checked={settings.includeCoverPage}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        const newValue = checked === 'indeterminate' ? false : checked;
                        onSettingChange('includeCoverPage', newValue);
                      }}
                    />
                    <span>Include title page</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => onSettingChange('includeAnswers', !settings.includeAnswers)}
                  >
                    <Checkbox
                      id="includeAnswers"
                      checked={settings.includeAnswers}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        const newValue = checked === 'indeterminate' ? false : checked;
                        onSettingChange('includeAnswers', newValue);
                      }}
                    />
                    <span>Include answer key pages</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 