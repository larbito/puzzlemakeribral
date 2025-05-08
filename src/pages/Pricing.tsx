import { Check, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Helper for yes/no features
const yes = <span className="text-green-500 font-bold">✅</span>;
const no = <span className="text-gray-400 font-bold">—</span>;

const pricingFeatures = [
  { feature: 'Monthly Price', values: ['$0', '$19/mo', '$49/mo', '$99/mo'] },
  { feature: 'Puzzles per Month', values: ['15', '100', '500', '1000'] },
  { feature: 'AI Coloring Pages', values: ['3', '50', '200', '1000'] },
  { feature: 'T-shirt Designs', values: ['3', '50', '200', '1000'] },
  { feature: 'Puzzle Types', values: ['4 basic', yes, yes, yes] },
  { feature: 'Export Formats', values: ['PDF only', 'PDF + PNG', 'PDF + SVG', 'All formats'] },
  { feature: 'Vector Downloads', values: [no, 'Limited', yes, yes] },
  { feature: 'Commercial-Safe Prompts', values: [no, yes, yes, yes] },
  { feature: 'Keyword Planner', values: ['Basic', yes, yes, 'Team sync'] },
  { feature: 'KDP Price Calculator', values: [yes, yes, yes, yes] },
  { feature: 'Content Planner', values: [no, yes, yes, 'Priority DB'] },
  { feature: 'Project Library Limit', values: ['3 Projects', '25 Projects', '100 Projects', 'Unlimited'] },
  { feature: 'Team Access', values: [no, no, no, '3 seats'] },
  { feature: 'Support', values: ['Email', 'Chat', 'Priority', '1:1 onboarding'] },
];

const planNames = ['Free', 'Starter', 'Pro', 'Agency'];
const planPopular = [false, true, false, false];
const planButtons = [
  { text: 'Start Free', variant: 'outline' },
  { text: 'Upgrade to Starter', variant: 'default' },
  { text: 'Go Pro', variant: 'default' },
  { text: 'Start Agency Plan', variant: 'default' },
];

const addOns = [
  { name: '+50 AI Images', price: '$5 one-time' },
  { name: '+100 Puzzle Credits', price: '$2 one-time' },
  { name: 'Extra Team Member', price: '$9/mo' },
  { name: 'Dedicated GPU', price: '$29/mo' },
  { name: 'White-label Branding', price: '$49/mo' },
];

export const Pricing = () => {
  return (
    <div className="min-h-screen py-20 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-50" />
      <div className="absolute inset-0 bg-gradient-radial from-secondary/5 via-transparent to-transparent translate-x-full opacity-50" />
      <div className="absolute inset-0 bg-grid-white/[0.02]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center space-y-8 mb-16">
          <div className="inline-block">
            <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 px-4 py-2 rounded-full">
              <Star className="w-5 h-5 text-primary" fill="currentColor" />
              <span className="text-primary font-medium">Simple, transparent pricing</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Choose Your Plan
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free. Upgrade as you grow. No hidden fees. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-0 rounded-2xl overflow-hidden shadow-xl bg-background/80">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 text-lg font-semibold text-left py-4 px-4 bg-background/90 border-r border-border">Feature</th>
                {planNames.map((name, idx) => (
                  <th key={name} className="relative text-lg font-semibold text-center py-8 px-4 bg-background/90 border-r border-border overflow-visible">
                    <div className="flex flex-col items-center relative">
                      {planPopular[idx] && (
                        <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-20">
                          <div className="px-4 py-1 bg-primary text-background rounded-full text-xs font-bold shadow-lg border-2 border-primary">
                            Most Popular
                          </div>
                        </div>
                      )}
                      <span className="mt-2 text-xl font-bold">{name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricingFeatures.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-background/70' : 'bg-background/50'}>
                  <td className="sticky left-0 z-10 py-4 px-4 text-left font-medium text-foreground/90 border-r border-border bg-background/80">{row.feature}</td>
                  {row.values.map((val, idx) => (
                    <td key={idx} className="py-4 px-4 text-center border-r border-border text-lg group hover:bg-primary/10 transition-colors duration-200">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Plan Buttons Row */}
              <tr className="bg-background/80">
                <td></td>
                {planButtons.map((btn, idx) => (
                  <td key={idx} className="py-6 text-center">
                    <Button variant={btn.variant as any} className="w-full max-w-[180px] mx-auto text-base font-semibold shadow-md hover:scale-105 transition-transform">
                      {btn.text}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Add-ons Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">Add-ons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {addOns.map((addon, index) => (
              <div key={index} className="bg-white/[0.03] backdrop-blur-sm border border-white/10 p-4 rounded-xl text-center">
                <div className="font-semibold text-white mb-1">{addon.name}</div>
                <div className="text-primary">{addon.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-12 text-center text-lg text-muted-foreground">
          Start free. Upgrade as you grow. No hidden fees. Cancel anytime.
        </div>
      </div>
    </div>
  );
}; 