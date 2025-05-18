import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  BookOpen,
  FileText,
  Palette,
  Sliders,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const TRIM_SIZES = [
  { value: "5x8", label: "5\" x 8\"" },
  { value: "5.5x8.5", label: "5.5\" x 8.5\"" },
  { value: "6x9", label: "6\" x 9\" (Standard)" },
  { value: "8.5x11", label: "8.5\" x 11\" (Letter)" },
];
const PAPER_TYPES = [
  { value: "white", label: "White", desc: "Bright, high contrast, ideal for most books" },
  { value: "cream", label: "Cream", desc: "Soft, easier on eyes, popular for fiction" },
];
const DEFAULTS = {
  trimSize: "6x9",
  pageCount: 100,
  paperType: "white",
  hasBleed: true,
  hasISBN: false,
};

const steps = [
  { key: "trimSize", label: "Trim Size", icon: BookOpen },
  { key: "pageCount", label: "Page Count", icon: FileText },
  { key: "paperType", label: "Paper Type", icon: Palette },
  { key: "options", label: "Options", icon: Sliders },
  { key: "dimensions", label: "Dimensions", icon: Sparkles },
];

function getSummary(settings: any) {
  return `${TRIM_SIZES.find(s => s.value === settings.trimSize)?.label || settings.trimSize}, ` +
    `${settings.pageCount} pages, ` +
    `${PAPER_TYPES.find(p => p.value === settings.paperType)?.label || settings.paperType} paper, ` +
    `Bleed: ${settings.hasBleed ? "Yes" : "No"}, ISBN: ${settings.hasISBN ? "Yes" : "No"}`;
}

