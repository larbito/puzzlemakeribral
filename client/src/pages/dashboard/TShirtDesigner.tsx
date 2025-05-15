import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptToDesignTab } from '@/components/tshirt/PromptToDesignTab';
import { ImageToPromptTab } from '@/components/tshirt/ImageToPromptTab';
import { BulkImageTab } from '@/components/tshirt/BulkImageTab';
import { DesignHistoryPanel } from '@/components/tshirt/DesignHistoryPanel';

export const TShirtDesigner = () => {
  const [activeTab, setActiveTab] = useState('prompt');

  return (
    <PageLayout
      title="T-Shirt Design Creator"
      description="Create professional t-shirt designs using AI for print-on-demand platforms like Merch by Amazon."
    >
      <div className="space-y-6">
        {/* Section 1: Mode Selector */}
        <Tabs 
          defaultValue="prompt" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="prompt">Prompt to Design</TabsTrigger>
            <TabsTrigger value="image">Image to Prompt</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Images</TabsTrigger>
          </TabsList>
          
          {/* Section 2: Active Design Mode */}
          <TabsContent value="prompt">
            <PromptToDesignTab />
          </TabsContent>
          
          <TabsContent value="image">
            <ImageToPromptTab />
          </TabsContent>
          
          <TabsContent value="bulk">
            <BulkImageTab />
          </TabsContent>
        </Tabs>
        
        {/* Section 4: Design History */}
        <DesignHistoryPanel />
      </div>
    </PageLayout>
  );
};

export default TShirtDesigner; 