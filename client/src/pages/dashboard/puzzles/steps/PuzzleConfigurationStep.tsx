import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Settings, 
  Palette, 
  Layout, 
  Type, 
  Grid3X3,
  Eye,
  Check,
  BookOpen,
  PenLine
} from 'lucide-react';
import { WordSearchSettings } from '../WordSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion } from 'framer-motion';

interface PuzzleConfigurationStepProps {
  settings: WordSearchSettings;
  onSettingChange: (key: keyof WordSearchSettings, value: any) => void;
}

interface PuzzlePreviewProps {
  settings: WordSearchSettings;
}

const PuzzlePreview: React.FC<PuzzlePreviewProps> = ({ settings }) => {
  // Generate a random sample word search grid
  const gridSize = settings.gridSize;
  const grid = Array.from({ length: gridSize }, () => 
    Array.from({ length: gridSize }, () => 
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    )
  );
  
  // Insert a sample word
  const sampleWord = "PUZZLE";
  if (gridSize >= 6 && settings.directions.horizontal) {
    const row = Math.floor(gridSize / 2);
    for (let i = 0; i < sampleWord.length; i++) {
      grid[row][i + 1] = sampleWord[i];
    }
  }

  return (
    <div className={`p-4 rounded-md ${
      settings.interiorTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 border border-gray-200'
    }`}>
      <h3 className={`text-center text-sm font-medium mb-3`} style={{ 
        fontFamily: settings.fontFamily === 'sans' ? 'ui-sans-serif, system-ui, sans-serif' :
                  settings.fontFamily === 'serif' ? 'ui-serif, Georgia, serif' :
                  settings.fontFamily === 'mono' ? 'ui-monospace, monospace' : 'cursive'
      }}>
        Sample Puzzle
      </h3>
      
      <div className="grid gap-px" style={{ 
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        fontSize: `${Math.max(6, 12 - gridSize / 4)}px`,
      }}>
        {grid.map((row, rowIndex) => 
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`flex items-center justify-center aspect-square ${
                settings.interiorTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'
              } border`}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      
      <div className="mt-3 flex flex-wrap justify-center gap-x-2 text-[8px]">
        {['PUZZLE', 'SEARCH', 'WORD', 'FIND', 'GAME'].map((word, i) => (
          <span key={i}>{word}</span>
        ))}
      </div>
    </div>
  );
};

export const PuzzleConfigurationStep: React.FC<PuzzleConfigurationStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const [activeTab, setActiveTab] = useState('layout');
  
  const fontOptions = [
    { value: 'sans', label: 'Sans-serif', description: 'Clean modern look' },
    { value: 'serif', label: 'Serif', description: 'Traditional elegant style' },
    { value: 'mono', label: 'Monospace', description: 'Fixed-width letters' },
    { value: 'handwritten', label: 'Handwritten', description: 'Casual, friendly style' },
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="layout" className="flex items-center gap-1">
                  <Layout className="h-4 w-4" /> Layout
                </TabsTrigger>
                <TabsTrigger value="style" className="flex items-center gap-1">
                  <Palette className="h-4 w-4" /> Style
                </TabsTrigger>
                <TabsTrigger value="solutions" className="flex items-center gap-1">
                  <Check className="h-4 w-4" /> Solutions
                </TabsTrigger>
              </TabsList>

              {/* Puzzle Layout Tab */}
              <TabsContent value="layout" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Puzzle Layout</h3>
                  <Separator className="mb-4" />
                  
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <div className="flex justify-between mb-1">
                        <Label>Grid Size: {settings.gridSize}×{settings.gridSize}</Label>
                        <span className="text-sm text-muted-foreground">{settings.gridSize}×{settings.gridSize}</span>
                      </div>
                      <Slider
                        min={8}
                        max={20}
                        step={1}
                        value={[settings.gridSize]}
                        onValueChange={(value) => onSettingChange('gridSize', value[0])}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Larger grids can fit more and longer words but may be more challenging
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between mb-1">
                        <Label>Words Per Puzzle: {settings.wordsPerPuzzle}</Label>
                        <span className="text-sm text-muted-foreground">{settings.wordsPerPuzzle}</span>
                      </div>
                      <Slider
                        min={5}
                        max={25}
                        step={1}
                        value={[settings.wordsPerPuzzle]}
                        onValueChange={(value) => onSettingChange('wordsPerPuzzle', value[0])}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 10-15 words for optimal puzzle density
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between mb-1">
                        <Label>Puzzles Per Page: {settings.puzzlesPerPage}</Label>
                        <span className="text-sm text-muted-foreground">{settings.puzzlesPerPage}</span>
                      </div>
                      <Slider
                        min={1}
                        max={4}
                        step={1}
                        value={[settings.puzzlesPerPage]}
                        onValueChange={(value) => onSettingChange('puzzlesPerPage', value[0])}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        How many puzzles to display on each page
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Puzzle Style</h3>
                  <Separator className="mb-4" />
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Typography</Label>
                      <RadioGroup
                        value={settings.fontFamily}
                        onValueChange={(value) => onSettingChange('fontFamily', value)}
                        className="grid grid-cols-2 gap-4 pt-2"
                      >
                        {fontOptions.map((font) => (
                          <div key={font.value} className="flex items-start space-x-2">
                            <RadioGroupItem value={font.value} id={`font-${font.value}`} />
                            <div className="grid gap-1.5 leading-none">
                              <Label
                                htmlFor={`font-${font.value}`}
                                className={`font-medium ${
                                  font.value === 'sans' ? 'font-sans' :
                                  font.value === 'serif' ? 'font-serif' :
                                  font.value === 'mono' ? 'font-mono' : 'font-serif italic'
                                }`}
                              >
                                {font.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {font.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <RadioGroup
                        value={settings.interiorTheme}
                        onValueChange={(value) => onSettingChange('interiorTheme', value as 'light' | 'dark')}
                        className="grid grid-cols-2 gap-4 pt-2"
                      >
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="light" id="theme-light" />
                          <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="theme-light" className="font-medium">Light Theme</Label>
                            <p className="text-xs text-muted-foreground">
                              Black text on white background
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <RadioGroupItem value="dark" id="theme-dark" />
                          <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="theme-dark" className="font-medium">Dark Theme</Label>
                            <p className="text-xs text-muted-foreground">
                              White text on black background
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Solutions Tab */}
              <TabsContent value="solutions" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Puzzle Solutions</h3>
                  <Separator className="mb-4" />
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeAnswers"
                          checked={settings.includeAnswers}
                          onCheckedChange={(checked) => 
                            onSettingChange('includeAnswers', checked === 'indeterminate' ? false : checked)
                          }
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor="includeAnswers">Include answer keys</Label>
                          <p className="text-xs text-muted-foreground">
                            Add solution pages at the end of the book
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Word Direction Options</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Select which directions words can appear in your puzzles
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="horizontal"
                            checked={settings.directions.horizontal}
                            onCheckedChange={(checked) => 
                              onSettingChange('directions', {
                                ...settings.directions,
                                horizontal: checked === 'indeterminate' ? false : checked
                              })
                            }
                          />
                          <Label htmlFor="horizontal">Horizontal (→)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="vertical"
                            checked={settings.directions.vertical}
                            onCheckedChange={(checked) => 
                              onSettingChange('directions', {
                                ...settings.directions,
                                vertical: checked === 'indeterminate' ? false : checked
                              })
                            }
                          />
                          <Label htmlFor="vertical">Vertical (↓)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="diagonal"
                            checked={settings.directions.diagonal}
                            onCheckedChange={(checked) => 
                              onSettingChange('directions', {
                                ...settings.directions,
                                diagonal: checked === 'indeterminate' ? false : checked
                              })
                            }
                          />
                          <Label htmlFor="diagonal">Diagonal (↘)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="backward"
                            checked={settings.directions.backward}
                            onCheckedChange={(checked) => 
                              onSettingChange('directions', {
                                ...settings.directions,
                                backward: checked === 'indeterminate' ? false : checked
                              })
                            }
                          />
                          <Label htmlFor="backward">Backward (←↑↖)</Label>
                        </div>
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
      <div className="lg:col-span-1">
        <Card className="sticky top-20">
          <CardContent className="p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> 
              Puzzle Preview
            </h3>
            
            <motion.div
              key={`${settings.gridSize}-${settings.interiorTheme}-${settings.fontFamily}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <PuzzlePreview settings={settings} />
            </motion.div>
            
            <div className="mt-6 space-y-4 w-full">
              <div className="text-sm text-center text-muted-foreground">
                {activeTab === 'layout' && (
                  <p>Adjust grid size and word count to balance difficulty</p>
                )}
                {activeTab === 'style' && (
                  <p>Choose styles that enhance readability</p>
                )}
                {activeTab === 'solutions' && (
                  <p>Configure how answers appear in the book</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 