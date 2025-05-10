import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface GalleryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: Date;
}

interface GalleryProps {
  items: GalleryItem[];
}

export function Gallery({ items }: GalleryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No designs generated yet. Start by entering a prompt or uploading an image!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <div className="aspect-square relative">
            <img
              src={item.imageUrl}
              alt={item.prompt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 space-y-2">
            <p className="text-sm text-gray-600 line-clamp-2">{item.prompt}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(item.imageUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 