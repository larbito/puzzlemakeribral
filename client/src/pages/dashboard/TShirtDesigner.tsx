import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptToDesignTab } from '@/components/tshirt/PromptToDesignTab';
import { ImageToPromptTab } from '@/components/tshirt/ImageToPromptTab';
import { BulkImageTab } from '@/components/tshirt/BulkImageTab';
import { DesignHistoryPanel } from '@/components/tshirt/DesignHistoryPanel';
import { Shirt, Sparkles, Image, Download, AlertCircle } from 'lucide-react';

export const TShirtDesigner = () => {
  const [activeTab, setActiveTab] = useState('prompt');

  // Debug logs to verify component rendering
  console.log('TShirtDesigner component rendered');
  console.log('Current active tab:', activeTab);

  return (
    <PageLayout
      title="Design Killer T-Shirts with AI"
      description="Generate, enhance, and export stunning t-shirt art with smart background removal and optimized flow. Perfect for POD platforms like Merch by Amazon."
    >
      {/* Wrapper with high z-index to ensure all elements receive interactions */}
      <div className="relative z-[100]" style={{ pointerEvents: 'auto' }}>
        <div className="container mx-auto px-4 max-w-7xl space-y-8">
          {/* Step Bar Component - Static UI for explanation only */}
          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
            <div className="flex flex-col items-center text-primary font-bold">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-sm text-center">Step 1: Generate Prompt-Based Image</span>
            </div>
            <div className="h-[2px] flex-1 mx-2 bg-primary/60"></div>
            <div className="flex flex-col items-center text-primary font-bold">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-primary text-primary-foreground">
                <Image className="h-5 w-5" />
              </div>
              <span className="text-sm text-center">Step 2: Enhance or Remove Background</span>
            </div>
            <div className="h-[2px] flex-1 mx-2 bg-primary/60"></div>
            <div className="flex flex-col items-center text-primary font-bold">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-primary text-primary-foreground">
                <Download className="h-5 w-5" />
              </div>
              <span className="text-sm text-center">Step 3: Export Ready-to-Upload File</span>
            </div>
          </div>
          
          {/* Tips for Best Results */}
          <div className="bg-muted/20 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium text-lg mb-2">Tips for Best Results</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Start by removing the background before applying enhancement. This gives better edge clarity and color correction.</li>
                  <li>For background removal, image complexity matters. You'll need to try different models manually to see which one gives the cleanest result. Some designs may work better with one model than another.</li>
                  <li>When using Bulk Mode, let the system generate prompts first. Then start generating images one by one with short delays to avoid performance issues.</li>
                </ul>
              </div>
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