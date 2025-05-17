import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Book, Ruler, Palette, BookOpen, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KDPGuidelineProps {
  className?: string;
}

const KDPGuidelines: React.FC<KDPGuidelineProps> = ({ className }) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-base">Amazon KDP Guidelines</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="dimensions">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dimensions" className="text-xs">
              <Ruler className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Dimensions</span>
            </TabsTrigger>
            <TabsTrigger value="spine" className="text-xs">
              <Book className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Spine</span>
            </TabsTrigger>
            <TabsTrigger value="bleed" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Bleed</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Resolution</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dimensions" className="text-xs space-y-2 mt-3">
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">Trim Size</Badge>
              <p>KDP accepts specific trim sizes. Common sizes include 5" x 8", 5.5" x 8.5", 6" x 9", and 8.5" x 11".</p>
            </div>
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">Minimum Page Count</Badge>
              <p>Paperback books require a minimum of 24 pages, and hardcover books require at least 75 pages.</p>
            </div>
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">Maximum Page Count</Badge>
              <p>Maximum page count depends on trim size and paper type but is typically 828 pages for paperbacks.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="spine" className="text-xs space-y-2 mt-3">
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">Spine Width</Badge>
              <p>Spine width is automatically calculated based on page count and paper type:</p>
              <ul className="list-disc pl-4 mt-1">
                <li>White paper: # of pages × 0.002252" (pages/434)</li>
                <li>Cream paper: # of pages × 0.0025" (pages/400)</li>
                <li>Color paper: # of pages × 0.002347" (pages/426)</li>
              </ul>
            </div>
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">Spine Text</Badge>
              <p>Books with fewer than 100 pages cannot have spine text due to KDP's guidelines.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="bleed" className="text-xs space-y-2 mt-3">
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">Bleed Area</Badge>
              <p>KDP requires a 0.125" (3.2mm) bleed on all sides when you want content to extend to the edge of the page.</p>
            </div>
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">Margins</Badge>
              <p>Keep all important content at least 0.25" (6.4mm) from the trim line to ensure nothing important is cut off.</p>
            </div>
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">Safety Zone</Badge>
              <p>The generator shows safety zones to ensure your content will not be trimmed during the printing process.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="images" className="text-xs space-y-2 mt-3">
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">Resolution</Badge>
              <p>KDP requires 300 DPI for all images to ensure print quality. This generator automatically handles this requirement.</p>
            </div>
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">Color Space</Badge>
              <p>Use CMYK or RGB color space. KDP will convert RGB to CMYK during printing.</p>
            </div>
            <div>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 mb-2">File Format</Badge>
              <p>KDP accepts PDF files for cover uploads. This generator allows you to download your cover as a print-ready PDF.</p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex items-start gap-2 mt-3 text-xs">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-muted-foreground">See <a href="https://kdp.amazon.com/en_US/help/topic/G201857950" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Amazon's KDP Help Pages</a> for complete guidelines.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default KDPGuidelines; 