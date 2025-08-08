import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

const blogPosts = [
  {
    title: 'Getting Started with Print on Demand',
    excerpt: 'Learn how to start your print on demand business from scratch with our comprehensive guide.',
    date: '2024-03-15',
    category: 'Guides',
    readTime: '5 min read'
  },
  {
    title: 'Top 10 T-Shirt Design Trends for 2024',
    excerpt: 'Stay ahead of the competition with these trending t-shirt design ideas for the current year.',
    date: '2024-03-10',
    category: 'Design',
    readTime: '4 min read'
  },
  {
    title: 'How to Create Bestselling Puzzle Books',
    excerpt: 'Discover the secrets to creating puzzle books that sell consistently on Amazon KDP.',
    date: '2024-03-05',
    category: 'Tutorial',
    readTime: '7 min read'
  },
  {
    title: 'Maximizing Your POD Profits',
    excerpt: 'Learn strategies to increase your print on demand business revenue and optimize your operations.',
    date: '2024-03-01',
    category: 'Business',
    readTime: '6 min read'
  }
];

export const Blog = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-white/[0.02]" />

      <PageLayout
        title="Blog"
        description="Stay updated with the latest trends, tips, and tutorials in the print on demand industry."
      >
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 px-4 py-2 rounded-full">
            <Star className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">Insights from the team</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post, index) => (
            <Card key={index} className="group hover:border-primary/40 transition-colors overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6 relative">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span>{post.category}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                    <span>•</span>
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 flex-grow">
                    {post.excerpt}
                  </p>
                  <Button variant="ghost" className="w-fit group/btn">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    </div>
  );
}; 