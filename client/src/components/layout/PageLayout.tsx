import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

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
          {/* Custom Header with dramatic styling */}
          <div className="bg-black border-b border-zinc-800 rounded-t-lg overflow-hidden">
            <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pt-10 pb-8 px-8">
              <div className={`flex ${actionButton ? 'justify-between' : 'justify-center'} items-center`}>
                <div className="text-center">
                  <h1 className="text-5xl font-extrabold tracking-tight mb-3">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                      {title}
                    </span>
                  </h1>
                  {description && (
                    <p className="text-zinc-400 text-lg max-w-3xl mx-auto">
                      {description}
                    </p>
                  )}
                </div>
                {actionButton && <div>{actionButton}</div>}
              </div>
            </div>
          </div>
          
          <CardContent className="pt-6">
            {children}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}; 