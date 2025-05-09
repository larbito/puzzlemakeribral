import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator,
  DollarSign,
  BookOpen,
  Printer,
  FileText,
  Globe,
  TrendingUp,
  Info,
  ChevronRight,
  Sparkles,
  CircleDollarSign,
  BookText,
  Coins,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MotionCard = motion(Card);

interface MarketplaceInfo {
  name: string;
  currency: string;
  symbol: string;
  minPrice: number;
  maxPrice: number;
  deliveryCost: number;
  exchangeRate: number;
}

const marketplaces: Record<string, MarketplaceInfo> = {
  'amazon.com': {
    name: 'Amazon.com (US)',
    currency: 'USD',
    symbol: '$',
    minPrice: 2.99,
    maxPrice: 249.99,
    deliveryCost: 0.85,
    exchangeRate: 1
  },
  'amazon.co.uk': {
    name: 'Amazon UK',
    currency: 'GBP',
    symbol: '£',
    minPrice: 1.99,
    maxPrice: 199.99,
    deliveryCost: 0.70,
    exchangeRate: 0.79
  },
  'amazon.de': {
    name: 'Amazon Germany',
    currency: 'EUR',
    symbol: '€',
    minPrice: 2.99,
    maxPrice: 249.99,
    deliveryCost: 0.75,
    exchangeRate: 0.91
  },
  'amazon.fr': {
    name: 'Amazon France',
    currency: 'EUR',
    symbol: '€',
    minPrice: 2.99,
    maxPrice: 249.99,
    deliveryCost: 0.75,
    exchangeRate: 0.91
  },
  'amazon.es': {
    name: 'Amazon Spain',
    currency: 'EUR',
    symbol: '€',
    minPrice: 2.99,
    maxPrice: 249.99,
    deliveryCost: 0.75,
    exchangeRate: 0.91
  }
};

