import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { ArrowRight, Wand2, Palette, BookOpen, Image, CheckCircle, Gauge, ShieldCheck, Workflow, CircleDollarSign, Users, Cpu } from 'lucide-react';

const features = [
  { icon: <Wand2 className="w-5 h-5" />, title: 'AI-first workflow', desc: 'Generate books, covers, shirts and more in minutes.' },
  { icon: <Palette className="w-5 h-5" />, title: 'On-brand styles', desc: 'Curated presets and custom styles that match your niche.' },
  { icon: <Image className="w-5 h-5" />, title: 'Live preview', desc: 'See changes instantly before you export.' },
  { icon: <ShieldCheck className="w-5 h-5" />, title: 'Commercial use', desc: 'Licensing for Amazon KDP, Etsy, Redbubble and more.' },
  { icon: <Gauge className="w-5 h-5" />, title: 'KDP-ready exports', desc: 'CMYK PDF, SVG, PNG — all print-ready.' },
  { icon: <Cpu className="w-5 h-5" />, title: 'Reliable infra', desc: 'Fast generation with modern, scalable APIs.' },
];

const products = [
  { title: 'Puzzle Book Generator', desc: 'Word search, Sudoku and more. KDP-ready.', href: '/dashboard/puzzle-generator', icon: <BookOpen className="w-6 h-6" /> },
  { title: 'AI Coloring Pages', desc: 'Prompt to clean B/W vector pages.', href: '/dashboard/coloring', icon: <Palette className="w-6 h-6" /> },
  { title: 'Cover Designer', desc: 'Full-wrap covers sized for trim + pages.', href: '/dashboard/kdp-covers', icon: <Image className="w-6 h-6" /> },
];

const steps = [
  { title: 'Describe it', desc: 'Pick a product and add a short prompt.', icon: <Wand2 className="w-5 h-5" /> },
  { title: 'Refine', desc: 'Choose style, size and options with sensible defaults.', icon: <Palette className="w-5 h-5" /> },
  { title: 'Preview', desc: 'Review layouts and iterate instantly.', icon: <Image className="w-5 h-5" /> },
  { title: 'Export', desc: 'Download print‑ready files for KDP/POD.', icon: <CheckCircle className="w-5 h-5" /> },
];

const pricing = [
  { name: 'Starter', price: '$19/mo', points: ['100 puzzle pages', '50 coloring pages', '5 covers', 'Commercial use'] },
  { name: 'Pro', price: '$49/mo', points: ['500 puzzle pages', '200 coloring pages', '50 covers', 'Priority support'] },
  { name: 'Agency', price: '$99/mo', points: ['1,000+ for each tool', 'Team seats', 'Unlimited vectors', 'White label'] },
];

export const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <Section bg="gradient" className="pt-28">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">
              <Users className="w-4 h-4" /> Built for KDP and POD creators
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight">
              Create professional POD products with AI — fast
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Design puzzle books, coloring pages and full‑wrap covers with clean previews and print‑ready exports.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button size="lg" className="min-w-[180px]">
                  Start free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="min-w-[180px]">
                  Explore features
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* Feature highlights */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="hover:border-primary/40 transition-colors">
                <CardHeader>
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    {f.icon}
                  </div>
                  <CardTitle className="mt-3 text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Products */}
      <Section bg="muted">
        <Container>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-semibold">What you can build</h2>
            <Link to="/features" className="text-sm text-primary hover:underline">See all features</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((p, i) => (
              <Link key={i} to={p.href} className="block group">
                <Card className="h-full hover:border-primary/40 transition-colors">
                  <CardHeader>
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                      {p.icon}
                    </div>
                    <CardTitle className="mt-3 text-lg">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* How it works */}
      <Section>
        <Container>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-semibold">How it works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <Card key={i} className="hover:border-primary/40 transition-colors">
                <CardHeader className="space-y-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    {s.icon}
                  </div>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Pricing */}
      <Section bg="muted">
        <Container>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-semibold">Simple pricing</h2>
            <span className="text-sm text-muted-foreground inline-flex items-center gap-1"><CircleDollarSign className="w-4 h-4" /> Cancel anytime</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <Card key={plan.name} className="hover:border-primary/40 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">{plan.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary" /> {pt}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4">Choose {plan.name}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section>
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold">Launch your next product today</h3>
            <p className="mt-3 text-muted-foreground">
              Join thousands of creators who design and publish with PuzzleCraft Forge.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button size="lg">Get started</Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">View pricing</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
};
