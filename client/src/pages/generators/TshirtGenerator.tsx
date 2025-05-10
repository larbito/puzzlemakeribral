import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout } from '@/components/layout/PageLayout';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { Gallery } from '@/components/shared/Gallery';

interface GeneratedDesign {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: Date;
}

export default function TshirtGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [designs, setDesigns] = useState<GeneratedDesign[]>([]);

  const handleImageUpload = async (file: File) => {
    try {
      // TODO: Implement image-to-prompt conversion
      console.log('Processing uploaded image:', file);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      // TODO: Implement prompt-to-image generation
      console.log('Generating from prompt:', prompt);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PageLayout title="T-shirt Design Generator">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-6">T-shirt Design Generator</h1>
        <p className="text-gray-600 mb-8">
          Create unique t-shirt designs using AI. Upload an image to get design suggestions
          or enter a prompt to generate new designs.
        </p>

        <Tabs defaultValue="prompt" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prompt">Generate from Prompt</TabsTrigger>
            <TabsTrigger value="image">Generate from Image</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt">
            <Card className="p-6">
              <form onSubmit={handlePromptSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="prompt" className="text-sm font-medium">
                    Enter your design prompt
                  </label>
                  <Input
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your t-shirt design..."
                    className="w-full"
                  />
                </div>
                <Button type="submit" disabled={isGenerating || !prompt}>
                  {isGenerating ? 'Generating...' : 'Generate Design'}
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="image">
            <Card className="p-6">
              <ImageUpload onUpload={handleImageUpload} />
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Generated Designs</h2>
          <Gallery items={designs} />
        </div>
      </div>
    </PageLayout>
  );
} 