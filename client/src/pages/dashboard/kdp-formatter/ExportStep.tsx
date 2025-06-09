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

  // Export to PDF with better HTML rendering
  const exportToPDF = async () => {
    console.log('Starting PDF export...');
    console.log('Formatted content length:', formattedContent.length);
    console.log('Book content chapters:', bookContent.chapters.length);
    
    if (formattedContent.length === 0) {
      console.log('No formatted content available');
      
      // If no formatted content but we have chapters, create simple content
      if (bookContent.chapters.length > 0) {
        console.log('Creating simple PDF from chapters...');
        await createSimplePDF();
        return;
      }
      
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
        format: [dimensions.width, dimensions.height],
        compress: highQuality
      });
      
      // Add metadata
      pdf.setProperties({
        title: bookContent.title,
        author: bookContent.metadata.author || '',
        subject: 'KDP Book',
        keywords: 'book, kindle, kdp',
        creator: 'KDP Book Formatter'
      });
      
      // Calculate margins in mm
      const marginTop = settings.marginTop * 25.4;      // convert inches to mm
      const marginBottom = settings.marginBottom * 25.4;
      const marginInside = settings.marginInside * 25.4;
      const marginOutside = settings.marginOutside * 25.4;
      
      // Function to render HTML content to PDF page
      const addHtmlPageToPDF = async (content: string, pageIndex: number) => {
        console.log(`Processing PDF page ${pageIndex + 1}/${formattedContent.length}`);
        
        // Add a new page if needed (skip for first page)
        if (pageIndex > 0) {
          pdf.addPage();
        }
        
        // Create a temporary container for rendering
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = `${dimensions.width}mm`;
        container.style.height = `${dimensions.height}mm`;
        container.style.fontFamily = settings.fontFamily;
        container.style.fontSize = `${settings.fontSize}pt`;
        container.style.lineHeight = String(settings.lineSpacing);
        container.style.backgroundColor = 'white';
        container.style.color = '#000';
        container.style.padding = `${marginTop}mm ${marginOutside}mm ${marginBottom}mm ${marginInside}mm`;
        container.style.boxSizing = 'border-box';
        container.innerHTML = content;
        
        document.body.appendChild(container);
        
        try {
          // Convert HTML to canvas
          const canvas = await html2canvas(container, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });
          
          // Convert canvas to image data
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          
          // Add image to PDF
          pdf.addImage(imgData, 'JPEG', 0, 0, dimensions.width, dimensions.height);
          
          // Add page numbers if enabled
          if (settings.includePageNumbers && pageIndex > 0) { // Skip page number on title page
            const pageNumber = pageIndex.toString();
            pdf.setFontSize(10);
            const textWidth = pdf.getTextWidth(pageNumber);
            
            pdf.text(
              pageNumber,
              (dimensions.width - textWidth) / 2,
              dimensions.height - marginBottom / 2
            );
          }
        } finally {
          // Clean up
          document.body.removeChild(container);
        }
      };
      
      // Process each page
      for (let i = 0; i < formattedContent.length; i++) {
        await addHtmlPageToPDF(formattedContent[i], i);
        
        // Update progress (optional - could add progress bar)
        const progress = ((i + 1) / formattedContent.length) * 100;
        console.log(`Processing page ${i + 1}/${formattedContent.length} (${progress.toFixed(1)}%)`);
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

  // Create a simple PDF directly from chapters when formatted content is not available
  const createSimplePDF = async () => {
    setExportStatus('processing');
    setErrorMessage('');
    
    try {
      const dimensions = getTrimSizeDimensions(settings.trimSize);
      
      const pdf = new jsPDF({
        orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [dimensions.width, dimensions.height],
        compress: highQuality
      });
      
      // Add metadata
      pdf.setProperties({
        title: bookContent.title,
        author: bookContent.metadata.author || '',
        subject: 'KDP Book',
        keywords: 'book, kindle, kdp',
        creator: 'KDP Book Formatter'
      });
      
      pdf.setFont('helvetica');
      pdf.setFontSize(settings.fontSize);
      
      const marginTop = settings.marginTop * 25.4;
      const marginLeft = settings.marginInside * 25.4;
      const marginRight = settings.marginOutside * 25.4;
      const pageWidth = dimensions.width - marginLeft - marginRight;
      
      let yPosition = marginTop;
      
      // Add title page
      if (settings.includeTitlePage) {
        pdf.setFontSize(24);
        const titleLines = pdf.splitTextToSize(bookContent.title, pageWidth);
        pdf.text(titleLines, marginLeft, yPosition);
        
        if (bookContent.metadata.author) {
          yPosition += 20;
          pdf.setFontSize(16);
          pdf.text(`By ${bookContent.metadata.author}`, marginLeft, yPosition);
        }
        
        pdf.addPage();
        yPosition = marginTop;
      }
      
      // Add chapters
      for (const chapter of bookContent.chapters) {
        if (yPosition > dimensions.height - 30) {
          pdf.addPage();
          yPosition = marginTop;
        }
        
        // Chapter title
        pdf.setFontSize(18);
        const titleLines = pdf.splitTextToSize(chapter.title, pageWidth);
        pdf.text(titleLines, marginLeft, yPosition);
        yPosition += titleLines.length * 8 + 10;
        
        // Chapter content
        pdf.setFontSize(settings.fontSize);
        const paragraphs = chapter.content.split('\n\n').filter(p => p.trim() !== '');
        
        for (const paragraph of paragraphs) {
          if (yPosition > dimensions.height - 30) {
            pdf.addPage();
            yPosition = marginTop;
          }
          
          const lines = pdf.splitTextToSize(paragraph, pageWidth);
          pdf.text(lines, marginLeft, yPosition);
          yPosition += lines.length * (settings.fontSize * 0.35 * settings.lineSpacing) + 5;
        }
        
        yPosition += 10; // Space between chapters
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
      console.error('Error generating simple PDF:', error);
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