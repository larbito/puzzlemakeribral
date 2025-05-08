import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Grid, 
  Download, 
  Edit, 
  Trash2, 
  Plus,
  TrendingUp,
  Clock,
  Star,
  Filter,
  Search as SearchIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const puzzles = [
  {
    title: 'Sudoku Collection Vol. 1',
    type: 'Sudoku',
    difficulty: 'Medium',
    pages: 25,
    lastModified: 'May 5, 2024',
    status: 'completed',
    rating: 4.8,
    downloads: 156
  },
  {
    title: 'Word Search Bundle',
    type: 'Word Search',
    difficulty: 'Easy',
    pages: 15,
    lastModified: 'May 4, 2024',
    status: 'in-progress',
    rating: 4.5,
    downloads: 89
  },
  {
    title: 'Mixed Puzzle Pack',
    type: 'Mixed',
    difficulty: 'Hard',
    pages: 30,
    lastModified: 'May 3, 2024',
    status: 'completed',
    rating: 4.9,
    downloads: 234
  }
];

const MotionCard = motion(Card);

export const Puzzles = () => {
  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Puzzles</h2>
          <p className="text-muted-foreground">Manage and organize your puzzle collections</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search puzzles..."
              className="pl-9 pr-4 py-2 bg-white/5 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-[200px]"
            />
          </div>
          <Button variant="outline" className="bg-white/5 backdrop-blur-xl hover:bg-white/10">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            New Puzzle
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {puzzles.map((puzzle, index) => (
          <MotionCard
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="group relative overflow-hidden backdrop-blur-3xl border-primary/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/5 backdrop-blur-xl">
                    <Grid className="h-5 w-5 text-primary" />
                  </div>
                  {puzzle.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    {puzzle.rating}
                  </span>
                  <span>•</span>
                  <span>{puzzle.type}</span>
                  <span>•</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                    {puzzle.difficulty}
                  </span>
                  <span>•</span>
                  <span>{puzzle.pages} pages</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-white/5 backdrop-blur-xl hover:bg-white/10"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-white/5 backdrop-blur-xl hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      puzzle.status === 'completed' ? "bg-green-500" : "bg-amber-500"
                    )} />
                    <span className="text-muted-foreground capitalize">
                      {puzzle.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {puzzle.downloads} downloads
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last modified: {puzzle.lastModified}
                    </div>
                  </div>
                </div>

                <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: puzzle.status === 'completed' ? '100%' : '65%' }}
                    transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-green-500">
                  <TrendingUp className="h-4 w-4" />
                  +12% more downloads this week
                </div>
              </div>
            </CardContent>
          </MotionCard>
        ))}
      </div>
    </div>
  );
}; 