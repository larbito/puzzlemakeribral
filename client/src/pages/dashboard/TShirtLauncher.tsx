import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, Layers, MessageSquare, ArrowLeft } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { TShirtGenerator } from './TShirtGenerator';

export const TShirtLauncher = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const handleSelectMode = (mode: string) => {
    setSelectedMode(mode);
  };

  const handleBack = () => {
    setSelectedMode(null);
  };

  // If a mode is selected, render the T-Shirt Generator with that mode
  if (selectedMode) {
    return (
      <PageLayout
        title="T-Shirt Design Creator"
        description="Create stunning t-shirt designs with AI."
        actionButton={
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" /> 
            Back to Selection
          </Button>
        }
      >
        <TShirtGenerator initialMode={selectedMode} />
      </PageLayout>
    );
  }

  // Otherwise show the mode selection
  return (
    <PageLayout
      title="T-Shirt Design Creator"
      description="Create stunning t-shirt designs with AI. Perfect for print-on-demand and merch."
    >
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prompt to Design Card */}
          <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => handleSelectMode('prompt')}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Prompt to Design
              </CardTitle>
              <CardDescription>
                Create designs from text descriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enter a text prompt describing your perfect t-shirt design, and our AI will generate it.
              </p>
              <Button className="w-full mt-4">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Image to Design Card */}
          <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => handleSelectMode('image')}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image to Design
              </CardTitle>
              <CardDescription>
                Convert your images into designs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload an image and our AI will analyze it to create a t-shirt design prompt.
              </p>
              <Button className="w-full mt-4">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Bulk Image to Designs Card */}
          <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => handleSelectMode('bulk')}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Bulk Image to Designs
              </CardTitle>
              <CardDescription>
                Process multiple images at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload up to 10 images at once and convert them all into t-shirt designs automatically.
              </p>
              <Button className="w-full mt-4">
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default TShirtLauncher; 