import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  expandPrompts, 
  generateColoringPage, 
  createColoringBookPDF 
} from "@/services/ideogramService";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface KDPRequirements {
  pageCount: number;
  bookSize: string;
  paperType: string;
  theme: string;
  ageRange: string;
}

export default function AIColoring() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [kdpRequirements, setKdpRequirements] = useState<KDPRequirements>({
    pageCount: 24,
    bookSize: '8.5 x 11',
    paperType: 'white',
    theme: '',
    ageRange: '4-8',
  });

  // New state variables for the prompt expansion workflow
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [basePrompt, setBasePrompt] = useState<string>('');
  const [promptVariations, setPromptVariations] = useState<string[]>([]);
  const [expandedPrompts, setExpandedPrompts] = useState<boolean>(false);
  const [generatingPrompts, setGeneratingPrompts] = useState<boolean>(false);
  const [generatingBook, setGeneratingBook] = useState<boolean>(false);
  const [generatedPageUrls, setGeneratedPageUrls] = useState<string[]>([]);
  
  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const newMessage: Message = {
      role: 'user',
      content: currentMessage,
    };

    setMessages([...messages, newMessage]);
    setCurrentMessage('');
    
    // Set the base prompt from the user's message
    setBasePrompt(currentMessage);
    
    // Add AI response
    setTimeout(() => {
      const aiResponse: Message = {
        role: 'assistant',
        content: `I've analyzed your theme: "${currentMessage}". Now you can specify how many coloring pages you'd like to generate based on this theme.`
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleRequirementsChange = (field: keyof KDPRequirements, value: string | number) => {
    setKdpRequirements(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImage(reader.result);
        
        // Mock AI analysis of the image - in a real app, call your image analysis API
        setTimeout(() => {
          const imageAnalysisPrompt = "A cute cartoon elephant playing in a meadow with colorful flowers";
          setBasePrompt(imageAnalysisPrompt);
          
          // Add messages to the chat
          const aiResponse: Message = {
            role: 'assistant',
            content: `I've analyzed your image and generated a base prompt: "${imageAnalysisPrompt}". Now you can edit this prompt or specify how many coloring pages you'd like to generate.`
          };
          setMessages(prev => [...prev, aiResponse]);
        }, 1500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate prompt variations
  const handleGeneratePrompts = async () => {
    if (!basePrompt) {
      toast.error("Please enter a base prompt first");
      return;
    }
    
    setGeneratingPrompts(true);
    
    try {
      const variations = await expandPrompts(basePrompt, kdpRequirements.pageCount);
      setPromptVariations(variations);
      setExpandedPrompts(true);
      toast.success(`Generated ${variations.length} prompt variations`);
    } catch (error) {
      console.error("Error generating prompt variations:", error);
      toast.error("Failed to generate prompt variations");
    } finally {
      setGeneratingPrompts(false);
    }
  };
  
  // Handle prompt variation change
  const handlePromptChange = (index: number, value: string) => {
    setPromptVariations(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };
  
  // Generate coloring book based on prompts
  const handleGenerateColoringBook = async () => {
    if (promptVariations.length === 0) {
      toast.error("Please generate prompt variations first");
      return;
    }
    
    setGeneratingBook(true);
    toast.loading(`Generating ${promptVariations.length} coloring pages, please wait...`);
    
    try {
      const pageUrls: string[] = [];
      
      // Generate each page one by one
      for (let i = 0; i < promptVariations.length; i++) {
        const prompt = promptVariations[i];
        toast.loading(`Generating page ${i + 1} of ${promptVariations.length}...`);
        
        try {
          const imageUrl = await generateColoringPage(prompt);
          if (imageUrl) {
            pageUrls.push(imageUrl);
            toast.success(`Page ${i + 1} generated successfully!`);
          }
        } catch (pageError) {
          console.error(`Error generating page ${i + 1}:`, pageError);
          toast.error(`Failed to generate page ${i + 1}`);
        }
      }
      
      setGeneratedPageUrls(pageUrls);
      toast.success(`Successfully generated ${pageUrls.length} pages!`);
      
      // If we have pages, create a PDF
      if (pageUrls.length > 0) {
        toast.loading("Creating PDF...");
        
        try {
          const pdfUrl = await createColoringBookPDF(pageUrls, {
            trimSize: kdpRequirements.bookSize.replace(' ', ''),
            addBlankPages: true,
            showPageNumbers: true,
            includeBleed: true,
            bookTitle: `Coloring Book - ${basePrompt}`
          });
          
          // Add download link
          if (pdfUrl) {
            toast.success("PDF created successfully! Click the download button to save it.");
            
            // Add a message with the download information
            const aiResponse: Message = {
              role: 'assistant',
              content: `Your coloring book with ${pageUrls.length} pages has been generated! You can download it now.`
            };
            setMessages(prev => [...prev, aiResponse]);
          }
        } catch (pdfError) {
          console.error("Error creating PDF:", pdfError);
          toast.error("Failed to create PDF, but individual pages were generated");
        }
      }
    } catch (error) {
      console.error("Error generating coloring book:", error);
      toast.error("Failed to generate coloring book");
    } finally {
      setGeneratingBook(false);
      toast.dismiss();
    }
  };

  // Handle downloading the generated PDF
  const handleDownloadColoringBook = async () => {
    if (generatedPageUrls.length === 0) {
      toast.error("No coloring book has been generated yet");
      return;
    }
    
    toast.loading("Preparing coloring book for download...");
    
    try {
      // Create and download the PDF
      const pdfUrl = await createColoringBookPDF(generatedPageUrls, {
        trimSize: kdpRequirements.bookSize.replace(' ', ''),
        addBlankPages: true,
        showPageNumbers: true,
        includeBleed: true,
        bookTitle: `Coloring Book - ${basePrompt}`
      });
      
      if (pdfUrl) {
        // Create a temporary link to download the PDF
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `coloring-book-${basePrompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Coloring book downloaded successfully!");
      }
    } catch (error) {
      console.error("Error downloading coloring book:", error);
      toast.error("Failed to download coloring book");
    } finally {
      toast.dismiss();
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-4">AI Coloring Book Creator</h1>
          <p className="text-muted-foreground">Create beautiful coloring books ready for Amazon KDP</p>
        </motion.div>

        {/* KDP Requirements Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-4">Book Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pageCount">Number of Pages</Label>
              <Input
                id="pageCount"
                type="number"
                min="4"
                max="100"
                value={kdpRequirements.pageCount}
                onChange={(e) => handleRequirementsChange('pageCount', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookSize">Book Size</Label>
              <Select
                value={kdpRequirements.bookSize}
                onValueChange={(value) => handleRequirementsChange('bookSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select book size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8.5x11">8.5" x 11" (US Letter)</SelectItem>
                  <SelectItem value="8.25x8.25">8.25" x 8.25" (Square)</SelectItem>
                  <SelectItem value="7x10">7" x 10"</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paperType">Paper Type</Label>
              <Select
                value={kdpRequirements.paperType}
                onValueChange={(value) => handleRequirementsChange('paperType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select paper type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="cream">Cream</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageRange">Age Range</Label>
              <Select
                value={kdpRequirements.ageRange}
                onValueChange={(value) => handleRequirementsChange('ageRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="4-8">4-8 years</SelectItem>
                  <SelectItem value="6-12">6-12 years</SelectItem>
                  <SelectItem value="adult">Adult</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Image Upload & Prompt Generation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-4">Upload or Enter Prompt</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Upload */}
            <div className="space-y-4">
              <Label htmlFor="imageUpload">Upload a Coloring Style Image</Label>
              <Input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              
              {uploadedImage && (
                <div className="mt-4">
                  <img 
                    src={uploadedImage}
                    alt="Uploaded reference image"
                    className="max-h-48 rounded border"
                  />
                </div>
              )}
            </div>
            
            {/* Base Prompt */}
            <div className="space-y-4">
              <Label htmlFor="basePrompt">Base Prompt</Label>
              <div className="flex gap-2">
                <Input
                  id="basePrompt"
                  value={basePrompt}
                  onChange={(e) => setBasePrompt(e.target.value)}
                  placeholder="e.g. A cute elephant playing in a meadow with flowers"
                />
              </div>
              
              {basePrompt && (
                <Button 
                  onClick={handleGeneratePrompts}
                  disabled={generatingPrompts}
                  className="mt-4"
                >
                  {generatingPrompts ? "Generating..." : `Generate ${kdpRequirements.pageCount} Prompts`}
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Prompt Variations */}
        {expandedPrompts && promptVariations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-2xl font-semibold mb-4">
              Edit Generated Prompts
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleGeneratePrompts}
                className="ml-4"
              >
                Regenerate
              </Button>
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {promptVariations.map((prompt, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-sm font-medium w-8">{index + 1}.</span>
                  <Input
                    value={prompt}
                    onChange={(e) => handlePromptChange(index, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleGenerateColoringBook}
              disabled={generatingBook}
              className="mt-6"
              size="lg"
            >
              {generatingBook ? "Generating..." : "Generate Coloring Book"}
            </Button>
          </motion.div>
        )}

        {/* AI Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-4">Discuss Your Theme with AI</h2>
          <div className="h-[300px] overflow-y-auto mb-4 p-4 border rounded-lg">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleMessageSubmit} className="flex gap-2">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Describe your coloring book theme..."
              className="flex-1"
            />
            <Button type="submit">Send</Button>
          </form>
        </motion.div>

        {/* Preview Section */}
        {generatedPageUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-2xl font-semibold mb-4">Preview Generated Pages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedPageUrls.map((url, index) => (
                <div key={index} className="border rounded overflow-hidden">
                  <img 
                    src={url} 
                    alt={`Coloring page ${index + 1}`} 
                    className="w-full h-auto"
                  />
                  <div className="p-2 text-center text-sm">Page {index + 1}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button size="lg" onClick={handleDownloadColoringBook}>
                Download Coloring Book
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 