const BookSettingsStep = ({ bookSettings, setBookSettings }: any) => {
  const [activeStep, setActiveStep] = useState(0);
  const [showAllSizes, setShowAllSizes] = useState(false);

  // Smart recommendation
  const isRecommended =
    bookSettings.trimSize === "6x9" &&
    bookSettings.pageCount === 100 &&
    bookSettings.paperType === "white";

  // Stepper navigation
  const goToStep = (idx: number) => setActiveStep(idx);
  const nextStep = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setActiveStep((s) => Math.max(s - 1, 0));

  // One-click defaults
  const useDefaults = () => setBookSettings((prev: any) => ({ ...prev, ...DEFAULTS }));

  // Accordion/stepper UI
  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Stepper/Accordion */}
      <div className="flex-1 max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" /> Book Settings
          </h2>
          <Button variant="outline" size="sm" onClick={useDefaults}>
            <CheckCircle2 className="w-4 h-4 mr-1 text-cyan-400" /> Use KDP Standard
          </Button>
        </div>
        <div className="rounded-xl bg-gray-900/80 border border-gray-800 divide-y divide-gray-800">
          {/* Step 1: Trim Size */}
          <AccordionStep
            open={activeStep === 0}
            onClick={() => goToStep(0)}
            icon={<BookOpen className="w-5 h-5 text-cyan-400" />}
            label="Trim Size"
            description="Pick your book's size. Most KDP books use 6×9."
            help="Trim size is the final size of your printed book. KDP recommends 6×9 for most genres."
            recommended={bookSettings.trimSize === "6x9"}
          >
            <div className="flex flex-wrap gap-2 mt-2">
              {TRIM_SIZES.map((size) => (
                <Button
                  key={size.value}
                  variant={bookSettings.trimSize === size.value ? "default" : "outline"}
                  className={cn(
                    "rounded-lg px-4 py-2 text-base font-mono",
                    bookSettings.trimSize === size.value && "border-cyan-400 bg-cyan-900/30 text-cyan-100"
                  )}
                  onClick={() => setBookSettings((prev: any) => ({ ...prev, trimSize: size.value }))}
                >
                  {size.label}
                  {size.value === "6x9" && (
                    <span className="ml-2 text-xs text-cyan-400">Recommended</span>
                  )}
                </Button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              <Button variant="link" size="sm" className="px-0" onClick={() => setShowAllSizes((v) => !v)}>
                {showAllSizes ? "Hide uncommon sizes" : "Show all sizes"}
              </Button>
              {showAllSizes && (
                <div className="mt-2">(Add more uncommon sizes here if needed)</div>
              )}
            </div>
          </AccordionStep>

          {/* Step 2: Page Count */}
          <AccordionStep
            open={activeStep === 1}
            onClick={() => goToStep(1)}
            icon={<FileText className="w-5 h-5 text-cyan-400" />}
            label="Page Count"
            description="How many pages will your book have?"
            help="Paperback books require a minimum of 24 pages. Most books are 100-300 pages."
          >
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="number"
                min={24}
                max={828}
                value={bookSettings.pageCount}
                onChange={(e) => setBookSettings((prev: any) => ({ ...prev, pageCount: parseInt(e.target.value) }))}
                className="w-32 text-lg"
              />
              <span className="text-gray-400">pages</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[75, 100, 150, 200, 300].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={bookSettings.pageCount === n ? "default" : "outline"}
                  onClick={() => setBookSettings((prev: any) => ({ ...prev, pageCount: n }))}
                >
                  {n}
                </Button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-400">Min: 24, Max: 828 pages</div>
          </AccordionStep>

          {/* Step 3: Paper Type */}
          <AccordionStep
            open={activeStep === 2}
            onClick={() => goToStep(2)}
            icon={<Palette className="w-5 h-5 text-cyan-400" />}
            label="Paper Type"
            description="Choose the paper color."
            help="White is best for most books. Cream is easier on the eyes for fiction."
          >
            <div className="flex gap-4 mt-2">
              {PAPER_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={bookSettings.paperType === type.value ? "default" : "outline"}
                  className={cn(
                    "rounded-lg px-4 py-2 flex flex-col items-start",
                    bookSettings.paperType === type.value && "border-cyan-400 bg-cyan-900/30 text-cyan-100"
                  )}
                  onClick={() => setBookSettings((prev: any) => ({ ...prev, paperType: type.value }))}
                >
                  <span className="font-semibold">{type.label}</span>
                  <span className="text-xs text-gray-400">{type.desc}</span>
                </Button>
              ))}
            </div>
          </AccordionStep>

          {/* Step 4: Options */}
          <AccordionStep
            open={activeStep === 3}
            onClick={() => goToStep(3)}
            icon={<Sliders className="w-5 h-5 text-cyan-400" />}
            label="Options"
            description="Extra settings for your cover."
            help="Bleed is needed for edge-to-edge designs. ISBN is required if you want a barcode."
          >
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-3">
                <Switch
                  checked={bookSettings.hasBleed}
                  onCheckedChange={(v) => setBookSettings((prev: any) => ({ ...prev, hasBleed: v }))}
                  className="data-[state=checked]:bg-cyan-600"
                />
                <span className="text-white">Include Bleed</span>
                <span className="text-xs text-gray-400 ml-2">Add 0.125" margin for edge-to-edge designs</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={bookSettings.hasISBN}
                  onCheckedChange={(v) => setBookSettings((prev: any) => ({ ...prev, hasISBN: v }))}
                  className="data-[state=checked]:bg-cyan-600"
                />
                <span className="text-white">Include ISBN Barcode</span>
                <span className="text-xs text-gray-400 ml-2">Reserve space for ISBN on back cover</span>
              </div>
            </div>
          </AccordionStep>

          {/* Step 5: Dimensions (read-only summary) */}
          <AccordionStep
            open={activeStep === 4}
            onClick={() => goToStep(4)}
            icon={<Sparkles className="w-5 h-5 text-cyan-400" />}
            label="Dimensions"
            description="Summary of your selections."
            help="These are the final cover dimensions based on your settings."
          >
            <div className="bg-gray-800/60 rounded-lg p-4 mt-2">
              <div className="text-white font-mono text-lg mb-2">{getSummary(bookSettings)}</div>
              <div className="text-xs text-gray-400">Your cover will be generated based on these settings.</div>
            </div>
          </AccordionStep>
        </div>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={prevStep} disabled={activeStep === 0}>Previous</Button>
          <Button variant="default" onClick={nextStep} disabled={activeStep === steps.length - 1}>Next</Button>
        </div>
        {isRecommended && (
          <div className="mt-4 flex items-center gap-2 text-cyan-400 bg-cyan-900/20 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>This is the most common KDP setup!</span>
          </div>
        )}
      </div>
      {/* Live Summary Card */}
      <div className="w-full md:w-80 flex-shrink-0">
        <div className="sticky top-4 bg-gray-900/80 border border-gray-800 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" /> Live Summary
          </h3>
          <div className="text-cyan-200 font-mono mb-2">{getSummary(bookSettings)}</div>
          <Separator className="my-2" />
          <div className="text-xs text-gray-400 mb-2">
            <b>Why these settings?</b> <br />
            KDP recommends 6×9, white paper, 100 pages for most genres. Adjust as needed for your project.
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-xs text-gray-300">
            <b>Did you know?</b> You can always change these settings later before publishing.
          </div>
        </div>
      </div>
    </div>
  );
};

// AccordionStep helper
function AccordionStep({ open, onClick, icon, label, description, help, children, recommended }: any) {
  return (
    <div>
      <button
        type="button"
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 bg-transparent hover:bg-gray-800/40 transition rounded-t-xl",
          open && "bg-gray-800/60"
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-white">{label}</span>
          {recommended && (
            <span className="ml-2 text-xs text-cyan-400 bg-cyan-900/30 rounded px-2 py-0.5">Recommended</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{description}</span>
          {open ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-cyan-400" />}
        </div>
      </button>
      {open && (
        <div className="px-6 pb-4 pt-2 bg-gray-800/40 rounded-b-xl">
          {children}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <Info className="w-4 h-4 text-cyan-400" />
            {help}
          </div>
        </div>
      )}
    </div>
  );
}

export default BookSettingsStep; 