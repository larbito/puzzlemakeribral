import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { BookText, Settings, BookOpen, Type, LayoutGrid } from 'lucide-react';
import { WordSearchSettings } from '../WordSearch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

interface BookSettingsStepProps {
  settings: WordSearchSettings;
  onSettingChange: (key: keyof WordSearchSettings, value: any) => void;
}

const BookMockup: React.FC<{ settings: WordSearchSettings }> = ({ settings }) => {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`relative w-64 ${
          settings.pageSize === '6x9' ? 'h-96' : 
          settings.pageSize === '8.5x11' ? 'h-[140px]' : 
          settings.pageSize === '5x8' ? 'h-[102px]' : 
          settings.pageSize === '7x10' ? 'h-[91px]' : 
          settings.pageSize === '8x10' ? 'h-80' : 'h-64'
        } bg-white shadow-lg rounded-md overflow-hidden`}
        style={{ 
          fontFamily: 
            settings.fontFamily === 'sans' ? 'ui-sans-serif, system-ui, sans-serif' :
            settings.fontFamily === 'serif' ? 'ui-serif, Georgia, serif' :
            settings.fontFamily === 'mono' ? 'ui-monospace, monospace' : 'cursive'
        }}
      >
        {/* Book Cover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10 flex flex-col items-center justify-center p-4 text-center">
          <h3 className="font-bold text-lg mb-1 line-clamp-2">{settings.title || 'My Word Search Book'}</h3>
          {settings.subtitle && <p className="text-xs mb-2 italic line-clamp-1">{settings.subtitle}</p>}
          {settings.authorName && <p className="text-sm mt-auto">By {settings.authorName}</p>}
        </div>
        
        {/* Bleed indicator */}
        {settings.bleed && (
          <div className="absolute inset-0 border-2 border-dashed border-red-400 m-1 pointer-events-none"></div>
        )}
      </div>
      
      <div className="mt-6 space-y-2">
        <div 
          className={`relative w-64 ${
            settings.pageSize === '6x9' ? 'h-96' : 
            settings.pageSize === '8.5x11' ? 'h-[140px]' : 
            settings.pageSize === '5x8' ? 'h-[102px]' : 
            settings.pageSize === '7x10' ? 'h-[91px]' : 
            settings.pageSize === '8x10' ? 'h-80' : 'h-64'
          } bg-white shadow-md rounded-md overflow-hidden`}
        >
          {/* Interior Page */}
          <div className={`absolute inset-0 ${settings.interiorTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} p-4`}>
            <h4 className="text-sm font-semibold mb-2 text-center">{settings.title || 'Word Search Puzzle'}</h4>
            
            {/* Grid Preview */}
            <div className="w-full aspect-square border border-gray-300 rounded-sm overflow-hidden">
              <div 
                className="grid w-full h-full" 
                style={{ 
                  gridTemplateColumns: `repeat(${settings.gridSize}, 1fr)`,
                  gridTemplateRows: `repeat(${settings.gridSize}, 1fr)`,
                  fontSize: `${Math.max(6, 14 - settings.gridSize / 3)}px`
                }}
              >
                {Array.from({ length: settings.gridSize * settings.gridSize }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-center ${
                      settings.interiorTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    } border-r border-b`}
                  >
                    {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Word List Preview */}
            <div className="mt-2 flex flex-wrap justify-center gap-x-2 text-[6px]">
              {['PUZZLE', 'SEARCH', 'WORD', 'FIND', 'GAME', 'FUN', 'PLAY'].map((word, i) => (
                <span key={i}>{word}</span>
              ))}
            </div>
            
            {/* Page Number */}
            {settings.includePageNumbers && (
              <div className="absolute bottom-2 w-full text-center text-[8px]">1</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const BookSettingsStep: React.FC<BookSettingsStepProps> = ({ settings, onSettingChange }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-8">
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="basic" className="flex items-center gap-1">
                  <BookText className="h-4 w-4" /> Basic Info
                </TabsTrigger>
                <TabsTrigger value="format" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" /> Format & Size
                </TabsTrigger>
                <TabsTrigger value="grid" className="flex items-center gap-1">
                  <LayoutGrid className="h-4 w-4" /> Puzzle Grid
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="space-y-1">
                  <Label htmlFor="title">Book Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={settings.title}
                    onChange={(e) => onSettingChange('title', e.target.value)}
                    placeholder="My Word Search Collection"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Choose a catchy title for your book</p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                  <Input
                    id="subtitle"
                    value={settings.subtitle}
                    onChange={(e) => onSettingChange('subtitle', e.target.value)}
                    placeholder="Fun puzzles for all ages"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Add more context about your book</p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="authorName">Author Name</Label>
                  <Input
                    id="authorName"
                    value={settings.authorName}
                    onChange={(e) => onSettingChange('authorName', e.target.value)}
                    placeholder="Your Name"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Your name as it will appear on the book</p>
                </div>
              </TabsContent>

              <TabsContent value="format" className="space-y-6">
                <div className="space-y-1">
                  <Label htmlFor="pageSize">Book Size</Label>
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
                  <p className="text-xs text-muted-foreground">Choose a KDP-compliant book size</p>
                </div>

                <div className="space-y-1">
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
                  <p className="text-xs text-muted-foreground">Choose the color scheme for puzzle pages</p>
                </div>

                <div className="space-y-1">
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
                  <p className="text-xs text-muted-foreground">Select a font style for your book</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePageNumbers"
                      checked={settings.includePageNumbers}
                      onCheckedChange={(checked: boolean | 'indeterminate') => 
                        onSettingChange('includePageNumbers', checked === 'indeterminate' ? false : checked)
                      }
                    />
                    <div className="space-y-0.5">
                      <Label 
                        htmlFor="includePageNumbers" 
                        className="cursor-pointer"
                      >Add page numbers</Label>
                      <p className="text-xs text-muted-foreground">Include page numbers at the bottom</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bleed"
                      checked={settings.bleed}
                      onCheckedChange={(checked: boolean | 'indeterminate') => 
                        onSettingChange('bleed', checked === 'indeterminate' ? false : checked)
                      }
                    />
                    <div className="space-y-0.5">
                      <Label 
                        htmlFor="bleed" 
                        className="cursor-pointer"
                      >Add bleed margin</Label>
                      <p className="text-xs text-muted-foreground">Extend content to the edge (for printing)</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="grid" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <Label htmlFor="gridSize">Grid Size: {settings.gridSize}×{settings.gridSize}</Label>
                      <span className="text-sm text-muted-foreground">{settings.gridSize}×{settings.gridSize}</span>
                    </div>
                    <Slider
                      id="gridSize"
                      min={8}
                      max={20}
                      step={1}
                      value={[settings.gridSize]}
                      onValueChange={(value) => onSettingChange('gridSize', value[0])}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Choose the size of your word search grid</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <Label htmlFor="wordsPerPuzzle">Words Per Puzzle: {settings.wordsPerPuzzle}</Label>
                      <span className="text-sm text-muted-foreground">{settings.wordsPerPuzzle}</span>
                    </div>
                    <Slider
                      id="wordsPerPuzzle"
                      min={5}
                      max={25}
                      step={1}
                      value={[settings.wordsPerPuzzle]}
                      onValueChange={(value) => onSettingChange('wordsPerPuzzle', value[0])}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Number of words to include in each puzzle</p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <Label htmlFor="puzzlesPerPage">Puzzles Per Page: {settings.puzzlesPerPage}</Label>
                      <span className="text-sm text-muted-foreground">{settings.puzzlesPerPage}</span>
                    </div>
                    <Slider
                      id="puzzlesPerPage"
                      min={1}
                      max={4}
                      step={1}
                      value={[settings.puzzlesPerPage]}
                      onValueChange={(value) => onSettingChange('puzzlesPerPage', value[0])}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Number of puzzles to display on each page</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label>Word Directions</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="directionHorizontal"
                          checked={settings.directions.horizontal}
                          onCheckedChange={(checked) => 
                            onSettingChange('directions', {
                              ...settings.directions,
                              horizontal: checked === 'indeterminate' ? false : checked
                            })
                          }
                        />
                        <Label 
                          htmlFor="directionHorizontal" 
                          className="cursor-pointer"
                        >Horizontal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="directionVertical"
                          checked={settings.directions.vertical}
                          onCheckedChange={(checked) => 
                            onSettingChange('directions', {
                              ...settings.directions,
                              vertical: checked === 'indeterminate' ? false : checked
                            })
                          }
                        />
                        <Label 
                          htmlFor="directionVertical" 
                          className="cursor-pointer"
                        >Vertical</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="directionDiagonal"
                          checked={settings.directions.diagonal}
                          onCheckedChange={(checked) => 
                            onSettingChange('directions', {
                              ...settings.directions,
                              diagonal: checked === 'indeterminate' ? false : checked
                            })
                          }
                        />
                        <Label 
                          htmlFor="directionDiagonal" 
                          className="cursor-pointer"
                        >Diagonal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="directionBackward"
                          checked={settings.directions.backward}
                          onCheckedChange={(checked) => 
                            onSettingChange('directions', {
                              ...settings.directions,
                              backward: checked === 'indeterminate' ? false : checked
                            })
                          }
                        />
                        <Label 
                          htmlFor="directionBackward" 
                          className="cursor-pointer"
                        >Backward</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Preview Section */}
      <div className="lg:col-span-2">
        <Card className="sticky top-20">
          <CardContent className="p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> 
              Live Preview
            </h3>
            
            <motion.div 
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <BookMockup settings={settings} />
            </motion.div>
            
            <div className="mt-6 w-full text-center text-sm text-muted-foreground">
              <p>This is a preview of how your book will look</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 