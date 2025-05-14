import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
}

export const PageLayout = ({ title, description, children, actionButton }: PageLayoutProps) => {
  return (
    <div className="container mx-auto px-4 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  {title}
                </CardTitle>
                {description && (
                  <p className="text-muted-foreground mt-1">{description}</p>
                )}
              </div>
              {actionButton && <div>{actionButton}</div>}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {children}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}; 