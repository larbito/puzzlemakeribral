import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription, 
  DialogHeader,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Sparkles, Download, Lightbulb } from 'lucide-react';

interface BookCoverGalleryProps {
  onSelectTemplate: (prompt: string) => void;
}

const SAMPLE_COVERS = [
  {
    id: 1,
    title: "Fantasy Adventure",
    imageUrl: "https://images.unsplash.com/photo-1518346349786-c4906920a2a3?q=80&w=600&auto=format&fit=crop",
    prompt: "A fantasy book cover with a magical castle floating in the clouds, mystical dragons circling above, with ethereal blue and purple lighting, professional fantasy book cover art style"
  },
  {
    id: 2,
    title: "Mystery Thriller",
    imageUrl: "https://images.unsplash.com/photo-1544161263-7d642ff0e9c0?q=80&w=600&auto=format&fit=crop",
    prompt: "A suspenseful thriller book cover with a silhouette of a person running down a dark alley, mysterious shadows, and a subtle red accent color, create moody atmospheric lighting"
  },
  {
    id: 3,
    title: "Sci-Fi Future",
    imageUrl: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600&auto=format&fit=crop",
    prompt: "A science fiction book cover showing a futuristic cityscape with towering buildings, flying vehicles, and a large planet visible in the sky, neon lights, high-tech aesthetic"
  },
  {
    id: 4,
    title: "Romance",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop",
    prompt: "A romantic book cover depicting a sunset over the ocean with silhouettes of a couple walking on the beach, warm golden light, soft pastel colors, romantic atmosphere"
  },
  {
    id: 5,
    title: "History & Biography",
    imageUrl: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?q=80&w=600&auto=format&fit=crop",
    prompt: "A historical biography cover with an old parchment background, vintage items like fountain pens and compass, sepia tones, elegant classic typography styling"
  },
  {
    id: 6,
    title: "Self Help",
    imageUrl: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=600&auto=format&fit=crop",
    prompt: "A motivational self-help book cover with a serene mountain peak at sunrise, a person with arms raised in achievement, inspirational, clean modern design with soft gradients"
  },
];

const BookCoverGallery: React.FC<BookCoverGalleryProps> = ({ onSelectTemplate }) => {
  const [open, setOpen] = useState(false);
  const [selectedCover, setSelectedCover] = useState<typeof SAMPLE_COVERS[0] | null>(null);

  const handleOpenGallery = () => {
    setOpen(true);
  };

  const handleSelectCover = (cover: typeof SAMPLE_COVERS[0]) => {
    setSelectedCover(cover);
  };

  const handleUseTemplate = () => {
    if (selectedCover) {
      onSelectTemplate(selectedCover.prompt);
      setOpen(false);
      setSelectedCover(null);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenGallery}
        variant="outline"
        className="w-full flex gap-2 items-center"
      >
        <Lightbulb className="w-4 h-4" />
        Browse Cover Ideas
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              Cover Inspiration Gallery
            </DialogTitle>
            <DialogDescription>
              Browse example covers and use them as templates for your own book
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMPLE_COVERS.map((cover) => (
                <Card 
                  key={cover.id}
                  className={`overflow-hidden cursor-pointer transition-all ${
                    selectedCover?.id === cover.id
                      ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-background"
                      : "hover:border-violet-500/50"
                  }`}
                  onClick={() => handleSelectCover(cover)}
                >
                  <div className="aspect-[2/3] relative group">
                    <img
                      src={cover.imageUrl}
                      alt={cover.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm">{cover.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {cover.prompt.substring(0, 80)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUseTemplate}
              disabled={!selectedCover}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookCoverGallery; 