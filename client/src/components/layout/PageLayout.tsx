import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const PageLayout = ({ title, description, children }: PageLayoutProps) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              {title}
            </CardTitle>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}; 