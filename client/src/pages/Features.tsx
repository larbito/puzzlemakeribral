import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Wand2, BookOpen, Palette, Shirt, Brain, Sparkles } from 'lucide-react';

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
    <PageLayout
      title="Features"
      description="Discover all the powerful features that make PuzzleCraft the perfect tool for content creators."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="group hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
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
  );
}; 