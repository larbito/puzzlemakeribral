import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Settings, Grid, BookOpen, Plus, Trash2, Type } from 'lucide-react';
import { KDPConfig, KDPSettings } from './KDPSettings';
import { Button } from '@/components/ui/button';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
export type SolutionPlacement = 'afterEach' | 'endOfLevel' | 'endOfBook';

export interface DifficultySection {
  difficulty: DifficultyLevel;
  count: number;
}

export interface SudokuKDPConfig extends KDPConfig {
  gridSize: '9x9' | '6x6' | '4x4';
  difficultyMix: 'single' | 'multiple';
  difficulty: DifficultyLevel;
  difficultySections: DifficultySection[];
  puzzlesPerPage: number;
  includeSolutions: boolean;
  solutionPlacement: SolutionPlacement;
  includeHints: boolean;
  includePageNumbers: boolean;
  bookTitle: string;
  showDifficultyInTitle: boolean;
  puzzleNumberingStyle: 'sequential' | 'bySection' | 'customPrefix';
  puzzleNumberingPrefix: string;
  gridStyle: 'classic' | 'modern' | 'minimal';
  gridLineColor: 'black' | 'gray' | 'dark-blue';
  alternateBoxShading: boolean;
  numberFont: 'sans' | 'serif' | 'mono';
}

const defaultSudokuKDPConfig: SudokuKDPConfig = {
  // KDP settings
  bookSize: '6x9',
  interiorMargin: 0.25,
  exteriorMargin: 0.25,
  topMargin: 0.25,
  bottomMargin: 0.25,
  hasBleed: false,
  gutterMargin: 0.125,
  numberOfPages: 100,
  colorMode: 'bw',
  // Sudoku specific settings
  gridSize: '9x9',
  difficultyMix: 'single',
  difficulty: 'medium',
  difficultySections: [
    { difficulty: 'easy', count: 30 },
    { difficulty: 'medium', count: 30 },
    { difficulty: 'hard', count: 30 }
  ],
  puzzlesPerPage: 1,
  includeSolutions: true,
  solutionPlacement: 'afterEach',
  includeHints: false,
  includePageNumbers: true,
  bookTitle: 'Sudoku Puzzle Book',
  showDifficultyInTitle: true,
  puzzleNumberingStyle: 'sequential',
  puzzleNumberingPrefix: 'Puzzle',
  gridStyle: 'classic',
  gridLineColor: 'black',
  alternateBoxShading: false,
  numberFont: 'sans',
};

interface SudokuKDPSettingsProps {
  config: SudokuKDPConfig;
  onChange: (config: SudokuKDPConfig) => void;
}