export const KDPRoyaltiesCalculator = () => {
  const [marketplace, setMarketplace] = useState<string>('amazon.com');
  const [listPrice, setListPrice] = useState<string>('9.99');
  const [pageCount, setPageCount] = useState<string>('100');
  const [isPremiumColor, setIsPremiumColor] = useState<boolean>(false);
  const [royaltyPlan, setRoyaltyPlan] = useState<'70' | '35'>('70');
  const [royalty, setRoyalty] = useState<number>(0);
  const [printingCost, setPrintingCost] = useState<number>(0);

  const calculatePrintingCost = (pages: number, isColor: boolean): number => {
    const perPageCost = isColor ? 0.07 : 0.012;
    return Number((pages * perPageCost + marketplaces[marketplace].deliveryCost).toFixed(2));
  };

  const calculateRoyalty = () => {
    const price = Number(listPrice);
    const pages = Number(pageCount);
    
    if (isNaN(price) || isNaN(pages)) return;

    const printing = calculatePrintingCost(pages, isPremiumColor);
    setPrintingCost(printing);

    let calculatedRoyalty = 0;
    if (royaltyPlan === '70') {
      calculatedRoyalty = price * 0.7 - printing;
    } else {
      calculatedRoyalty = price * 0.35 - printing;
    }

    setRoyalty(Number(calculatedRoyalty.toFixed(2)));
  };

  useEffect(() => {
    calculateRoyalty();
  }, [marketplace, listPrice, pageCount, isPremiumColor, royaltyPlan]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center p-2 rounded-2xl bg-primary/10 backdrop-blur-sm border border-primary/20"
          >
            <Coins className="h-6 w-6 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
            KDP Royalties Calculator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Optimize your book pricing strategy with our advanced KDP royalties calculator
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Input Section - 5 columns */}
          <div className="lg:col-span-5 space-y-6">
            <MotionCard 
              className="overflow-hidden border-none shadow-xl bg-white/5 backdrop-blur-xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookText className="h-5 w-5 text-primary" />
                  Book Specifications
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Marketplace Selector */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Marketplace</Label>
                  <Select
                    value={marketplace}
                    onValueChange={setMarketplace}
                  >
                    <SelectTrigger className="h-12 bg-white/5 border-primary/20 hover:border-primary/40 transition-colors">
                      <Globe className="h-4 w-4 text-primary mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(marketplaces).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          {info.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">List Price</Label>
                  <div className="relative">
                    <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input
                      type="number"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      className="h-12 pl-10 bg-white/5 border-primary/20 hover:border-primary/40 transition-colors"
                      step="0.01"
                      min={marketplaces[marketplace].minPrice}
                      max={marketplaces[marketplace].maxPrice}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Price range: {marketplaces[marketplace].symbol}{marketplaces[marketplace].minPrice} - {marketplaces[marketplace].symbol}{marketplaces[marketplace].maxPrice}
                  </p>
                </div>

                {/* Page Count Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Number of Pages</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    <Input
                      type="number"
                      value={pageCount}
                      onChange={(e) => setPageCount(e.target.value)}
                      className="h-12 pl-10 bg-white/5 border-primary/20 hover:border-primary/40 transition-colors"
                      min="1"
                      max="999"
                    />
                  </div>
                </div>

                {/* Print Options */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Print Options</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={() => setIsPremiumColor(false)}
                      className={cn(
                        "relative overflow-hidden rounded-xl border transition-all duration-300",
                        !isPremiumColor
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white/5 hover:bg-white/10 border-primary/20"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative z-10 p-4">
                        <div className="font-medium">Black & White</div>
                        <div className="text-sm opacity-80">$0.012 per page</div>
                      </div>
                      {!isPremiumColor && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary"
                          layoutId="activeOption"
                        />
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => setIsPremiumColor(true)}
                      className={cn(
                        "relative overflow-hidden rounded-xl border transition-all duration-300",
                        isPremiumColor
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white/5 hover:bg-white/10 border-primary/20"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative z-10 p-4">
                        <div className="font-medium">Premium Color</div>
                        <div className="text-sm opacity-80">$0.07 per page</div>
                      </div>
                      {isPremiumColor && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary"
                          layoutId="activeOption"
                        />
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Royalty Plan */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Royalty Plan</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={() => setRoyaltyPlan('70')}
                      className={cn(
                        "relative overflow-hidden rounded-xl border transition-all duration-300",
                        royaltyPlan === '70'
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white/5 hover:bg-white/10 border-primary/20"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative z-10 p-4">
                        <div className="font-medium">70% Royalty</div>
                        <div className="text-sm opacity-80">Higher earnings</div>
                      </div>
                      {royaltyPlan === '70' && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary"
                          layoutId="activeRoyalty"
                        />
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => setRoyaltyPlan('35')}
                      className={cn(
                        "relative overflow-hidden rounded-xl border transition-all duration-300",
                        royaltyPlan === '35'
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white/5 hover:bg-white/10 border-primary/20"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="relative z-10 p-4">
                        <div className="font-medium">35% Royalty</div>
                        <div className="text-sm opacity-80">More flexibility</div>
                      </div>
                      {royaltyPlan === '35' && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary"
                          layoutId="activeRoyalty"
                        />
                      )}
                    </motion.button>
                  </div>
                </div>
              </CardContent>
            </MotionCard>
          </div>

          {/* Results Section - 7 columns */}
          <div className="lg:col-span-7 space-y-6">
            <MotionCard 
              className="overflow-hidden border-none shadow-xl bg-white/5 backdrop-blur-xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Calculated Royalties
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Main Royalty Display */}
                <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
                  <div className="absolute top-0 right-0 p-4">
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Estimated Royalty Per Book</div>
                    <motion.div 
                      key={royalty}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-5xl font-bold tracking-tight text-primary"
                    >
                      {marketplaces[marketplace].symbol}{Math.max(0, royalty).toFixed(2)}
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {royalty < 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 flex items-center gap-2 text-sm text-red-500"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Printing costs exceed your royalty amount
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Breakdown */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Detailed Breakdown</h3>
                  <div className="space-y-3">
                    <motion.div 
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-primary/20"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CircleDollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">List Price</div>
                          <div className="text-sm text-muted-foreground">Your set price</div>
                        </div>
                      </div>
                      <div className="text-xl font-medium">
                        {marketplaces[marketplace].symbol}{listPrice}
                      </div>
                    </motion.div>

                    <motion.div 
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-primary/20"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Printer className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Printing Cost</div>
                          <div className="text-sm text-muted-foreground">Production expenses</div>
                        </div>
                      </div>
                      <div className="text-xl font-medium">
                        {marketplaces[marketplace].symbol}{printingCost.toFixed(2)}
                      </div>
                    </motion.div>

                    <motion.div 
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-primary/20"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Marketplace</div>
                          <div className="text-sm text-muted-foreground">Sales region</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{marketplaces[marketplace].name}</div>
                        <div className="text-sm text-muted-foreground">{marketplaces[marketplace].currency}</div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-xl border border-primary/20 p-4 bg-primary/5">
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-primary mb-1">Important Note</p>
                      <p>These calculations are estimates and may vary based on factors such as market conditions, promotional pricing, and Amazon's policies.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </MotionCard>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 