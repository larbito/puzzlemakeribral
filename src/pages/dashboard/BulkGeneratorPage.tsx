import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Brain, Settings, Download, Grid, Search, Sparkles, BookOpen } from 'lucide-react';

interface BulkGeneratorSettings {
  puzzleTypes: ('sudoku' | 'crossword')[];
  quantity: number;
  difficulty: 'mixed' | 'easy' | 'medium' | 'hard';
  theme?: string;
  includeAnswers: boolean;
  includeTOC: boolean;
}

export const BulkGeneratorPage = () => {
  const [settings, setSettings] = useState<BulkGeneratorSettings>({
    puzzleTypes: ['sudoku'],
    quantity: 50,
    difficulty: 'mixed',
    includeAnswers: true,
    includeTOC: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  const handleGenerate = () => {
    setIsGenerating(true);
    // TODO: Implement bulk generation logic
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background relative overflow-hidden p-6">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-2 mb-6 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20"
          >
            <Brain className="w-8 h-8 text-primary animate-pulse" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
          >
            Bulk Generator
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground"
          >
            Generate multiple puzzles at once for your puzzle book
          </motion.p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="settings" className="text-lg">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Grid className="w-6 h-6 text-primary" />
                      Puzzle Types
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 rounded-lg bg-background/30">
                        <Grid className="w-5 h-5 text-blue-500" />
                        <div className="flex-1">
                          <p className="font-medium">Sudoku</p>
                          <p className="text-sm text-muted-foreground">Classic number puzzles</p>
                        </div>
                        <Switch
                          checked={settings.puzzleTypes.includes('sudoku')}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              puzzleTypes: checked
                                ? [...settings.puzzleTypes, 'sudoku']
                                : settings.puzzleTypes.filter((t) => t !== 'sudoku'),
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center gap-4 p-3 rounded-lg bg-background/30">
                        <Grid className="w-5 h-5 text-green-500" />
                        <div className="flex-1">
                          <p className="font-medium">Crossword</p>
                          <p className="text-sm text-muted-foreground">Word crossing puzzles</p>
                        </div>
                        <Switch
                          checked={settings.puzzleTypes.includes('crossword')}
                          onCheckedChange={(checked) =>
                            setSettings({
                              ...settings,
                              puzzleTypes: checked
                                ? [...settings.puzzleTypes, 'crossword']
                                : settings.puzzleTypes.filter((t) => t !== 'crossword'),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Settings className="w-6 h-6 text-primary" />
                      Generation Settings
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Number of Puzzles</Label>
                        <Input
                          type="number"
                          value={settings.quantity}
                          onChange={(e) =>
                            setSettings({ ...settings, quantity: parseInt(e.target.value) || 0 })
                          }
                          min={1}
                          max={100}
                          className="bg-background/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Difficulty Level</Label>
                        <Select
                          value={settings.difficulty}
                          onValueChange={(value: BulkGeneratorSettings['difficulty']) =>
                            setSettings({ ...settings, difficulty: value })
                          }
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mixed">Mixed Levels</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Theme (Optional)</Label>
                        <Input
                          value={settings.theme}
                          onChange={(e) =>
                            setSettings({ ...settings, theme: e.target.value })
                          }
                          placeholder="e.g., Animals, Sports, Space..."
                          className="bg-background/50"
                        />
                      </div>

                      <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                          <Label>Include Answer Keys</Label>
                          <Switch
                            checked={settings.includeAnswers}
                            onCheckedChange={(checked: boolean) =>
                              setSettings({ ...settings, includeAnswers: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Include Table of Contents</Label>
                          <Switch
                            checked={settings.includeTOC}
                            onCheckedChange={(checked: boolean) =>
                              setSettings({ ...settings, includeTOC: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-primary" />
                    Book Preview
                  </h2>
                  
                  <div className="aspect-[1/1.4] rounded-lg border border-primary/20 bg-background/20 flex items-center justify-center">
                    <p className="text-muted-foreground">Preview will appear here</p>
                  </div>

                  <Button 
                    className="w-full h-12 gap-2" 
                    onClick={handleGenerate}
                    disabled={isGenerating || settings.puzzleTypes.length === 0}
                  >
                    {isGenerating ? (
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    {isGenerating ? 'Generating Book...' : 'Generate & Download Book'}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}; 