export const SudokuKDPSettings = ({ config = defaultSudokuKDPConfig, onChange }: SudokuKDPSettingsProps) => {
  // Add internal state for tracking difficultyMix changes
  const [lastDifficultyMix, setLastDifficultyMix] = useState(config.difficultyMix);
  
  // Calculate total pages based on difficulty sections
  useEffect(() => {
    // Only update when in multiple difficulty mode
    if (config.difficultyMix === 'multiple') {
      const totalPuzzles = config.difficultySections.reduce((sum, section) => sum + section.count, 0);
      const totalPages = Math.ceil(totalPuzzles / config.puzzlesPerPage);

      // Only update if total pages has changed
      if (totalPages !== config.numberOfPages) {
        console.log(`Updating page count to ${totalPages} for ${totalPuzzles} puzzles with ${config.puzzlesPerPage} per page`);
        onChange({
          ...config,
          numberOfPages: totalPages
        });
      }
    } 
    // If switched from multiple to single, keep the current page count
    else if (lastDifficultyMix === 'multiple' && config.difficultyMix === 'single') {
      // Do nothing, keep existing number of pages
    }
    
    // Remember the current difficulty mix
    setLastDifficultyMix(config.difficultyMix);
  }, [config.difficultyMix, config.difficultySections, config.puzzlesPerPage]);

  const handleChange = (key: keyof SudokuKDPConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const handleDifficultyMixChange = (value: 'single' | 'multiple') => {
    onChange({ 
      ...config, 
      difficultyMix: value,
      // If switching to single, use the first difficulty from the mix or default to medium
      difficulty: value === 'single' ? 
        (config.difficultySections.length > 0 ? config.difficultySections[0].difficulty : 'medium') : 
        config.difficulty
    });
  };

  const handleKDPChange = (kdpConfig: KDPConfig) => {
    onChange({ ...config, ...kdpConfig });
  };

  const handleAddDifficultySection = () => {
    // Find a difficulty that's not already used
    const availableDifficulties: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];
    const usedDifficulties = config.difficultySections.map(section => section.difficulty);
    const unusedDifficulty = availableDifficulties.find(d => !usedDifficulties.includes(d)) || 'medium';
    
    onChange({
      ...config,
      difficultySections: [
        ...config.difficultySections,
        { difficulty: unusedDifficulty, count: 20 }
      ]
    });
  };

  const handleRemoveDifficultySection = (index: number) => {
    const newSections = [...config.difficultySections];
    newSections.splice(index, 1);
    onChange({
      ...config,
      difficultySections: newSections
    });
  };

  const handleUpdateDifficultySection = (index: number, key: keyof DifficultySection, value: any) => {
    const newSections = [...config.difficultySections];
    newSections[index] = { ...newSections[index], [key]: value };
    onChange({
      ...config,
      difficultySections: newSections
    });
  };

  // Calculate total puzzles for display
  const totalPuzzles = config.difficultyMix === 'multiple' 
    ? config.difficultySections.reduce((sum, section) => sum + section.count, 0)
    : config.numberOfPages;

  // Calculate total pages accounting for solutions
  const calculateTotalPageCount = () => {
    let pageCount = config.numberOfPages;
    
    if (config.includeSolutions) {
      switch (config.solutionPlacement) {
        case 'afterEach':
          pageCount *= 2; // Double the pages (puzzle + solution)
          break;
        case 'endOfLevel':
          if (config.difficultyMix === 'multiple') {
            // Add solution pages for each difficulty level
            pageCount += config.difficultySections.length;
          } else {
            // Add one section of solutions at the end
            pageCount += Math.ceil(pageCount / 2);
          }
          break;
        case 'endOfBook':
          // Add one page per puzzle for solutions
          pageCount += config.numberOfPages;
          break;
      }
    }
    
    return pageCount;
  };

  return (
    <div className="space-y-6 relative z-20">
      {/* Title Settings Card */}
      <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20 relative z-20">
        <div className="space-y-4 relative">
          <div className="flex items-center gap-2">
            <Type className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Book Title Settings</h2>
          </div>

          <div className="grid gap-4 relative">
            <div className="space-y-2">
              <Label className="text-base font-medium">Book Title</Label>
              <Input
                type="text"
                value={config.bookTitle}
                onChange={(e) => handleChange('bookTitle', e.target.value)}
                className="bg-background/70 text-foreground"
                placeholder="Enter book title"
              />
            </div>
            
            <div className="flex items-center justify-between p-2 bg-background/50 rounded-md">
              <Label className="text-base font-medium">Show Difficulty in Title</Label>
              <Switch
                checked={config.showDifficultyInTitle}
                onCheckedChange={(checked) =>
                  handleChange('showDifficultyInTitle', checked)
                }
              />
            </div>
            
            {config.showDifficultyInTitle && (
              <div className="p-3 bg-background/30 rounded-md border border-primary/10">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <p className="text-base font-medium text-foreground">
                  {config.bookTitle} 
                  {config.difficultyMix === 'single' 
                    ? ` - ${config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)}`
                    : ' - Multiple Difficulties'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Puzzle Numbering Settings Card */}
      <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20 relative z-20">
        <div className="space-y-4 relative">
          <div className="flex items-center gap-2">
            <Grid className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Puzzle Numbering</h2>
          </div>

          <div className="grid gap-4 relative">
            <div className="space-y-2">
              <Label className="text-base font-medium">Numbering Style</Label>
              <Select
                value={config.puzzleNumberingStyle}
                onValueChange={(value) => handleChange('puzzleNumberingStyle', value)}
              >
                <SelectTrigger className="bg-background/70">
                  <SelectValue placeholder="Select numbering style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequential">Sequential (1, 2, 3, ...)</SelectItem>
                  <SelectItem value="bySection">By Section (E1, E2, M1, M2, ...)</SelectItem>
                  <SelectItem value="customPrefix">Custom Prefix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.puzzleNumberingStyle === 'customPrefix' && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Puzzle Prefix</Label>
                <Input
                  type="text"
                  value={config.puzzleNumberingPrefix}
                  onChange={(e) => handleChange('puzzleNumberingPrefix', e.target.value)}
                  className="bg-background/70 text-foreground"
                  placeholder="e.g., Challenge, Game, etc."
                />
              </div>
            )}
            
            <div className="p-3 bg-background/30 rounded-md border border-primary/10">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <p className="text-base font-medium text-foreground">
                {config.puzzleNumberingStyle === 'sequential' && 'Puzzle 1, Puzzle 2, Puzzle 3, ...'}
                {config.puzzleNumberingStyle === 'bySection' && 'E1, E2, ... M1, M2, ... H1, H2, ...'}
                {config.puzzleNumberingStyle === 'customPrefix' && `${config.puzzleNumberingPrefix} 1, ${config.puzzleNumberingPrefix} 2, ...`}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid Styling Settings Card */}
      <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20 relative z-20">
        <div className="space-y-4 relative">
          <div className="flex items-center gap-2">
            <Grid className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Grid Styling</h2>
          </div>

          <div className="grid gap-4 relative">
            <div className="space-y-2">
              <Label className="text-base font-medium">Grid Style</Label>
              <Select
                value={config.gridStyle}
                onValueChange={(value) => handleChange('gridStyle', value)}
              >
                <SelectTrigger className="bg-background/70">
                  <SelectValue placeholder="Select grid style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic (Bold box lines)</SelectItem>
                  <SelectItem value="modern">Modern (Rounded corners)</SelectItem>
                  <SelectItem value="minimal">Minimal (Thin lines)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Grid Line Color</Label>
              <Select
                value={config.gridLineColor}
                onValueChange={(value) => handleChange('gridLineColor', value)}
              >
                <SelectTrigger className="bg-background/70">
                  <SelectValue placeholder="Select grid line color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="black">Black</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="dark-blue">Dark Blue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-2 bg-background/50 rounded-md">
              <Label className="text-base font-medium">Alternate Box Shading</Label>
              <Switch
                checked={config.alternateBoxShading}
                onCheckedChange={(checked) =>
                  handleChange('alternateBoxShading', checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Number Font</Label>
              <Select
                value={config.numberFont}
                onValueChange={(value) => handleChange('numberFont', value)}
              >
                <SelectTrigger className="bg-background/70">
                  <SelectValue placeholder="Select number font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans">Sans-serif</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="mono">Monospace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-3 bg-background/30 rounded-md border border-primary/10">
              <p className="text-sm text-muted-foreground mb-2">Style Preview:</p>
              <div className="w-full flex justify-center py-2">
                <div className={`w-16 h-16 border-2 ${
                  config.gridLineColor === 'black' ? 'border-black' : 
                  config.gridLineColor === 'gray' ? 'border-gray-500' : 
                  'border-blue-900'
                } ${
                  config.gridStyle === 'classic' ? 'border-2' : 
                  config.gridStyle === 'modern' ? 'rounded-md border' : 
                  'border'
                } ${
                  config.alternateBoxShading ? 'bg-gray-100' : 'bg-white'
                } flex items-center justify-center`}>
                  <span className={`text-lg ${
                    config.numberFont === 'sans' ? 'font-sans' : 
                    config.numberFont === 'serif' ? 'font-serif' : 
                    'font-mono'
                  }`}>
                    5
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modified KDP Settings */}
      <div className="relative">
        <KDPSettings 
          config={{
            ...config,
            // Disable numberOfPages input if in multiple difficulty mode
            numberOfPages: config.difficultyMix === 'multiple' ? config.numberOfPages : config.numberOfPages
          }} 
          onChange={newConfig => {
            // Only pass through numberOfPages changes if in single difficulty mode
            if (config.difficultyMix === 'single') {
              handleKDPChange(newConfig);
            } else {
              // For multiple difficulty mode, retain our calculated numberOfPages
              handleKDPChange({
                ...newConfig,
                numberOfPages: config.numberOfPages
              });
            }
          }}
        />
        
        {/* Show info about total pages for multiple difficulty mode */}
        {config.difficultyMix === 'multiple' && (
          <div className="absolute top-6 right-6 bg-primary/10 px-3 py-1.5 rounded-md text-sm text-primary font-medium border border-primary/20">
            {totalPuzzles} puzzles • {config.numberOfPages} pages
          </div>
        )}
      </div>

      <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20 relative z-20">
        <div className="space-y-4 relative">
          <div className="flex items-center gap-2">
            <Grid className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Sudoku Settings</h2>
          </div>

          <div className="grid gap-4 relative">
            <div className="space-y-2">
              <Label className="text-base font-medium">Grid Size</Label>
              <Select
                value={config.gridSize}
                onValueChange={(value: SudokuKDPConfig['gridSize']) =>
                  handleChange('gridSize', value)
                }
              >
                <SelectTrigger className="bg-background/70 text-foreground">
                  <SelectValue placeholder="Select grid size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9x9">9×9 (Standard)</SelectItem>
                  <SelectItem value="6x6">6×6 (Mini)</SelectItem>
                  <SelectItem value="4x4">4×4 (Kids)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Difficulty Selection</Label>
              <Select
                value={config.difficultyMix}
                onValueChange={(value: 'single' | 'multiple') => 
                  handleDifficultyMixChange(value)
                }
              >
                <SelectTrigger className="bg-background/70 text-foreground">
                  <SelectValue placeholder="Select difficulty selection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Difficulty</SelectItem>
                  <SelectItem value="multiple">Multiple Difficulties</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.difficultyMix === 'single' ? (
              <div className="space-y-2">
                <Label className="text-base font-medium">Difficulty Level</Label>
                <Select
                  value={config.difficulty}
                  onValueChange={(value: SudokuKDPConfig['difficulty']) =>
                    handleChange('difficulty', value)
                  }
                >
                  <SelectTrigger className="bg-background/70 text-foreground">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-4 border border-primary/20 rounded-md p-4 bg-background/50">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">Difficulty Mix</Label>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAddDifficultySection}
                    disabled={config.difficultySections.length >= 4}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Level
                  </Button>
                </div>
                
                {config.difficultySections.map((section, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 space-y-0 border-b border-dashed border-primary/10 pb-3 last:border-0"
                  >
                    <div className="w-1/2">
                      <Select
                        value={section.difficulty}
                        onValueChange={(value: DifficultyLevel) =>
                          handleUpdateDifficultySection(index, 'difficulty', value)
                        }
                      >
                        <SelectTrigger className="bg-background/70 text-foreground">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        min={1}
                        value={section.count}
                        onChange={(e) => handleUpdateDifficultySection(
                          index, 
                          'count', 
                          Math.max(1, parseInt(e.target.value) || 1)
                        )}
                        className="bg-background/70 text-foreground"
                      />
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleRemoveDifficultySection(index)}
                      disabled={config.difficultySections.length <= 1}
                      className="w-8 h-8"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                  <span>Total Puzzles: {totalPuzzles}</span>
                  <span>Total Pages: {calculateTotalPageCount()}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-base font-medium">Puzzles Per Page</Label>
              <Select
                value={config.puzzlesPerPage.toString()}
                onValueChange={(value) => {
                  console.log(`Setting puzzlesPerPage to ${value}`);
                  handleChange('puzzlesPerPage', parseInt(value));
                }}
              >
                <SelectTrigger className="bg-background/70 text-foreground">
                  <SelectValue placeholder="Select number of puzzles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Puzzle</SelectItem>
                  <SelectItem value="2">2 Puzzles (Stacked)</SelectItem>
                  <SelectItem value="4">4 Puzzles (2×2 Grid)</SelectItem>
                  <SelectItem value="9">9 Puzzles (3×3 Grid)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 p-3 bg-background/50 rounded-md">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Include Solutions</Label>
                <Switch
                  checked={config.includeSolutions}
                  onCheckedChange={(checked) =>
                    handleChange('includeSolutions', checked)
                  }
                />
              </div>

              {config.includeSolutions && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/10">
                  <Label className="text-base font-medium">Solution Placement</Label>
                  <Select
                    value={config.solutionPlacement}
                    onValueChange={(value: SolutionPlacement) =>
                      handleChange('solutionPlacement', value)
                    }
                  >
                    <SelectTrigger className="bg-background/70 text-foreground">
                      <SelectValue placeholder="Select solution placement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="afterEach">After Each Puzzle</SelectItem>
                      <SelectItem value="endOfLevel">End of Each Difficulty Level</SelectItem>
                      <SelectItem value="endOfBook">End of Book</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Include Hints</Label>
                <Switch
                  checked={config.includeHints}
                  onCheckedChange={(checked) =>
                    handleChange('includeHints', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Include Page Numbers</Label>
                <Switch
                  checked={config.includePageNumbers}
                  onCheckedChange={(checked) =>
                    handleChange('includePageNumbers', checked)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}; 