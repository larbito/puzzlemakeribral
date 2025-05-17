import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import KDPFuturisticGenerator from '@/pages/generators/KDPFuturisticGenerator';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, CheckCircle2, Sparkles, FileType, ImageIcon } from 'lucide-react';

const BookCoverGenerator = () => {
  const features = [
    { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: "Full KDP wrap-ready export (PDF + PNG)" },
    { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: "Image-to-Prompt → Prompt-to-Image for front cover" },
    { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: "Back cover prompt generated from front prompt" },
    { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: "Spine color selection via extracted palette" },
    { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: "Interior image integration (optional)" },
    { icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, text: "Safe zone compliance for KDP requirements" }
  ];

  return (
    <PageLayout
      title="Book Cover Generator"
      description="Create professional Amazon KDP-compliant book covers with AI"
    >
      {/* Feature highlight section */}
      <div className="mb-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600/20 to-green-600/20">
            <BookOpen className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Book Cover Generator
            </h1>
            <p className="text-muted-foreground">
              AI-powered tool to create professional, KDP-compliant full wrap book covers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-emerald-950/20 border-emerald-900/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-sm">
                <p className="font-medium">AI-Generated</p>
                <p className="text-muted-foreground">Prompt-to-image technology</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-950/20 border-emerald-900/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <FileType className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-sm">
                <p className="font-medium">KDP Ready</p>
                <p className="text-muted-foreground">Export in PDF or PNG format</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-950/20 border-emerald-900/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <ImageIcon className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-sm">
                <p className="font-medium">Full Wrap</p>
                <p className="text-muted-foreground">Front, back cover and spine</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-medium mb-3 text-emerald-400">Key Features</h2>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  {feature.icon}
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-3 text-emerald-400">KDP Guidelines</h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Trim sizes must match Amazon KDP standards</p>
              <p>• Spine width is calculated based on page count and paper type</p>
              <p>• Covers with less than 100 pages cannot have spine text</p>
              <p>• Safe zones ensure no important elements are trimmed</p>
              <p>• Resolution must be 300 DPI for high-quality printing</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main generator component */}
      <KDPFuturisticGenerator />
    </PageLayout>
  );
};

export default BookCoverGenerator; 