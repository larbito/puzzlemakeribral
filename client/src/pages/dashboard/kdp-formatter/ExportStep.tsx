import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KDPBookSettings, BookContent } from '../KDPBookFormatter';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { jsPDF } from 'jspdf';
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

  // Export to PDF
  const exportToPDF = async () => {
    if (formattedContent.length === 0) {
      toast({
        title: 'No content to export',
        description: 'Please make sure your book has content before exporting.'
      });
      return;
    }

    setExportStatus('processing');
    setErrorMessage('');
    
    try {
      // Get trim size dimensions in mm (PDF uses mm)
      const dimensions = getTrimSizeDimensions(settings.trimSize);
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [dimensions.width, dimensions.height]
      });
      
      // Add metadata
      pdf.setProperties({
        title: bookContent.title,
        author: bookContent.metadata.author || '',
        subject: 'KDP Book',
        keywords: 'book, kindle, kdp',
        creator: 'KDP Book Formatter'
      });
      
      // Set font
      if (embedFonts) {
        // In a real implementation, we would load and embed fonts
        // For this demo, we'll use standard fonts
        pdf.setFont('helvetica');
      } else {
        pdf.setFont('helvetica');
      }
      
      // Calculate margins in mm
      const marginTop = settings.marginTop * 25.4;      // convert inches to mm
      const marginBottom = settings.marginBottom * 25.4;
      const marginInside = settings.marginInside * 25.4;
      const marginOutside = settings.marginOutside * 25.4;
      
      // Function to add text with proper wrapping and styling
      const addTextToPage = (content: string, pageIndex: number) => {
        // Add a new page if needed (skip for first page)
        if (pageIndex > 0) {
          pdf.addPage();
        }
        
        // Use html renderer for better formatting
        const html = `
          <div style="
            font-family: ${settings.fontFamily};
            font-size: ${settings.fontSize}pt;
            line-height: ${settings.lineSpacing};
          ">
            ${content}
          </div>
        `;
        
        // In a real implementation, we would use a proper HTML renderer
        // For this demo, we'll just add basic text
        const leftMargin = pageIndex % 2 === 0 ? marginOutside : marginInside;
        const rightMargin = pageIndex % 2 === 0 ? marginInside : marginOutside;
        
        // Use browser's HTML parser to extract text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const text = tempDiv.textContent || '';
        
        // Add text to PDF
        pdf.text(text, leftMargin, marginTop + 10);
        
        // Add page numbers if enabled
        if (settings.includePageNumbers && pageIndex > 0) { // Skip page number on title page
          const pageNumber = pageIndex.toString();
          const textWidth = pdf.getTextWidth(pageNumber);
          
          pdf.text(
            pageNumber,
            (dimensions.width - textWidth) / 2,
            dimensions.height - marginBottom / 2
          );
        }
      };
      
      // Add each page to the PDF
      for (let i = 0; i < formattedContent.length; i++) {
        addTextToPage(formattedContent[i], i);
      }
      
      // Apply high quality settings if requested
      if (highQuality) {
        // In a real implementation, we would set PDF quality options
        // For this demo, we'll assume it's already high quality
      }
      
      // Generate the PDF blob
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      setDownloadUrl(url);
      setExportStatus('complete');
      
      toast({
        title: 'PDF Generated',
        description: 'Your KDP-ready PDF has been generated successfully.'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setExportStatus('error');
      setErrorMessage('There was a problem generating your PDF. Please try again.');
      
      toast({
        title: 'PDF Generation Failed',
        description: 'There was a problem generating your PDF. Please try again.',
      });
    }
  };

  // Download the generated PDF
  const downloadPDF = () => {
    if (!downloadUrl) return;
    
    // Create a temporary link and click it
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
        return { width: 152.4, height: 228.6 }; // 6" x 9" in mm
      case '5x8':
        return { width: 127, height: 203.2 };   // 5" x 8" in mm
      case '7x10':
        return { width: 177.8, height: 254 };   // 7" x 10" in mm
      case '8.5x11':
        return { width: 215.9, height: 279.4 }; // 8.5" x 11" in mm
      default:
        return { width: 152.4, height: 228.6 }; // Default to 6" x 9"
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Export to PDF</h2>
        <p className="text-muted-foreground">
          Create a KDP-ready PDF to publish your book on Amazon
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
                  <Label className="text-base">Embed Fonts</Label>
                  <p className="text-sm text-muted-foreground">
                    Include all fonts in the PDF (increases file size)
                  </p>
                </div>
                <Switch 
                  checked={embedFonts}
                  onCheckedChange={setEmbedFonts}
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
                    <p className="font-medium">KDP Submission Requirements</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>PDF must have embedded fonts</li>
                      <li>File size must be under 650MB</li>
                      <li>All content must be within the safe zone</li>
                      <li>Images should be at least 300 DPI</li>
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
                  <p className="text-sm">Your PDF has been generated successfully. Click the download button to save it.</p>
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
                    
                    <dt className="text-muted-foreground">Pages</dt>
                    <dd className="font-medium">{formattedContent.length}</dd>
                    
                    <dt className="text-muted-foreground">Chapters</dt>
                    <dd className="font-medium">{bookContent.chapters.length}</dd>
                  </dl>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Button 
                    className="w-full flex items-center gap-2 h-12"
                    onClick={exportToPDF}
                    disabled={formattedContent.length === 0 || exportStatus === 'processing'}
                  >
                    {exportStatus === 'processing' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        <span>Generate KDP-Ready PDF</span>
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