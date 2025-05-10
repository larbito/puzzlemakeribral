import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const templates = [
  {
    title: 'Puzzle Book Template',
    description: 'Professional puzzle book layout with customizable sections',
    image: '/templates/puzzle-book.jpg',
    category: 'Books'
  },
  {
    title: 'Coloring Book Template',
    description: 'Beautiful coloring book template with various themes',
    image: '/templates/coloring-book.jpg',
    category: 'Books'
  },
  {
    title: 'T-Shirt Design Template',
    description: 'Modern t-shirt design template with trending styles',
    image: '/templates/t-shirt.jpg',
    category: 'Apparel'
  },
  {
    title: 'Book Cover Template',
    description: 'Eye-catching book cover templates for different genres',
    image: '/templates/book-cover.jpg',
    category: 'Books'
  },
  {
    title: 'Activity Book Template',
    description: 'Interactive activity book template for children',
    image: '/templates/activity-book.jpg',
    category: 'Books'
  },
  {
    title: 'Merchandise Bundle',
    description: 'Complete merchandise template pack for your brand',
    image: '/templates/merch-bundle.jpg',
    category: 'Apparel'
  }
];

export const Templates = () => {
  return (
    <PageLayout
      title="Templates"
      description="Start with our professionally designed templates to create your products faster."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, index) => (
          <Card key={index} className="group overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-primary/10 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-primary/50">Preview Image</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{template.title}</h3>
                    <p className="text-sm text-muted-foreground">{template.category}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Use
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}; 