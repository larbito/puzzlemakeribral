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

  // Debug logs to verify component rendering
  console.log('TShirtDesigner component rendered');
  console.log('Current active tab:', activeTab);

  return (
    <PageLayout
      title="T-Shirt Design Creator"
      description="Create professional t-shirt designs using AI for print-on-demand platforms like Merch by Amazon."
    >
      {/* Wrapper with high z-index to ensure all elements receive interactions */}
      <div className="relative z-[100]" style={{ pointerEvents: 'auto' }}>
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
              onValueChange={(value) => {
                console.log('Tab changed to:', value);
                setActiveTab(value);
              }}
              className="w-full relative z-[101]"
            >
              <TabsList className="w-full rounded-none border-b bg-muted/50 p-0">
                <TabsTrigger 
                  value="prompt" 
                  className="flex-1 rounded-none border-r data-[state=active]:bg-background relative z-[102]"
                  onClick={() => console.log('Prompt tab clicked')}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Prompt to Design
                </TabsTrigger>
                <TabsTrigger 
                  value="image" 
                  className="flex-1 rounded-none border-r data-[state=active]:bg-background relative z-[102]"
                  onClick={() => console.log('Image tab clicked')}
                >
                  Image to Prompt
                </TabsTrigger>
                <TabsTrigger 
                  value="bulk" 
                  className="flex-1 rounded-none data-[state=active]:bg-background relative z-[102]"
                  onClick={() => console.log('Bulk tab clicked')}
                >
                  Bulk Images
                </TabsTrigger>
              </TabsList>
              
              {/* Section 2: Active Design Mode */}
              <div className="p-6 relative z-[101]">
                <TabsContent value="prompt" className="m-0 pt-0 relative z-[102]">
                  <PromptToDesignTab />
                </TabsContent>
                
                <TabsContent value="image" className="m-0 pt-0 relative z-[102]">
                  <ImageToPromptTab />
                </TabsContent>
                
                <TabsContent value="bulk" className="m-0 pt-0 relative z-[102]">
                  <BulkImageTab />
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          {/* Section 4: Design History with proper spacing */}
          <div className="bg-card rounded-lg border shadow-sm relative z-[101]">
            <DesignHistoryPanel />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default TShirtDesigner; 