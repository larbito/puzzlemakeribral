import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Wand2, BookOpen, Palette, Shirt, Brain, Sparkles, Star } from 'lucide-react';

const features = [
  {
    title: 'AI-Powered Design',
    description: 'Create stunning designs with our advanced AI algorithms',
    icon: Wand2
  },
  {
    title: 'Book Cover Generator',
    description: 'Generate professional book covers in seconds',
    icon: BookOpen
  },
  {
    title: 'Coloring Pages',
    description: 'Create unique coloring pages for all ages',
    icon: Palette
  },
  {
    title: 'T-Shirt Designs',
    description: 'Design trendy t-shirts with ease',
    icon: Shirt
  },
  {
    title: 'Smart Templates',
    description: 'Access a library of pre-made templates',
    icon: Brain
  },
  {
    title: 'Custom Effects',
    description: 'Add special effects to your designs',
    icon: Sparkles
  }
];

export const Features = () => {
  return (
    <div className="relative">
      {/* Background accents */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-white/[0.02]" />

      <PageLayout
        title="Features"
        description="Discover all the powerful features that make PuzzleCraft the perfect tool for content creators."
      >
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 px-4 py-2 rounded-full">
            <Star className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">Everything you need to publish</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group relative overflow-hidden hover:border-primary/40 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    </div>
  );
}; 