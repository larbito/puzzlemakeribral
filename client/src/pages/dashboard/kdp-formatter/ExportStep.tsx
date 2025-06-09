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
        console.log('Creating professional PDF from chapters...');
        await createProfessionalPDF();
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
      
      // Create PDF document with professional settings
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
      
      // Calculate margins in mm
      const marginTop = settings.marginTop * 25.4;
      const marginBottom = settings.marginBottom * 25.4;
      const marginInside = settings.marginInside * 25.4;
      const marginOutside = settings.marginOutside * 25.4;
      
      // Function to render HTML content to PDF page with professional layout
      const addHtmlPageToPDF = async (content: string, pageIndex: number) => {
        console.log(`Processing PDF page ${pageIndex + 1}/${formattedContent.length}`);
        
        // Add a new page if needed (skip for first page)
        if (pageIndex > 0) {
          pdf.addPage();
        }
        
        // Create a temporary container for rendering with improved styling
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.style.width = `${dimensions.width}mm`;
        container.style.height = `${dimensions.height}mm`;
        container.style.backgroundColor = 'white';
        container.style.color = '#000000';
        container.style.padding = `${marginTop}mm ${marginOutside}mm ${marginBottom}mm ${marginInside}mm`;
        container.style.boxSizing = 'border-box';
        container.style.overflow = 'hidden';
        container.innerHTML = content;
        
        document.body.appendChild(container);
        
        try {
          // Convert HTML to canvas with high quality settings
          const canvas = await html2canvas(container, {
            scale: 3, // Higher scale for better quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            removeContainer: true,
            imageTimeout: 5000,
            logging: false
          });
          
          // Convert canvas to high quality image data
          const imgData = canvas.toDataURL('image/png', 1.0);
          
          // Add image to PDF with proper dimensions
          pdf.addImage(imgData, 'PNG', 0, 0, dimensions.width, dimensions.height, undefined, 'FAST');
          
          // Add page numbers if enabled (outside margins)
          if (settings.includePageNumbers && pageIndex > 0) {
            const pageNumber = pageIndex.toString();
            pdf.setFont('times', 'normal');
            pdf.setFontSize(10);
            const textWidth = pdf.getTextWidth(pageNumber);
            
            // Center page number at bottom
            pdf.text(
              pageNumber,
              (dimensions.width - textWidth) / 2,
              dimensions.height - (marginBottom / 3) // Above margin
            );
          }
        } finally {
          // Clean up
          document.body.removeChild(container);
        }
      };
      
      // Process each page with progress tracking
      for (let i = 0; i < formattedContent.length; i++) {
        await addHtmlPageToPDF(formattedContent[i], i);
        
        // Small delay to prevent browser freezing
        if (i % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const progress = ((i + 1) / formattedContent.length) * 100;
        console.log(`Processing page ${i + 1}/${formattedContent.length} (${progress.toFixed(1)}%)`);
      }
      
      // Generate the PDF blob
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      setDownloadUrl(url);
      setExportStatus('complete');
      
      toast({
        title: 'Professional PDF Generated',
        description: 'Your KDP-ready PDF has been generated with professional formatting.'
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

  // Create a professional PDF directly from chapters when formatted content is not available
  const createProfessionalPDF = async () => {
    setExportStatus('processing');
    setErrorMessage('');
    
    try {
      const dimensions = getTrimSizeDimensions(settings.trimSize);
      
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
      
      // Use Times Roman for better typography
      pdf.setFont('times');
      pdf.setFontSize(settings.fontSize);
      
      const marginTop = settings.marginTop * 25.4;
      const marginLeft = settings.marginInside * 25.4;
      const marginRight = settings.marginOutside * 25.4;
      const marginBottom = settings.marginBottom * 25.4;
      const pageWidth = dimensions.width - marginLeft - marginRight;
      const pageHeight = dimensions.height - marginTop - marginBottom;
      
      let yPosition = marginTop;
      
      // Add professional title page
      if (settings.includeTitlePage) {
        pdf.setFontSize(Math.max(18, settings.fontSize * 1.8));
        pdf.setFont('times', 'bold');
        
        // Center the title vertically and horizontally
        const titleLines = pdf.splitTextToSize(bookContent.title.toUpperCase(), pageWidth);
        const titleHeight = titleLines.length * 10;
        const titleY = (dimensions.height - titleHeight) / 2;
        
        pdf.text(titleLines, dimensions.width / 2, titleY, { align: 'center' });
        
        if (bookContent.metadata.author) {
          pdf.setFontSize(Math.max(14, settings.fontSize * 1.2));
          pdf.setFont('times', 'italic');
          pdf.text(`by ${bookContent.metadata.author}`, dimensions.width / 2, titleY + titleHeight + 20, { align: 'center' });
        }
        
        pdf.addPage();
        yPosition = marginTop;
      }
      
      // Add professional table of contents
      if (settings.includeTOC) {
        pdf.setFontSize(Math.max(16, settings.fontSize * 1.4));
        pdf.setFont('times', 'bold');
        pdf.text('TABLE OF CONTENTS', dimensions.width / 2, yPosition + 20, { align: 'center' });
        
        yPosition += 40;
        pdf.setFontSize(settings.fontSize);
        pdf.setFont('times', 'normal');
        
        let currentPageNum = pdf.getNumberOfPages() + 1;
        
        for (let i = 0; i < bookContent.chapters.length; i++) {
          const chapter = bookContent.chapters[i];
          
          if (yPosition > dimensions.height - marginBottom - 20) {
            pdf.addPage();
            yPosition = marginTop;
          }
          
          // Chapter entry with dots
          const chapterTitle = `Chapter ${i + 1}: ${chapter.title}`;
          const dots = '.'.repeat(Math.max(3, 50 - chapterTitle.length));
          const pageNum = currentPageNum.toString();
          
          pdf.text(chapterTitle, marginLeft, yPosition);
          pdf.text(dots, marginLeft + pdf.getTextWidth(chapterTitle), yPosition);
          pdf.text(pageNum, dimensions.width - marginRight, yPosition, { align: 'right' });
          
          yPosition += 8;
          
          // Estimate pages for this chapter
          const wordCount = chapter.content.split(' ').length;
          const wordsPerPage = 250;
          const pagesForChapter = Math.max(1, Math.ceil(wordCount / wordsPerPage));
          currentPageNum += pagesForChapter;
        }
        
        pdf.addPage();
        yPosition = marginTop;
      }
      
      // Add chapters with professional formatting
      for (let i = 0; i < bookContent.chapters.length; i++) {
        const chapter = bookContent.chapters[i];
        
        // Start new chapter on new page
        if (i > 0) {
          pdf.addPage();
          yPosition = marginTop;
        }
        
        // Chapter number
        pdf.setFontSize(Math.max(12, settings.fontSize * 0.9));
        pdf.setFont('times', 'normal');
        pdf.text(`Chapter ${i + 1}`, dimensions.width / 2, yPosition, { align: 'center' });
        yPosition += 15;
        
        // Chapter title
        pdf.setFontSize(Math.max(16, settings.fontSize * 1.3));
        pdf.setFont('times', 'bold');
        const titleLines = pdf.splitTextToSize(chapter.title.toUpperCase(), pageWidth);
        pdf.text(titleLines, dimensions.width / 2, yPosition, { align: 'center' });
        yPosition += titleLines.length * 8 + 20;
        
        // Chapter content with professional formatting
        pdf.setFontSize(settings.fontSize);
        pdf.setFont('times', 'normal');
        
        const paragraphs = chapter.content.split('\n\n').filter(p => p.trim() !== '');
        
        for (let j = 0; j < paragraphs.length; j++) {
          const paragraph = paragraphs[j].trim();
          
          if (yPosition > dimensions.height - marginBottom - 20) {
            pdf.addPage();
            yPosition = marginTop + 20; // Leave space at top of new page
          }
          
          // Calculate line height based on line spacing
          const lineHeight = settings.fontSize * 0.35 * settings.lineSpacing;
          
          // Split paragraph into lines that fit the page width
          const lines = pdf.splitTextToSize(paragraph, pageWidth - (j === 0 ? 20 : 0)); // First paragraph indent
          
          // Add first line with indent (except for first paragraph)
          if (lines.length > 0) {
            const firstLineIndent = j === 0 ? 0 : 15; // First paragraph no indent, others indented
            pdf.text(lines[0], marginLeft + firstLineIndent, yPosition);
            yPosition += lineHeight;
            
            // Add remaining lines
            for (let k = 1; k < lines.length; k++) {
              if (yPosition > dimensions.height - marginBottom - lineHeight) {
                pdf.addPage();
                yPosition = marginTop + 20;
              }
              pdf.text(lines[k], marginLeft, yPosition);
              yPosition += lineHeight;
            }
          }
          
          yPosition += lineHeight * 0.5; // Space between paragraphs
        }
      }
      
      // Add page numbers to all pages except title page
      if (settings.includePageNumbers) {
        const totalPages = pdf.getNumberOfPages();
        pdf.setFontSize(10);
        pdf.setFont('times', 'normal');
        
        for (let pageNum = settings.includeTitlePage ? 2 : 1; pageNum <= totalPages; pageNum++) {
          pdf.setPage(pageNum);
          const displayPageNum = settings.includeTitlePage ? pageNum - 1 : pageNum;
          pdf.text(
            displayPageNum.toString(),
            dimensions.width / 2,
            dimensions.height - marginBottom / 2,
            { align: 'center' }
          );
        }
      }
      
      // Generate the PDF blob
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      setDownloadUrl(url);
      setExportStatus('complete');
      
      toast({
        title: 'Professional PDF Generated',
        description: 'Your KDP-ready PDF has been generated with professional formatting.'
      });
    } catch (error) {
      console.error('Error generating professional PDF:', error);
      setExportStatus('error');
      setErrorMessage('There was a problem generating your professional PDF. Please try again.');
      
      toast({
        title: 'PDF Generation Failed',
        description: 'There was a problem generating your PDF. Please try again.'
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