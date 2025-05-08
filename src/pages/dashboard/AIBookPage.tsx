import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Settings, Download, BookOpen, Wand2, Target, Brain, Palette } from 'lucide-react';

interface AIBookSettings {
  title: string;
  description: string;
  targetAge: 'kids' | 'teens' | 'adults' | 'seniors';
  theme: string;
  style: 'modern' | 'classic' | 'playful' | 'elegant';
  pageCount: number;
  puzzleTypes: ('sudoku' | 'wordSearch' | 'crossword')[];
  includeIntroduction: boolean;
  includeAnswers: boolean;
  includeTOC: boolean;
}

export const AIBookPage = () => {
  const [settings, setSettings] = useState<AIBookSettings>({
    title: '',
    description: '',
    targetAge: 'adults',
    theme: '',
    style: 'modern',
    pageCount: 50,
    puzzleTypes: ['sudoku', 'wordSearch'],
    includeIntroduction: true,
    includeAnswers: true,
    includeTOC: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  const handleGenerate = () => {
    setIsGenerating(true);
    // TODO: Implement AI book generation logic
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
            <Wand2 className="w-8 h-8 text-primary animate-pulse" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
          >
            AI Book Creator
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground"
          >
            Let AI design your complete puzzle book
          </motion.p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="content" className="text-lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger value="style" className="text-lg">
                <Palette className="w-5 h-5 mr-2" />
                Style
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-lg">
                <Brain className="w-5 h-5 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-primary" />
                      Book Details
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Book Title</Label>
                        <Input
                          value={settings.title}
                          onChange={(e) =>
                            setSettings({ ...settings, title: e.target.value })
                          }
                          placeholder="e.g., Ultimate Puzzle Collection"
                          className="bg-background/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={settings.description}
                          onChange={(e) =>
                            setSettings({ ...settings, description: e.target.value })
                          }
                          placeholder="Describe your puzzle book's content and goals..."
                          className="bg-background/50 min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Target Age Group</Label>
                        <Select
                          value={settings.targetAge}
                          onValueChange={(value: AIBookSettings['targetAge']) =>
                            setSettings({ ...settings, targetAge: value })
                          }
                        >
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select target age" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kids">Kids (6-12)</SelectItem>
                            <SelectItem value="teens">Teens (13-17)</SelectItem>
                            <SelectItem value="adults">Adults (18+)</SelectItem>
                            <SelectItem value="seniors">Seniors (60+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <Input
                          value={settings.theme}
                          onChange={(e) =>
                            setSettings({ ...settings, theme: e.target.value })
                          }
                          placeholder="e.g., Ocean Life, Space Adventure..."
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <Settings className="w-6 h-6 text-primary" />
                      Book Settings
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Page Count</Label>
                        <Input
                          type="number"
                          value={settings.pageCount}
                          onChange={(e) =>
                            setSettings({ ...settings, pageCount: parseInt(e.target.value) || 0 })
                          }
                          min={10}
                          max={200}
                          className="bg-background/50"
                        />
                      </div>

                      <div className="space-y-4">
                        <Label>Puzzle Types</Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 p-3 rounded-lg bg-background/30">
                            <Target className="w-5 h-5 text-blue-500" />
                            <div className="flex-1">
                              <p className="font-medium">Sudoku</p>
                              <p className="text-sm text-muted-foreground">Number puzzles</p>
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
                            <Target className="w-5 h-5 text-purple-500" />
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
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="style">
              <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Palette className="w-6 h-6 text-primary" />
                    Book Style
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        value: 'modern',
                        title: 'Modern',
                        description: 'Clean and minimalist design',
                        icon: <Sparkles className="w-8 h-8 text-blue-500" />,
                      },
                      {
                        value: 'classic',
                        title: 'Classic',
                        description: 'Traditional and timeless',
                        icon: <BookOpen className="w-8 h-8 text-amber-500" />,
                      },
                      {
                        value: 'playful',
                        title: 'Playful',
                        description: 'Fun and engaging layout',
                        icon: <Wand2 className="w-8 h-8 text-purple-500" />,
                      },
                      {
                        value: 'elegant',
                        title: 'Elegant',
                        description: 'Sophisticated and refined',
                        icon: <Brain className="w-8 h-8 text-green-500" />,
                      },
                    ].map((style) => (
                      <div
                        key={style.value}
                        className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                          settings.style === style.value
                            ? 'border-primary bg-primary/10'
                            : 'border-primary/20 hover:border-primary/40 bg-background/30'
                        }`}
                        onClick={() => setSettings({ ...settings, style: style.value as AIBookSettings['style'] })}
                      >
                        <div className="flex flex-col items-center text-center gap-4">
                          {style.icon}
                          <div>
                            <h3 className="text-lg font-semibold">{style.title}</h3>
                            <p className="text-sm text-muted-foreground">{style.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                      <Label>Include Introduction</Label>
                      <Switch
                        checked={settings.includeIntroduction}
                        onCheckedChange={(checked: boolean) =>
                          setSettings({ ...settings, includeIntroduction: checked })
                        }
                      />
                    </div>

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
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <Brain className="w-6 h-6 text-primary" />
                    Book Preview
                  </h2>
                  
                  <div className="aspect-[1/1.4] rounded-lg border border-primary/20 bg-background/20 flex items-center justify-center">
                    <p className="text-muted-foreground">Book preview will appear here</p>
                  </div>

                  <Button 
                    className="w-full h-12 gap-2" 
                    onClick={handleGenerate}
                    disabled={isGenerating || !settings.title || settings.puzzleTypes.length === 0}
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