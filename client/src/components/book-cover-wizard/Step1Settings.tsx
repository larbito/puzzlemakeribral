import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Ruler, Info, CheckCircle2 } from 'lucide-react';
import { BookSettings, CoverData } from '../../pages/dashboard/BookCoverWizard';
import { 
  KDP_TRIM_SIZES, 
  calculateDimensions, 
  formatDimensions,
  getTrimSizeRecommendation,
  isSpineTextviable 
} from '../../utils/book-cover/dimensionUtils';

interface Step1SettingsProps {
  bookSettings: BookSettings;
  updateBookSettings: (settings: Partial<BookSettings>) => void;
  setLoading: (loading: boolean, message?: string) => void;
  onNext: () => void;
}

const PAPER_TYPES = [
  { value: 'white', label: 'White Paper', emoji: '⚪', description: 'Standard white paper' },
  { value: 'cream', label: 'Cream Paper', emoji: '🟡', description: 'Cream-colored paper, slightly thicker' },
  { value: 'color', label: 'Color Paper', emoji: '🎨', description: 'Color printing capable paper' },
];

const Step1Settings: React.FC<Step1SettingsProps> = ({
  bookSettings,
  updateBookSettings,
  setLoading,
  onNext,
}) => {
  // Auto-calculate dimensions when settings change
  useEffect(() => {
    const dimensions = calculateDimensions(
      bookSettings.trimSize,
      bookSettings.pageCount,
      bookSettings.paperType,
      bookSettings.includeBleed
    );
    
    updateBookSettings({ dimensions });
  }, [bookSettings.trimSize, bookSettings.pageCount, bookSettings.paperType, bookSettings.includeBleed]);

  const handleTrimSizeChange = (value: string) => {
    updateBookSettings({ trimSize: value });
  };

  const handlePageCountChange = (value: number[]) => {
    updateBookSettings({ pageCount: value[0] });
  };

  const handlePaperTypeChange = (value: 'white' | 'cream' | 'color') => {
    updateBookSettings({ paperType: value });
  };

  const handleBleedChange = (checked: boolean) => {
    updateBookSettings({ includeBleed: checked });
  };

  const canProceed = bookSettings.trimSize && bookSettings.pageCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Book Settings</h2>
        <p className="text-zinc-400">
          Configure your book specifications for Amazon KDP publishing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trim Size Card */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Ruler className="h-5 w-5" />
                Book Dimensions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium text-white">Trim Size</Label>
                <Select value={bookSettings.trimSize} onValueChange={handleTrimSizeChange}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select book size" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {KDP_TRIM_SIZES.map((size) => (
                      <SelectItem 
                        key={size.value} 
                        value={size.value}
                        className="hover:bg-zinc-700"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{size.label}</span>
                          {size.popular && (
                            <Badge variant="secondary" className="ml-2 bg-blue-900/30 text-blue-300">
                              Most Popular
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="p-4 bg-blue-950/20 rounded-lg border border-blue-900/30">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-300 mb-1">
                        {getTrimSizeRecommendation(bookSettings.trimSize)}
                      </p>
                      <p className="text-xs text-blue-400/80">
                        Standard paperback dimensions for professional publishing
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium text-white">
                  Page Count: {bookSettings.pageCount}
                </Label>
                <div className="space-y-3">
                  <Slider
                    value={[bookSettings.pageCount]}
                    min={24}
                    max={900}
                    step={1}
                    onValueChange={handlePageCountChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>24 pages (minimum)</span>
                    <span>{bookSettings.pageCount} pages</span>
                    <span>900 pages (maximum)</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-900/30">
                  <div className="text-xs text-emerald-400">
                    <div>📖 Spine width: <strong>{bookSettings.dimensions.spineWidth.toFixed(3)}"</strong></div>
                    <div className="mt-1">
                      {isSpineTextviable(bookSettings.dimensions.spineWidth) ? (
                        <span className="text-emerald-300">✅ Wide enough for spine text</span>
                      ) : (
                        <span className="text-amber-300">⚠️ Too thin for readable spine text (needs 0.25" minimum)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paper & Options Card */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Settings className="h-5 w-5" />
                Paper & Publishing Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium text-white">Paper Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {PAPER_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handlePaperTypeChange(type.value as 'white' | 'cream' | 'color')}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        bookSettings.paperType === type.value 
                          ? "border-blue-500 bg-blue-950/30 shadow-lg" 
                          : "border-zinc-700 bg-zinc-800 hover:border-blue-600 hover:bg-blue-950/20"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">{type.emoji}</div>
                        <div className={`font-medium text-sm ${
                          bookSettings.paperType === type.value ? 'text-blue-300' : 'text-zinc-300'
                        }`}>
                          {type.label}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {type.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="space-y-1">
                    <Label className="text-base font-medium text-white">
                      Include Bleed (0.125")
                    </Label>
                    <p className="text-sm text-zinc-400">
                      Recommended for designs that extend to the edge of the page
                    </p>
                  </div>
                  <Switch
                    checked={bookSettings.includeBleed}
                    onCheckedChange={handleBleedChange}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          {/* Dimensions Preview */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-green-400 text-lg">Calculated Dimensions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Front Cover:</span>
                  <span className="text-white font-mono">
                    {bookSettings.dimensions.frontWidth}" × {bookSettings.dimensions.frontHeight}"
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Spine Width:</span>
                  <span className="text-white font-mono">
                    {bookSettings.dimensions.spineWidth.toFixed(3)}"
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Full Wrap:</span>
                  <span className="text-white font-mono">
                    {bookSettings.dimensions.fullWrapWidth.toFixed(3)}" × {bookSettings.dimensions.fullWrapHeight}"
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-700">
                <div className="text-xs text-zinc-500 space-y-1">
                  <div>📄 {bookSettings.pageCount} pages</div>
                  <div>📝 {bookSettings.paperType} paper</div>
                  <div>✂️ {bookSettings.includeBleed ? 'With' : 'Without'} bleed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Status */}
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardContent className="p-6">
              <div className="text-center">
                {canProceed ? (
                  <div className="space-y-3">
                    <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto" />
                    <div>
                      <div className="text-green-400 font-medium">Settings Complete</div>
                      <div className="text-sm text-zinc-400 mt-1">
                        Ready to create your front cover
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Settings className="h-8 w-8 text-zinc-400 mx-auto" />
                    <div>
                      <div className="text-zinc-400 font-medium">Configure Settings</div>
                      <div className="text-sm text-zinc-500 mt-1">
                        Complete book specifications to continue
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className="bg-blue-600 hover:bg-blue-500 px-8"
        >
          {canProceed ? 'Continue to Front Cover' : 'Complete Settings First'}
        </Button>
      </div>
    </div>
  );
};

export default Step1Settings; 