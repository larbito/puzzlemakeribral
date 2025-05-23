import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';

const ComingSoon = ({ title, description = "We're working hard to bring you this feature soon. Please check back later!" }) => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>
      
      <Card className="p-12 text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-primary/10 p-4 rounded-full">
            <Clock className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Coming Soon!</h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-8">
          {description}
        </p>
        
        <Button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default ComingSoon; 