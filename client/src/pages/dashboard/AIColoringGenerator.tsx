import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Sparkles, Download, BookOpen, Palette, Brain, ChevronDown } from 'lucide-react';

interface GeneratedBook {
  id: string;
  pages: string[];
  title: string;
}

export const AIColoringGenerator = () => {
  const [bookPrompt, setBookPrompt] = useState('');
  const [pageCount, setPageCount] = useState('24');
  const [ageRange, setAgeRange] = useState('');
  const [style, setStyle] = useState('');
  const [complexity, setComplexity] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBooks, setGeneratedBooks] = useState<GeneratedBook[]>([]);

  const handleGenerate = () => {
    if (!bookPrompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      const newBook = {
        id: Date.now().toString(),
        pages: Array(parseInt(pageCount)).fill('/placeholder-coloring-page.png'),
        title: bookPrompt
      };
      setGeneratedBooks(prev => [newBook, ...prev]);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Hero Section */}
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
            AI Coloring Book Creator
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground"
          >
            Transform your imagination into magical coloring adventures
          </motion.p>
        </div>

        {/* Creation Form */}
        <Card className="relative overflow-hidden border border-primary/20 bg-background/40 backdrop-blur-xl mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="relative p-8 space-y-8">
            {/* Book Prompt */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Book Theme & Story</Label>
              <Textarea
                value={bookPrompt}
                onChange={(e) => setBookPrompt(e.target.value)}
                placeholder="Describe your coloring book theme and story (e.g., 'A magical underwater kingdom where sea creatures live in crystal palaces...')"
                className="min-h-[120px] bg-background/50 border-primary/20 focus:border-primary/50 backdrop-blur-sm text-lg"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Page Count */}
              <div className="space-y-2">
                <Label className="text-base font-medium text-foreground/90">Number of Pages</Label>
                <Select value={pageCount} onValueChange={setPageCount}>
                  <SelectTrigger 
                    className="h-12 bg-background/50 border-primary/20 hover:border-primary/40 transition-colors rounded-xl"
                  >
                    <SelectValue placeholder="Select pages" />
                    <ChevronDown className="h-4 w-4 text-primary/60" />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-background/95 backdrop-blur-lg border-primary/20"
                    position="popper"
                    sideOffset={5}
                  >
                    <SelectItem value="24" className="focus:bg-primary/10 cursor-pointer">24 Pages</SelectItem>
                    <SelectItem value="32" className="focus:bg-primary/10 cursor-pointer">32 Pages</SelectItem>
                    <SelectItem value="48" className="focus:bg-primary/10 cursor-pointer">48 Pages</SelectItem>
                  </SelectContent>
                </Select>
                      </div>

              {/* Age Range */}
              <div className="space-y-2">
                <Label className="text-base font-medium text-foreground/90">Age Range</Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger 
                    className="h-12 bg-background/50 border-primary/20 hover:border-primary/40 transition-colors rounded-xl"
                  >
                    <SelectValue placeholder="Select age range" />
                    <ChevronDown className="h-4 w-4 text-primary/60" />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-background/95 backdrop-blur-lg border-primary/20"
                    position="popper"
                    sideOffset={5}
                  >
                    <SelectItem value="3-5" className="focus:bg-primary/10 cursor-pointer">3-5 years</SelectItem>
                    <SelectItem value="6-8" className="focus:bg-primary/10 cursor-pointer">6-8 years</SelectItem>
                    <SelectItem value="9-12" className="focus:bg-primary/10 cursor-pointer">9-12 years</SelectItem>
                  </SelectContent>
                </Select>
                    </div>

              {/* Style */}
              <div className="space-y-2">
                <Label className="text-base font-medium text-foreground/90">Art Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger 
                    className="h-12 bg-background/50 border-primary/20 hover:border-primary/40 transition-colors rounded-xl"
                  >
                    <SelectValue placeholder="Select style" />
                    <ChevronDown className="h-4 w-4 text-primary/60" />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-background/95 backdrop-blur-lg border-primary/20"
                    position="popper"
                    sideOffset={5}
                  >
                    <SelectItem value="cartoon" className="focus:bg-primary/10 cursor-pointer">Cartoon</SelectItem>
                    <SelectItem value="realistic" className="focus:bg-primary/10 cursor-pointer">Realistic</SelectItem>
                    <SelectItem value="manga" className="focus:bg-primary/10 cursor-pointer">Manga</SelectItem>
                    <SelectItem value="geometric" className="focus:bg-primary/10 cursor-pointer">Geometric</SelectItem>
                  </SelectContent>
                </Select>
                </div>

              {/* Complexity */}
              <div className="space-y-2">
                <Label className="text-base font-medium text-foreground/90">Complexity Level</Label>
                <Select value={complexity} onValueChange={setComplexity}>
                  <SelectTrigger 
                    className="h-12 bg-background/50 border-primary/20 hover:border-primary/40 transition-colors rounded-xl"
                    >
                    <SelectValue placeholder="Select complexity" />
                    <ChevronDown className="h-4 w-4 text-primary/60" />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-background/95 backdrop-blur-lg border-primary/20"
                    position="popper"
                    sideOffset={5}
                    >
                    <SelectItem value="simple" className="focus:bg-primary/10 cursor-pointer">Simple</SelectItem>
                    <SelectItem value="moderate" className="focus:bg-primary/10 cursor-pointer">Moderate</SelectItem>
                    <SelectItem value="complex" className="focus:bg-primary/10 cursor-pointer">Complex</SelectItem>
                  </SelectContent>
                </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
              disabled={!bookPrompt.trim() || isGenerating}
              className="w-full h-14 text-lg relative overflow-hidden group bg-primary/90 hover:bg-primary/80"
                >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              <span className="relative flex items-center justify-center gap-2">
                    {isGenerating ? (
                  <>
                    <Sparkles className="w-6 h-6 animate-pulse" />
                    Creating Your Coloring Book...
                  </>
                    ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    Generate Coloring Book
                  </>
                    )}
              </span>
                </Button>
          </div>
        </Card>

        {/* Generated Books */}
        {generatedBooks.map((book) => (
          <motion.div
            key={book.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
            >
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary/10 p-3 rounded-xl backdrop-blur-sm border border-primary/20">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">{book.title}</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {book.pages.map((page, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative aspect-[1/1.4] rounded-xl overflow-hidden bg-background/40 backdrop-blur-sm border border-primary/20"
                      >
                        <img
                    src={page}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <Button variant="secondary" className="w-full gap-2 backdrop-blur-sm">
                        <Download className="w-4 h-4" />
                        Download Page {index + 1}
                          </Button>
                    </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
          </motion.div>
        ))}

        {/* Empty State */}
        {generatedBooks.length === 0 && (
          <Card className="p-12 text-center bg-background/40 backdrop-blur-xl border border-primary/20">
            <Palette className="w-12 h-12 text-primary/60 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">
              Your magical coloring books will appear here
                    </p>
          </Card>
        )}
        </div>
    </div>
  );
}; 