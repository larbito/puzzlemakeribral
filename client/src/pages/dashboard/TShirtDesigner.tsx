import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptToDesignTab } from '@/components/tshirt/PromptToDesignTab';
import { ImageToPromptTab } from '@/components/tshirt/ImageToPromptTab';
import { BulkImageTab } from '@/components/tshirt/BulkImageTab';
import { DesignHistoryPanel } from '@/components/tshirt/DesignHistoryPanel';
import { Shirt, Sparkles } from 'lucide-react';

export const TShirtDesigner = () => {
  const [activeTab, setActiveTab] = useState('prompt');

  return (
    <PageLayout
      title="T-Shirt Design Creator"
      description="Create professional t-shirt designs using AI for print-on-demand platforms like Merch by Amazon."
    >
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        {/* Hero section with icon */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shirt className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">T-Shirt Design Creator</h1>
            <p className="text-muted-foreground">Create professional designs for print-on-demand platforms</p>
          </div>
        </div>
        
        {/* Main content with better spacing */}
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          {/* Section 1: Mode Selector */}
          <Tabs 
            defaultValue="prompt" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full rounded-none border-b bg-muted/50 p-0">
              <TabsTrigger 
                value="prompt" 
                className="flex-1 rounded-none border-r data-[state=active]:bg-background"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Prompt to Design
              </TabsTrigger>
              <TabsTrigger 
                value="image" 
                className="flex-1 rounded-none border-r data-[state=active]:bg-background"
              >
                Image to Prompt
              </TabsTrigger>
              <TabsTrigger 
                value="bulk" 
                className="flex-1 rounded-none data-[state=active]:bg-background"
              >
                Bulk Images
              </TabsTrigger>
            </TabsList>
            
            {/* Section 2: Active Design Mode */}
            <div className="p-6">
              <TabsContent value="prompt" className="m-0 pt-0">
                <PromptToDesignTab />
              </TabsContent>
              
              <TabsContent value="image" className="m-0 pt-0">
                <ImageToPromptTab />
              </TabsContent>
              
              <TabsContent value="bulk" className="m-0 pt-0">
                <BulkImageTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Section 4: Design History with proper spacing */}
        <div className="bg-card rounded-lg border shadow-sm">
          <DesignHistoryPanel />
        </div>
      </div>
    </PageLayout>
  );
};

export default TShirtDesigner; 