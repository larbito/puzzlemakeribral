import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KDPBookSettings, BookContent } from '../KDPBookFormatter';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { generateBookHTML } from '@/templates/bookTemplate';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  FileDown, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Settings,
  FileText,
  InfoIcon
} from 'lucide-react';

interface ExportStepProps {
  settings: KDPBookSettings;
  bookContent: BookContent;
  formattedContent: string[];
}

export const ExportStep: React.FC<ExportStepProps> = ({
  settings,
  bookContent,
  formattedContent
}) => {
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [fileName, setFileName] = useState(`${bookContent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_kdp_ready.pdf`);
  const [embedFonts, setEmbedFonts] = useState(true);
  const [highQuality, setHighQuality] = useState(true);
  const { toast } = useToast();

  // Export to PDF using the shared template
  const exportToPDF = async () => {
    if (!bookContent.chapters.length) {
      toast({
        title: 'No content to export',
        description: 'Please make sure your book has content before exporting.'
      });
      return;
    }

    setExportStatus('processing');
    setErrorMessage('');
    
    try {
      console.log('Starting PDF export with shared template...');
      
      // Generate the same HTML that's used in preview
      const bookHTML = generateBookHTML(bookContent, settings);
      
      // Create a hidden iframe to render the HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '816px'; // Fixed width for rendering
      iframe.style.height = '1056px'; // Fixed height for rendering
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument!;
      iframeDoc.open();
      iframeDoc.write(bookHTML);
      iframeDoc.close();
      
      // Wait for fonts and images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get all pages from the iframe
      const pages = iframeDoc.querySelectorAll('.page');
      console.log(`Found ${pages.length} pages to render`);
      
      if (pages.length === 0) {
        throw new Error('No pages found to render');
      }
      
      // Get dimensions based on trim size
      const dimensions = getTrimSizeDimensions(settings.trimSize);
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [dimensions.width, dimensions.height],
        compress: highQuality,
        precision: 2
      });
      
      // Add metadata
      pdf.setProperties({
        title: bookContent.title,
        author: bookContent.metadata.author || '',
        subject: 'KDP Book',
        keywords: 'book, kindle, kdp',
        creator: 'KDP Book Formatter'
      });
      
      // Process each page
      for (let i = 0; i < pages.length; i++) {
        console.log(`Processing page ${i + 1}/${pages.length}`);
        
        // Add new page if not the first
        if (i > 0) {
          pdf.addPage();
        }
        
        // Render page to canvas
        const canvas = await html2canvas(pages[i] as HTMLElement, {
          scale: 2, // High quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 816, // Fixed dimensions
          height: 1056
        });
        
        // Convert to image and add to PDF
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, dimensions.width, dimensions.height);
        
        // Small delay to prevent browser freezing
        if (i % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Clean up
      document.body.removeChild(iframe);
      
      // Generate the PDF blob
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      setDownloadUrl(url);
      setExportStatus('complete');
      
      toast({
        title: 'Professional PDF Generated',
        description: `Your KDP-ready PDF has been generated with ${pages.length} pages.`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setExportStatus('error');
      setErrorMessage('There was a problem generating your PDF. Please try again.');
      
      toast({
        title: 'PDF Generation Failed',
        description: 'There was a problem generating your PDF. Please try again.'
      });
    }
  };

  // Download the generated PDF
  const downloadPDF = () => {
    if (!downloadUrl) return;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: 'Download Started',
      description: `Your PDF is downloading as "${fileName}".`
    });
  };

  // Get dimensions (in mm) based on trim size
  const getTrimSizeDimensions = (trimSize: string) => {
    switch (trimSize) {
      case '6x9':
        return { width: 152.4, height: 228.6 };
      case '5x8':
        return { width: 127, height: 203.2 };
      case '7x10':
        return { width: 177.8, height: 254 };
      case '8.5x11':
        return { width: 215.9, height: 279.4 };
      default:
        return { width: 152.4, height: 228.6 };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Export to PDF</h2>
        <p className="text-muted-foreground">
          Create a KDP-ready PDF using the professional template
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Settings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Export Settings</h3>
            </div>
            <Separator className="mb-4" />
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fileName">File Name</Label>
                <Input 
                  id="fileName"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="my_book.pdf"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">High Quality</Label>
                  <p className="text-sm text-muted-foreground">
                    Generate higher quality PDF (increases file size)
                  </p>
                </div>
                <Switch 
                  checked={highQuality}
                  onCheckedChange={setHighQuality}
                />
              </div>
              
              <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    <p className="font-medium">Professional Template Features</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Half-title and title pages</li>
                      <li>Copyright and blank pages</li>
                      <li>Table of contents (if multiple chapters)</li>
                      <li>Professional typography and spacing</li>
                      <li>KDP-compliant margins and formatting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Export Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Export Actions</h3>
            </div>
            <Separator className="mb-4" />
            
            <div className="space-y-6">
              {/* Status Messages */}
              {exportStatus === 'error' && (
                <div className="flex items-center gap-2 text-destructive p-3 rounded-md border border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{errorMessage || 'An error occurred during PDF generation.'}</p>
                </div>
              )}
              
              {exportStatus === 'complete' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 p-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">Your professional PDF has been generated successfully. Click download to save it.</p>
                </div>
              )}
              
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Book Details</h4>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Title</dt>
                    <dd className="font-medium truncate">{bookContent.title}</dd>
                    
                    <dt className="text-muted-foreground">Trim Size</dt>
                    <dd className="font-medium">{settings.trimSize} inches</dd>
                    
                    <dt className="text-muted-foreground">Chapters</dt>
                    <dd className="font-medium">{bookContent.chapters.length}</dd>
                    
                    <dt className="text-muted-foreground">Author</dt>
                    <dd className="font-medium">{bookContent.metadata.author || 'Not specified'}</dd>
                  </dl>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Button 
                    className="w-full flex items-center gap-2 h-12"
                    onClick={exportToPDF}
                    disabled={bookContent.chapters.length === 0 || exportStatus === 'processing'}
                  >
                    {exportStatus === 'processing' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        <span>Generate Professional PDF</span>
                      </>
                    )}
                  </Button>
                  
                  {exportStatus === 'complete' && (
                    <Button 
                      className="w-full flex items-center gap-2 h-12"
                      onClick={downloadPDF}
                      variant="outline"
                    >
                      <FileDown className="h-5 w-5" />
                      <span>Download PDF</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 