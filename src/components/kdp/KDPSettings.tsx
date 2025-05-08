import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Settings, Book } from 'lucide-react';

export interface KDPConfig {
  bookSize: string;
  interiorMargin: number;
  exteriorMargin: number;
  topMargin: number;
  bottomMargin: number;
  hasBleed: boolean;
  gutterMargin: number;
  numberOfPages: number;
  colorMode: 'bw' | 'color';
}

const defaultKDPConfig: KDPConfig = {
  bookSize: '6x9',
  interiorMargin: 0.25,
  exteriorMargin: 0.25,
  topMargin: 0.25,
  bottomMargin: 0.25,
  hasBleed: false,
  gutterMargin: 0.125,
  numberOfPages: 100,
  colorMode: 'bw'
};

interface KDPSettingsProps {
  config: KDPConfig;
  onChange: (config: KDPConfig) => void;
}

export const KDPSettings = ({ config = defaultKDPConfig, onChange }: KDPSettingsProps) => {
  const bookSizes = [
    { value: '5.5x8.5', label: '5.5" x 8.5"' },
    { value: '6x9', label: '6" x 9"' },
    { value: '7x10', label: '7" x 10"' },
    { value: '8.5x11', label: '8.5" x 11"' },
  ];

  const handleChange = (key: keyof KDPConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Card className="p-6 backdrop-blur-xl bg-background/40 border-primary/20 relative z-20">
      <div className="space-y-4 relative">
        <div className="flex items-center gap-2">
          <Book className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold">KDP Book Settings</h2>
        </div>

        <div className="grid gap-4 relative">
          <div className="space-y-2">
            <Label>Book Size</Label>
            <Select
              value={config.bookSize}
              onValueChange={(value) => handleChange('bookSize', value)}
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select book size" />
              </SelectTrigger>
              <SelectContent>
                {bookSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Interior Margin (inches)</Label>
              <Input
                type="number"
                min={0.25}
                step={0.125}
                value={config.interiorMargin}
                onChange={(e) => handleChange('interiorMargin', parseFloat(e.target.value))}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Exterior Margin (inches)</Label>
              <Input
                type="number"
                min={0.25}
                step={0.125}
                value={config.exteriorMargin}
                onChange={(e) => handleChange('exteriorMargin', parseFloat(e.target.value))}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Top Margin (inches)</Label>
              <Input
                type="number"
                min={0.25}
                step={0.125}
                value={config.topMargin}
                onChange={(e) => handleChange('topMargin', parseFloat(e.target.value))}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Bottom Margin (inches)</Label>
              <Input
                type="number"
                min={0.25}
                step={0.125}
                value={config.bottomMargin}
                onChange={(e) => handleChange('bottomMargin', parseFloat(e.target.value))}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Gutter Margin (inches)</Label>
            <Input
              type="number"
              min={0.125}
              step={0.125}
              value={config.gutterMargin}
              onChange={(e) => handleChange('gutterMargin', parseFloat(e.target.value))}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Number of Pages</Label>
            <Input
              type="number"
              min={24}
              max={828}
              value={config.numberOfPages}
              onChange={(e) => handleChange('numberOfPages', parseInt(e.target.value))}
              className="bg-background/50"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Include Bleed (0.125")</Label>
            <Switch
              checked={config.hasBleed}
              onCheckedChange={(checked) => handleChange('hasBleed', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Color Mode</Label>
            <Select
              value={config.colorMode}
              onValueChange={(value: 'bw' | 'color') => handleChange('colorMode', value)}
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select color mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bw">Black & White</SelectItem>
                <SelectItem value="color">Color</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}; 