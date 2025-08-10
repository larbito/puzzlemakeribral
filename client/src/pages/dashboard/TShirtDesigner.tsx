import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptToDesignTab } from '@/components/tshirt/PromptToDesignTab';
import { ImageToPromptTab } from '@/components/tshirt/ImageToPromptTab';
import { BulkImageTab } from '@/components/tshirt/BulkImageTab';
import { DesignHistoryPanel } from '@/components/tshirt/DesignHistoryPanel';
import { Shirt, Sparkles, Image, Download, AlertCircle, Lightbulb, Check } from 'lucide-react';

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
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-background/40 backdrop-blur-xl p-6 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2 border-emerald-500 bg-black">
                  <Sparkles className="h-6 w-6 text-emerald-500" />
                </div>
                <span className="text-emerald-500 font-medium text-center">Step 1: Generate Prompt-Based Image</span>
              </div>
              
              <div className="h-0.5 flex-1 mx-4 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2 border-teal-500 bg-black">
                  <Image className="h-6 w-6 text-teal-500" />
                </div>
                <span className="text-teal-500 font-medium text-center">Step 2: Enhance or Remove Background</span>
              </div>
              
              <div className="h-0.5 flex-1 mx-4 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2 border-cyan-500 bg-black">
                  <Download className="h-6 w-6 text-cyan-500" />
                </div>
                <span className="text-cyan-500 font-medium text-center">Step 3: Export Ready-to-Upload File</span>
              </div>
            </div>
          </div>
          
          {/* Tips for Best Results */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-background/40 backdrop-blur-xl p-6 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/20 border border-amber-500/50">
                <Lightbulb className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-amber-400">Tips for Best Results</h3>
            </div>
            
            <div className="space-y-4 pl-2">
              <div className="flex items-start gap-3 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                <Check className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-100/80">Start by removing the background before applying enhancement. This gives better edge clarity and color correction.</p>
              </div>
              
              <div className="flex items-start gap-3 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                <Check className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-100/80">For background removal, image complexity matters. You'll need to try different models manually to see which one gives the cleanest result. Some designs may work better with one model than another.</p>
              </div>
              
              <div className="flex items-start gap-3 bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                <Check className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-100/80">When using Bulk Mode, let the system generate prompts first. Then start generating images one by one with short delays to avoid performance issues.</p>
              </div>
            </div>
          </div>
          
          {/* Main content with better spacing */}
          <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-background/40 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
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
          <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-background/40 backdrop-blur-xl z-[101]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <DesignHistoryPanel />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default TShirtDesigner; 