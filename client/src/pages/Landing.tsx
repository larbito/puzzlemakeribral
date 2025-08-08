import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import {
  ArrowRight,
  Sparkles,
  Star,
  Brain,
  Wand2,
  Palette,
  BookOpen,
  Shirt,
  CheckCircle,
  Image,
  Gauge,
  ShieldCheck,
  Users,
} from 'lucide-react';

const FloatingEmoji = ({ emoji, className = '' }: { emoji: string; className?: string }) => (
  <div className={`pointer-events-none select-none absolute text-4xl ${className}`}>{emoji}</div>
);

const featureBullets = [
  { icon: <Wand2 className="w-5 h-5" />, title: 'Generative tools', desc: 'AI-first creation for books, covers, shirts and more.' },
  { icon: <Palette className="w-5 h-5" />, title: 'Style presets', desc: 'On-brand themes and typography you can trust.' },
  { icon: <Image className="w-5 h-5" />, title: 'Live previews', desc: 'Confident editing with instant feedback.' },
  { icon: <ShieldCheck className="w-5 h-5" />, title: 'Commercial-safe', desc: 'Ready for KDP, Etsy, Redbubble and more.' },
  { icon: <Gauge className="w-5 h-5" />, title: 'Print-ready exports', desc: 'CMYK PDF, SVG, and PNG built-in.' },
  { icon: <Users className="w-5 h-5" />, title: 'Built for teams', desc: 'Save projects, collaborate, reuse prompts.' },
];

const productCards = [
  { title: 'Puzzle Books', desc: 'Word Search, Sudoku, Crosswords and more — with solutions.', icon: <BookOpen className="w-6 h-6" />, href: '/dashboard/puzzle-generator' },
  { title: 'Coloring Pages', desc: 'Clean, black & white vectors from a simple prompt.', icon: <Palette className="w-6 h-6" />, href: '/dashboard/coloring' },
  { title: 'Cover Designer', desc: 'Full-wrap covers, sized by trim and page count.', icon: <Image className="w-6 h-6" />, href: '/dashboard/kdp-covers' },
  { title: 'T-Shirt Designs', desc: 'Print-ready 4500×5400 designs with text + graphics.', icon: <Shirt className="w-6 h-6" />, href: '/dashboard/t-shirts' },
];

const steps = [
  { title: 'Describe', desc: 'Pick a product and write a short prompt.', icon: <Wand2 className="w-5 h-5" /> },
  { title: 'Refine', desc: 'Choose style, size and options that fit your niche.', icon: <Palette className="w-5 h-5" /> },
  { title: 'Preview', desc: 'Iterate quickly with instant visual feedback.', icon: <Image className="w-5 h-5" /> },
  { title: 'Export', desc: 'Download clean, print‑ready files.', icon: <CheckCircle className="w-5 h-5" /> },
];

const pricing = [
  { name: 'Starter', price: '$19/mo', points: ['100 puzzle pages', '50 coloring pages', '5 covers', 'Commercial use'] },
  { name: 'Pro', price: '$49/mo', points: ['500 puzzle pages', '200 coloring pages', '50 covers', 'Priority support'] },
  { name: 'Agency', price: '$99/mo', points: ['1,000+ for each tool', 'Team seats', 'Unlimited vectors', 'White label'] },
];

export const Landing = () => {
  return (
    <div className="relative">
      {/* HERO */}
      <Section bg="gradient" className="pt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <FloatingEmoji emoji="🧩" className="top-16 left-[12%] animate-float" />
        <FloatingEmoji emoji="✨" className="top-28 right-[18%] animate-float-reverse" />
        <FloatingEmoji emoji="📚" className="bottom-12 left-[22%] animate-float-slow" />
        <FloatingEmoji emoji="🎯" className="top-44 right-[30%] animate-float" />

        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">
              <Sparkles className="w-4 h-4" /> AI tools for KDP & POD creators
            </span>
            <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight">
              Professional print‑on‑demand products — powered by AI
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Design puzzle books, coloring pages, covers and shirts with live previews and print‑ready exports.
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {[{n:'120K+',l:'Designs'},{n:'25K+',l:'Creators'},{n:'500+',l:'Niches'},{n:'4.9',l:'Avg Rating'}].map((s) => (
                <Card key={s.l} className="text-center">
                  <CardContent className="py-6">
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                      {s.n}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{s.l}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* FEATURE HIGHLIGHTS */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureBullets.map((f) => (
              <Card key={f.title} className="hover:border-primary/40 transition-colors">
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

      {/* PRODUCTS */}
      <Section bg="muted">
        <Container>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-semibold">What you can build</h2>
            <Link to="/features" className="text-sm text-primary hover:underline">See all features</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productCards.map((p) => (
              <Link key={p.title} to={p.href} className="block group">
                <Card className="h-full relative overflow-hidden hover:border-primary/40 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="relative">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                      {p.icon}
                    </div>
                    <CardTitle className="mt-3 text-lg">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative pb-6">
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* HOW IT WORKS */}
      <Section>
        <Container>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-semibold">How it works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <Card key={s.title} className="hover:border-primary/40 transition-colors">
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

      {/* TESTIMONIALS (compact) */}
      <Section bg="muted">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-primary" /> Loved by creators
            </div>
            <h3 className="text-3xl font-bold mt-4">“It saves us hours every week.”</h3>
            <p className="mt-2 text-muted-foreground">Teachers, publishers and POD sellers use our tools to ship faster.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map((i) => (
              <Card key={i} className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                <CardContent className="p-6 relative">
                  <p className="text-sm text-muted-foreground">
                    “PuzzleCraft Forge has transformed our production process — the previews and exports are spot on.”
                  </p>
                  <div className="mt-4 text-sm">— Verified user</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* PRICING */}
      <Section>
        <Container>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-semibold">Simple pricing</h2>
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
          <div className="text-center text-sm text-muted-foreground mt-6">Start free. Cancel anytime.</div>
        </Container>
      </Section>

      {/* FINAL CTA */}
      <Section bg="muted">
        <Container>
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
              <Brain className="w-4 h-4 text-primary" /> Ready to build?
            </div>
            <h3 className="text-3xl font-bold mt-4">Launch your next product today</h3>
            <p className="mt-2 text-muted-foreground">
              Join thousands of creators publishing with PuzzleCraft Forge.
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
