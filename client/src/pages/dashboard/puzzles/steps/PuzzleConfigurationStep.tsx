import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Slider 
} from '@/components/ui/slider';
import { 
  Grid3X3,
  ArrowRight,
  ArrowDown,
  ArrowDownRight,
  ArrowLeft
} from 'lucide-react';
import { WordSearchSettings } from '../WordSearch';

interface PuzzleConfigurationStepProps {
  settings: WordSearchSettings;
  onSettingChange: (key: keyof WordSearchSettings, value: any) => void;
}

export const PuzzleConfigurationStep: React.FC<PuzzleConfigurationStepProps> = ({
  settings,
  onSettingChange,
}) => {
  const handleDirectionChange = (direction: keyof typeof settings.directions) => {
    onSettingChange('directions', {
      ...settings.directions,
      [direction]: !settings.directions[direction]
    });
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Grid3X3 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Puzzle Configuration</h2>
        </div>

        <div className="space-y-8">
          {/* Grid Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Grid Settings</h3>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="gridSize">Grid Size</Label>
                <Select
                  value={String(settings.gridSize)}
                  onValueChange={(value) => onSettingChange('gridSize', parseInt(value))}
                >
                  <SelectTrigger id="gridSize" className="w-full">
                    <SelectValue placeholder="Select grid size" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="10">10 x 10 (Small)</SelectItem>
                    <SelectItem value="15">15 x 15 (Medium)</SelectItem>
                    <SelectItem value="20">20 x 20 (Large)</SelectItem>
                    <SelectItem value="25">25 x 25 (Extra Large)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Larger grid sizes allow for more and longer words
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wordsPerPuzzle">Words Per Puzzle</Label>
                <Select
                  value={String(settings.wordsPerPuzzle)}
                  onValueChange={(value) => onSettingChange('wordsPerPuzzle', parseInt(value))}
                >
                  <SelectTrigger id="wordsPerPuzzle" className="w-full">
                    <SelectValue placeholder="Select number of words" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="8">8 words</SelectItem>
                    <SelectItem value="10">10 words</SelectItem>
                    <SelectItem value="12">12 words</SelectItem>
                    <SelectItem value="15">15 words</SelectItem>
                    <SelectItem value="20">20 words</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Recommended: 10-15 words for medium difficulty
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={settings.difficulty}
                  onValueChange={(value) => onSettingChange('difficulty', value)}
                >
                  <SelectTrigger id="difficulty" className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="mixed">Mixed Levels</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Affects word placement complexity
                </p>
              </div>
            </div>
          </div>

          {/* Word Directions */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">Word Directions</h3>
            <Separator />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => handleDirectionChange('horizontal')}
                  >
                    <Checkbox
                      id="horizontal"
                      checked={settings.directions.horizontal}
                      onCheckedChange={() => handleDirectionChange('horizontal')}
                    />
                    <div className="flex items-center">
                      <span>Horizontal</span>
                      <ArrowRight className="h-4 w-4 ml-2 text-primary" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Words placed left to right
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => handleDirectionChange('vertical')}
                  >
                    <Checkbox
                      id="vertical"
                      checked={settings.directions.vertical}
                      onCheckedChange={() => handleDirectionChange('vertical')}
                    />
                    <div className="flex items-center">
                      <span>Vertical</span>
                      <ArrowDown className="h-4 w-4 ml-2 text-primary" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Words placed top to bottom
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => handleDirectionChange('diagonal')}
                  >
                    <Checkbox
                      id="diagonal"
                      checked={settings.directions.diagonal}
                      onCheckedChange={() => handleDirectionChange('diagonal')}
                    />
                    <div className="flex items-center">
                      <span>Diagonal</span>
                      <ArrowDownRight className="h-4 w-4 ml-2 text-primary" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Words placed diagonally
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="flex items-center space-x-2 cursor-pointer" 
                    onClick={() => handleDirectionChange('backward')}
                  >
                    <Checkbox
                      id="backward"
                      checked={settings.directions.backward}
                      onCheckedChange={() => handleDirectionChange('backward')}
                    />
                    <div className="flex items-center">
                      <span>Backward</span>
                      <ArrowLeft className="h-4 w-4 ml-2 text-primary" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Words placed in reverse
                </p>
              </div>
            </div>
          </div>

          {/* Difficulty Explanation */}
          <div className="bg-secondary/10 p-4 rounded-md mt-4">
            <h4 className="font-medium mb-2">Difficulty Level Explained</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="font-medium mr-2">Easy:</span>
                <span>Words placed only horizontally and vertically, ideal for younger solvers</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">Medium:</span>
                <span>Adds diagonal word placement for moderate challenge</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">Hard:</span>
                <span>Includes all directions including backward word placement</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">Mixed:</span>
                <span>Combines various difficulty levels throughout the book</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 