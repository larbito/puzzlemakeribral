import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

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

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const newMessage: Message = {
      role: 'user',
      content: currentMessage,
    };

    setMessages([...messages, newMessage]);
    setCurrentMessage('');
    // Here you would typically make an API call to your AI service
  };

  const handleRequirementsChange = (field: keyof KDPRequirements, value: string | number) => {
    setKdpRequirements(prev => ({
      ...prev,
      [field]: value
    }));
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
                min="24"
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
                  <SelectItem value="8.5 x 11">8.5" x 11" (US Letter)</SelectItem>
                  <SelectItem value="8.25 x 8.25">8.25" x 8.25" (Square)</SelectItem>
                  <SelectItem value="7 x 10">7" x 10"</SelectItem>
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

        {/* AI Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-4">Discuss Your Theme with AI</h2>
          <div className="h-[400px] overflow-y-auto mb-4 p-4 border rounded-lg">
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

        {/* Preview Section - To be implemented */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-4">Preview Generated Pages</h2>
          <div className="h-[300px] flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">Preview will appear here after generation</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 