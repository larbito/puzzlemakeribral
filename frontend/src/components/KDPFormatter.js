import React, { useState, useCallback } from 'react';
import { Upload, Wand2, Book, Download, Settings, Eye, FileText, Printer } from 'lucide-react';

const KDPFormatter = () => {
  const [file, setFile] = useState(null);
  const [extractedContent, setExtractedContent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // KDP formatting settings following the workflow specification
  const [settings, setSettings] = useState({
    // Basic Settings
    trimSize: '6x9',
    font: 'Garamond',
    fontSize: '12pt',
    lineSpacing: 1.5,
    
    // Margins
    marginTop: '1in',
    marginBottom: '1in',
    marginInside: '1in',
    marginOutside: '0.75in',
    
    // Layout Options
    justification: 'full',
    pageNumbering: true,
    headerStyle: 'none',
    
    // Book Elements
    includeTitlePage: true,
    includeCopyright: true,
    includeTOC: true,
    
    // Advanced
    isbn: '',
    year: new Date().getFullYear(),
    preventOrphans: true,
    chapterBreaks: true
  });

  // KDP trim size options
  const trimSizes = [
    { value: '5x8', label: '5" × 8"', desc: 'Compact fiction' },
    { value: '5.25x8', label: '5.25" × 8"', desc: 'Popular fiction' },
    { value: '5.5x8.5', label: '5.5" × 8.5"', desc: 'Trade paperback' },
    { value: '6x9', label: '6" × 9"', desc: 'Standard (recommended)' },
    { value: '6.14x9.21', label: '6.14" × 9.21"', desc: 'International' },
    { value: '7x10', label: '7" × 10"', desc: 'Large format' },
    { value: '8.5x11', label: '8.5" × 11"', desc: 'Textbook/manual' }
  ];

  // Font options (KDP-safe)
  const fonts = [
    { value: 'Garamond', label: 'Garamond (Classic)' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia (Web-safe)' },
    { value: 'Book Antiqua', label: 'Book Antiqua' },
    { value: 'Palatino', label: 'Palatino' },
    { value: 'Baskerville', label: 'Baskerville' }
  ];

  const handleFileUpload = useCallback((event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess('');
      setExtractedContent(null);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setSuccess('');
      setExtractedContent(null);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const processFile = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/kdp-formatter/extract', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setExtractedContent(result.content);
        setSuccess('✅ Content analyzed successfully! Configure your formatting settings below.');
      } else {
        setError(result.error || 'Failed to process file');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError('An error occurred while processing the file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = async () => {
    if (!extractedContent) {
      setError('Please process a file first');
      return;
    }

    setIsGeneratingPDF(true);
    setError(null);

    try {
      const response = await fetch('/api/kdp-formatter/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: extractedContent,
          settings: settings
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Create download link
        const downloadUrl = result.downloadUrl;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSuccess(`✅ KDP-ready PDF generated: ${result.filename}`);
      } else {
        setError(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('An error occurred while generating the PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <Book className="h-10 w-10 text-blue-600" />
          AI-Powered KDP Book Formatter
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload your manuscript and let AI handle the complete formatting process with professional KDP-ready output
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        <div className={`flex items-center space-x-2 ${file ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${file ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}>
            <Upload className="h-4 w-4" />
          </div>
          <span className="font-medium">Upload</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${extractedContent ? 'text-green-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${extractedContent ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}>
            <Wand2 className="h-4 w-4" />
          </div>
          <span className="font-medium">AI Analysis</span>
        </div>
        
        <div className={`flex items-center space-x-2 ${showSettings ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${showSettings ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}>
            <Settings className="h-4 w-4" />
          </div>
          <span className="font-medium">Format Settings</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Download className="h-4 w-4" />
          </div>
          <span className="font-medium">Export</span>
        </div>
      </div>

      {/* File Upload Section */}
      {!extractedContent && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />
            Upload Your Manuscript
          </h2>
          
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">
              {file ? file.name : 'Drag & drop your manuscript or click to browse files'}
            </p>
            <p className="text-sm text-gray-500">
              Supports .docx, .pdf, and .txt files (max 50MB)
            </p>
            <input
              id="file-upload"
              type="file"
              accept=".docx,.pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {file && (
            <div className="mt-6 text-center">
              <button
                onClick={processFile}
                disabled={isProcessing}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing Content...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content Analysis Results */}
      {extractedContent && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Eye className="h-6 w-6 text-green-600" />
            Content Analysis Complete
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Book Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Title:</span> {extractedContent.title}</p>
                <p><span className="font-medium">Author:</span> {extractedContent.author}</p>
                <p><span className="font-medium">Chapters:</span> {extractedContent.chapters?.length || 0}</p>
                <p><span className="font-medium">Analysis Method:</span> {extractedContent.metadata?.analysisMethod}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Content Breakdown</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Total Lines:</span> {extractedContent.metadata?.totalLines}</p>
                <p><span className="font-medium">Questions:</span> {extractedContent.contentBreakdown?.questions || 0}</p>
                <p><span className="font-medium">Exercises:</span> {extractedContent.contentBreakdown?.exercises || 0}</p>
                <p><span className="font-medium">Quotes:</span> {extractedContent.contentBreakdown?.quotes || 0}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {showSettings ? 'Hide' : 'Show'} Formatting Settings
          </button>
        </div>
      )}

      {/* Formatting Settings Panel */}
      {showSettings && extractedContent && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            KDP Formatting Settings
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Basic Settings */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Basic Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trim Size</label>
                  <select
                    value={settings.trimSize}
                    onChange={(e) => updateSetting('trimSize', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {trimSizes.map(size => (
                      <option key={size.value} value={size.value}>
                        {size.label} - {size.desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                  <select
                    value={settings.font}
                    onChange={(e) => updateSetting('font', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {fonts.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                  <select
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="10pt">10pt (Small)</option>
                    <option value="11pt">11pt</option>
                    <option value="12pt">12pt (Standard)</option>
                    <option value="13pt">13pt</option>
                    <option value="14pt">14pt (Large)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Line Spacing</label>
                  <select
                    value={settings.lineSpacing}
                    onChange={(e) => updateSetting('lineSpacing', parseFloat(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value={1.0}>Single (1.0)</option>
                    <option value={1.15}>1.15</option>
                    <option value={1.25}>1.25</option>
                    <option value={1.5}>1.5 (Recommended)</option>
                    <option value={1.75}>1.75</option>
                    <option value={2.0}>Double (2.0)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Margin Settings */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Margins & Layout</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Top Margin</label>
                  <input
                    type="text"
                    value={settings.marginTop}
                    onChange={(e) => updateSetting('marginTop', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="1in"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bottom Margin</label>
                  <input
                    type="text"
                    value={settings.marginBottom}
                    onChange={(e) => updateSetting('marginBottom', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="1in"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inside Margin (Binding)</label>
                  <input
                    type="text"
                    value={settings.marginInside}
                    onChange={(e) => updateSetting('marginInside', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="1in"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outside Margin</label>
                  <input
                    type="text"
                    value={settings.marginOutside}
                    onChange={(e) => updateSetting('marginOutside', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.75in"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Alignment</label>
                  <select
                    value={settings.justification}
                    onChange={(e) => updateSetting('justification', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="left">Left Aligned</option>
                    <option value="justify">Justified (Recommended)</option>
                    <option value="center">Center Aligned</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Book Elements */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Book Elements</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeTitlePage"
                    checked={settings.includeTitlePage}
                    onChange={(e) => updateSetting('includeTitlePage', e.target.checked)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="includeTitlePage" className="ml-2 text-sm text-gray-700">
                    Include Title Page
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeCopyright"
                    checked={settings.includeCopyright}
                    onChange={(e) => updateSetting('includeCopyright', e.target.checked)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="includeCopyright" className="ml-2 text-sm text-gray-700">
                    Include Copyright Page
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeTOC"
                    checked={settings.includeTOC}
                    onChange={(e) => updateSetting('includeTOC', e.target.checked)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="includeTOC" className="ml-2 text-sm text-gray-700">
                    Include Table of Contents
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pageNumbering"
                    checked={settings.pageNumbering}
                    onChange={(e) => updateSetting('pageNumbering', e.target.checked)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor="pageNumbering" className="ml-2 text-sm text-gray-700">
                    Page Numbering
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN (Optional)</label>
                  <input
                    type="text"
                    value={settings.isbn}
                    onChange={(e) => updateSetting('isbn', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="978-0-123456-78-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year</label>
                  <input
                    type="number"
                    value={settings.year}
                    onChange={(e) => updateSetting('year', parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="1900"
                    max="2030"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Generate PDF Button */}
          <div className="mt-8 text-center">
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating KDP PDF...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  Generate KDP-Ready PDF
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}
    </div>
  );
};

export default KDPFormatter; 