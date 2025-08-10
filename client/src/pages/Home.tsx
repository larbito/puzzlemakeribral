import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight,
  Wand2,
  Layout,
  Share2,
  BookOpen,
  PuzzleIcon,
  Star,
  CheckCircle,
  PenTool,
  BookTemplate,
  Calculator,
  Sparkles,
  Palette,
  ListTodo,
  DollarSign,
  Grid,
  Clock,
  Brain,
  Puzzle,
  Search,
  Target,
  Flower2,
  ImageIcon,
  KeyRound,
  Grid3X3,
  FileText,
  Image,
  HelpCircle,
  DoorOpen,
  MapPin,
  Plus,
  Type,
  Layers,
  Calendar,
  BookOpenCheck,
  ShoppingBag,
  CircleDollarSign,
  ShoppingCart,
  Shirt,
  Printer
} from 'lucide-react';
import { Shuffle } from "@phosphor-icons/react";
import SocialProof from '@/components/SocialProof';

// Stats data
const stats = [
  { number: "120K+", label: "Designs Created" },
  { number: "25K+", label: "POD Sellers Helped" },
  { number: "500+", label: "Niches Supported" },
  { number: "4.9", label: "Average User Rating" },
];

// Features data
const features = [
  {
    title: "AI-Powered Generation",
    description: "Create unique puzzles instantly with our advanced AI algorithms.",
    icon: <Wand2 className="w-6 h-6 text-primary" />,
  },
  {
    title: "Smart Recommendations",
    description: "Get personalized puzzle book suggestions based on your needs.",
    icon: <Layout className="w-6 h-6 text-primary" />,
  },
  {
    title: "Easy Export",
    description: "Export your puzzles in multiple formats and share them easily.",
    icon: <Share2 className="w-6 h-6 text-primary" />,
  },
];

// Additional features data
const additionalFeatures = [
  {
    title: "AI-Powered Coloring Pages",
    description: "Transform any image into beautiful coloring pages with our AI technology.",
    icon: <Palette className="w-12 h-12 text-primary" />,
    comingSoon: false
  },
  {
    title: "Content Planning Tools",
    description: "Plan and organize your puzzle book content with our intuitive tools.",
    icon: <ListTodo className="w-12 h-12 text-primary" />,
    comingSoon: false
  },
  {
    title: "KDP Book Pricing Calculator",
    description: "Optimize your book pricing for maximum profits on Amazon KDP.",
    icon: <Calculator className="w-12 h-12 text-primary" />,
    comingSoon: true
  },
  {
    title: "Multiple Puzzle Types",
    description: "Choose from word search, crosswords, sudoku, mazes, and more.",
    icon: <Grid className="w-12 h-12 text-primary" />,
    comingSoon: false
  }
];

// Pricing plans data
const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "month",
    description: "Perfect to explore the platform before committing",
    features: [
      "Generate up to 15 puzzle pages/month",
      "Get 3 AI coloring pages",
      "Create 3 T-shirt designs",
      "Create 1 book cover",
      "Export puzzles as PDF",
      "Access KDP & Merch royalty calculators",
      "No access to content planner",
      "No vector, transparent, or CMYK exports",
      "No commercial-safe prompts",
      "No support or team features"
    ],
    buttonText: "Start Free",
    buttonVariant: "outline" as const
  },
  {
    name: "Starter",
    price: "$19",
    period: "month",
    description: "For new POD sellers and part-time creators",
    features: [
      "Generate up to 100 puzzle pages/month",
      "50 AI coloring pages/month",
      "50 T-shirt designs/month",
      "5 book covers/month",
      "Export as PDF, PNG",
      "Limited vector downloads",
      "Enable commercial-safe prompts",
      "Access content planner + keyword ideas",
      "Save 25 projects",
      "Basic support included"
    ],
    buttonText: "Upgrade to Starter",
    buttonVariant: "default" as const,
    popular: true
  },
  {
    name: "Pro",
    price: "$49",
    period: "month",
    description: "For growing KDP, Merch, and Etsy sellers",
    features: [
      "500 puzzle pages/month",
      "200 AI coloring pages/month",
      "200 T-shirt designs/month",
      "50 book covers/month",
      "Full export: PDF, SVG, PNG, CMYK PDF",
      "Unlimited vector access",
      "Auto-generate titles, keywords, descriptions",
      "Track and reuse top-performing prompts",
      "Access full content + keyword tools",
      "Save 100 projects",
      "Priority support"
    ],
    buttonText: "Go Pro",
    buttonVariant: "default" as const
  },
  {
    name: "Agency",
    price: "$99",
    period: "month",
    description: "Built for teams, agencies, and multi-brand sellers",
    features: [
      "1000 puzzle pages/month",
      "1000 coloring pages/month",
      "1000 T-shirt designs/month",
      "200 book covers/month",
      "All file formats unlocked",
      "Unlimited project storage",
      "3 user seats with shared dashboard",
      "Share projects with team",
      "1:1 onboarding support",
      "All Pro features included"
    ],
    buttonText: "Start Agency Plan",
    buttonVariant: "default" as const
  }
];

// Add-ons data
const addOns = [
  { name: "+50 AI Images", price: "$5 one-time" },
  { name: "+100 Puzzle Credits", price: "$2 one-time" },
  { name: "Extra Team Member", price: "$9/mo" },
  { name: "Dedicated GPU", price: "$29/mo" },
  { name: "White-label Branding", price: "$49/mo" }
];

// Testimonials data
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Elementary Teacher",
    location: "Boston, MA",
    avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Sarah&backgroundColor=b6e3f4",
    content: "PuzzleCraft Forge has revolutionized how I create educational materials. The AI-powered generation saves me hours of work, and my students love the engaging puzzles!",
    rating: 5,
    verified: true
  },
  {
    name: "Mike Chen",
    role: "Content Creator",
    location: "San Francisco, CA",
    avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Mike&backgroundColor=c0aede",
    content: "I've published three successful puzzle books using this platform. The quality and variety of puzzles is outstanding, and the KDP integration makes publishing a breeze.",
    rating: 5,
    verified: true
  },
  {
    name: "Emily Davis",
    role: "Educational Publisher",
    location: "London, UK",
    avatar: "https://api.dicebear.com/7.x/lorelei/svg?seed=Emily&backgroundColor=ffdfbf",
    content: "The AI recommendations are spot-on! The platform understands exactly what type of puzzles work best for our educational content. It's made our production process so much more efficient.",
    rating: 5,
    verified: true
  }
];

// FAQ data
const faqs = [
  {
    question: "What can I create with this platform?",
    answer: "You can generate puzzle books, coloring pages, full book covers, and T-shirt designs using AI — all optimized for platforms like Amazon KDP, Merch by Amazon, Etsy, and Redbubble."
  },
  {
    question: "Are the designs commercial-use friendly?",
    answer: "Yes. All designs you generate with a Pro or Agency plan come with full commercial-use rights. You can safely publish and sell them on any POD marketplace."
  },
  {
    question: "What file formats do you support?",
    answer: "We support PDF, PNG, JPG, and SVG. For Pro and Agency users, we also offer CMYK and vector exports for professional printing."
  },
  {
    question: "Do I need design skills to use it?",
    answer: "No. Just enter your idea or niche, and the AI does the rest. The tools are beginner-friendly and require zero technical or graphic design background."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. You can downgrade or cancel your plan at any time — no contracts or hidden fees."
  }
];

// Add new data array before the Home component
const upcomingPuzzles = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Logic Puzzles",
    description: "Challenge your brain with deductive reasoning puzzles",
    category: "thinking"
  },
  {
    icon: <Puzzle className="w-8 h-8" />,
    title: "Mazes",
    description: "Generate complex mazes with adjustable difficulty",
    category: "spatial"
  },
  {
    icon: <KeyRound className="w-8 h-8" />,
    title: "Cryptograms",
    description: "Create encoded messages for players to decipher",
    category: "word"
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "Connect the Dots",
    description: "Fun picture-revealing puzzles for all ages",
    category: "visual"
  },
  {
    icon: <Flower2 className="w-8 h-8" />,
    title: "Word Flower",
    description: "Create word flower puzzles with customizable difficulty",
    category: "word"
  },
  {
    icon: <ImageIcon className="w-8 h-8" />,
    title: "Jigsaw",
    description: "Generate jigsaw puzzles with customizable images",
    category: "visual"
  },
  {
    icon: <Grid3X3 className="w-8 h-8" />,
    title: "Codeword",
    description: "Create codeword puzzles with adjustable difficulty",
    category: "word"
  },
  {
    icon: <Grid3X3 className="w-8 h-8" />,
    title: "Kriss Kross",
    description: "Generate kriss kross word puzzles with custom settings",
    category: "word"
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Wordrow",
    description: "Create wordrow puzzles with adjustable difficulty",
    category: "word"
  },
  {
    icon: <Image className="w-8 h-8" />,
    title: "Picduko",
    description: "Generate picduko puzzles with custom settings",
    category: "visual"
  },
  {
    icon: <HelpCircle className="w-8 h-8" />,
    title: "Brain Teasers",
    description: "Challenging puzzles that test your lateral thinking skills",
    category: "thinking"
  },
  {
    icon: <DoorOpen className="w-8 h-8" />,
    title: "Escape Rooms",
    description: "Digital escape room puzzles with immersive storylines",
    category: "adventure"
  }
];

interface FloatingEmojiProps {
  emoji: string;
  className?: string;
}

const FloatingEmoji = ({ emoji, className = "" }: FloatingEmojiProps) => (
  <div className={`absolute text-4xl ${className}`}>
    {emoji}
  </div>
);

// Brand Logo components
const RedbubbleLogo = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <circle cx="100" cy="100" r="80" fill="#E41321"/>
    <path d="M70 80H100C110 80 120 90 120 100C120 110 110 120 100 120H70V80ZM100 140H120C130 140 140 130 140 120C140 110 130 100 120 100H100V140Z" fill="white"/>
  </svg>
);

const EtsyLogo = () => (
  <svg viewBox="0 0 500 200" className="w-full h-full">
    <path d="M56.6 50h38.8v12.8H74.1v38.9h31.6v12.8H74.1V169h21.3v12.8H56.6V50zm89.3 87.8c-3.2 1.9-9.1 3.7-15.5 3.7-17.5 0-29.4-13.4-29.4-34 0-21.4 12.8-35.1 31.1-35.1 5.9 0 11.5 1.5 14.9 3.7l-2.8 12.8c-2.6-1.9-6.9-3.1-11.9-3.1-9.7 0-16.6 9.1-16.6 21.3 0 12.6 7.1 21.2 16.7 21.2 4.5 0 9-1.2 11.9-3.1l1.6 12.6zm53.7-45.2h-21.5v30.9c0 10.7 3.8 16 11.5 16 3.5 0 6.2-.4 7.9-1l.1 12.6c-2.6 1-7 1.7-12.2 1.7-12.4 0-19.8-7.5-19.8-26.5v-33.7h-12.8V79.5h12.8v-15l12.6-3.8v18.8h21.5v13.1h-.1zm73.5 58.5h-12.6v-47.8c0-10-3.9-14.9-11.7-14.9-12 0-16.9 10.2-16.9 22v40.6h-12.6V51.8h12.6v31.5c4.6-4.5 11.3-7 17.9-7 16.5 0 23.4 11.7 23.4 29.4v45.4h-.1zm75.8-31.1c0 22.2-15.3 32.9-29.7 32.9-16.1 0-28.6-11.8-28.6-31.8 0-20.7 13.1-32.9 29.6-32.9 17.1.1 28.7 12.6 28.7 31.8zm-45.4 0c0 13.1 7.5 20.5 16.3 20.5 9.3 0 16.3-7.4 16.3-20.7 0-9-4.5-20.5-16.1-20.5-11.5.1-16.5 10.7-16.5 20.7z" fill="#F05A28"/>
  </svg>
);

const AmazonKDPLogo = () => (
  <div className="flex items-center">
    <svg viewBox="0 0 400 100" className="w-full h-full">
      <g transform="scale(0.9)">
        <path d="M118.9 84.5c-34.7 25.6-85 39.2-128.2 39.2-60.6 0-115.1-22.4-156.5-59.7-3.2-2.9-.3-6.9 3.5-4.6 44.4 25.8 99.2 41.3 156 41.3 38.2 0 80.3-7.9 119-24.4 5.9-2.6 10.8 3.8 5.2 8.2z" transform="scale(0.5)" fill="#FF9900"/>
        <path d="M132.8 68.2c-4.4-5.7-29.3-2.7-40.5-1.4-3.4.4-3.9-2.6-.8-4.7 19.8-13.9 52.3-9.9 56.1-5.2 3.8 4.7-1 37.4-19.6 53-2.9 2.5-5.6 1.2-4.3-2 4.2-10.5 13.6-34 9.1-39.7z" transform="scale(0.5)" fill="#FF9900"/>
      </g>
      <text x="200" y="60" fill="#FF9900" fontSize="40" fontWeight="bold" textAnchor="middle">Kindle</text>
    </svg>
  </div>
);

const GumroadLogo = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full">
    <circle cx="100" cy="100" r="80" fill="#FF90E8"/>
    <path d="M85 80H115V95H108L120 120H105L90 90V120H75V80H85Z" fill="#000"/>
  </svg>
);

const MerchByAmazonLogo = () => (
  <svg viewBox="0 0 400 100" className="w-full h-full">
    <g transform="scale(0.9) translate(20, 10)">
      <text x="20" y="40" fontSize="32" fill="#FF9900" fontWeight="bold">merch</text>
      <text x="20" y="60" fontSize="16" fill="#333">by</text>
      <text x="45" y="80" fontSize="38" fill="#333" fontWeight="bold">amazon</text>
      <path d="M325 80c-4.4-5.7-29.3-2.7-40.5-1.4-3.4.4-3.9-2.6-.8-4.7 19.8-13.9 52.3-9.9 56.1-5.2 3.8 4.7-1 37.4-19.6 53-2.9 2.5-5.6 1.2-4.3-2 4.2-10.5 13.6-34 9.1-39.7z" transform="scale(0.4)" fill="#FF9900"/>
    </g>
  </svg>
);

const TeespringLogo = () => (
  <svg viewBox="0 0 300 100" className="w-full h-full">
    <g transform="scale(0.85) translate(15, 15)">
      <path d="M20 50C40 20 70 20 90 50" stroke="#FF3366" strokeWidth="12" fill="none"/>
      <path d="M10 50H60" stroke="#FF3366" strokeWidth="10"/>
      <text x="110" y="60" fontSize="32" fill="#333366" fontWeight="bold">Teespring</text>
    </g>
  </svg>
);

export const Home = () => {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 text-center space-y-8 select-text">
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
        
        {/* Floating Puzzle Elements */}
        <FloatingEmoji emoji="🧩" className="top-20 left-[15%] animate-float" />
        <FloatingEmoji emoji="🎮" className="top-40 right-[20%] animate-float-reverse" />
        <FloatingEmoji emoji="📚" className="bottom-20 left-[25%] animate-float-slow" />
        <FloatingEmoji emoji="✨" className="top-32 left-[40%] animate-pulse-glow" />
        <FloatingEmoji emoji="🎯" className="bottom-40 right-[30%] animate-float" />
        <FloatingEmoji emoji="🌟" className="top-60 right-[35%] animate-float-reverse" />

        <div className="inline-block mb-4 shine-effect">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 glass-effect">
            <Sparkles className="w-4 h-4" />
            AI-Powered POD Creation
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="relative text-center">
            <div className="text-4xl font-bold mb-4 title-reveal">
              Create Stunning
            </div>
            
            <div className="relative mb-4">
              <h2 className="text-7xl font-bold bg-gradient-to-r from-yellow-300 via-green-400 to-teal-300 bg-clip-text text-transparent">
                POD Products <span className="inline-block">✨</span>
              </h2>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
              <span className="text-lg font-medium title-reveal" style={{ animationDelay: '0.2s' }}>
                T-Shirts • Puzzle Books • Coloring Pages • Covers
              </span>
            </div>
          </h1>
        </div>

        <p className="text-xl text-foreground max-w-2xl mx-auto">
          Design high-quality print-on-demand content with AI. Perfect for Amazon KDP, Merch by Amazon, Redbubble, and more.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" className="bg-primary text-background hover:bg-primary/90 animate-glow">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/explore">
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
              Explore Ideas
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 select-text">
        <FloatingEmoji emoji="📈" className="top-0 left-[10%] animate-float" />
        <FloatingEmoji emoji="🎯" className="bottom-0 right-[10%] animate-float-reverse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6 shine-effect glass-effect hover:scale-105 transition-transform">
                <h3 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-pulse-glow">
                  {stat.number}
                </h3>
                <p className="text-muted-foreground mt-2">{stat.label}</p>
                {index === 3 && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" />
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Multiple Puzzle Types Section - Redesigned */}
      <section className="relative py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        
        {/* Animated Decorative Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse-slow" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-20">
            <div className="inline-block">
              <span className="bg-primary/10 text-primary px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 glass-effect">
                <PuzzleIcon className="w-5 h-5" />
                AI-Powered POD Creation
              </span>
            </div>
            
            <div>
              <h2 className="text-6xl font-bold">
                <span className="relative">
                  <span className="relative bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                    Create Any Type of POD Product
                  </span>
                </span>
              </h2>
              <p className="mt-6 text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
                Choose from a full range of AI tools to design and publish books, shirts, and more — faster than ever.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "T-shirt AI Design Generator",
                description: "Create unique t-shirt designs with AI. Perfect for POD platforms.",
                icon: <Shirt className="w-8 h-8" />,
                color: "green",
                link: "/t-shirt-generator",
                features: ["Print-ready PNG (4500x5400)", "Text and graphic prompts", "Commercial-safe mode"]
              },
              {
                title: "AI Coloring Book Generator",
                description: "Create unique, kid-friendly coloring books that stand out on Amazon KDP.",
                icon: <Palette className="w-8 h-8" />,
                color: "green",
                link: "/dashboard/coloring",
                features: ["HD vector illustrations", "Age-specific difficulty", "Full KDP formatting"]
              },
              {
                title: "Book Cover AI Generator",
                description: "Create full-wrap book covers sized by trim and page count.",
                icon: <BookOpen className="w-8 h-8" />,
                color: "blue",
                link: "/dashboard/kdp-covers",
                features: ["Auto-size by trim & pages", "Built-in font styles", "CMYK PDF output"]
              },
              {
                title: "Puzzle Book Generator",
                description: "Create puzzle books with Sudoku, Word Search, and Crosswords in seconds.",
                icon: <PuzzleIcon className="w-8 h-8" />,
                color: "yellow",
                link: "/puzzle-generator",
                features: ["Multiple difficulty levels", "KDP-ready formats", "Auto-answer page generation"],
                comingSoon: true,
              },
              {
                title: "Sudoku & Logic Puzzles",
                description: "Generate professional puzzle books with varying difficulty levels.",
                icon: <PenTool className="w-8 h-8" />,
                color: "blue",
                link: "/puzzle-generator",
                features: ["Multiple difficulty levels", "Solution sheets included", "Professional layout"],
                comingSoon: true,
              },
              {
                title: "KDP & Merch Calculators",
                description: "Know exactly what you'll earn before you publish or launch.",
                icon: <Calculator className="w-8 h-8" />,
                color: "pink",
                link: "/calculators",
                features: ["Real-time royalty breakdowns", "Region and trim-size options", "Compare prices across niches"],
                comingSoon: true,
              }
            ].map((product, index) => (
              <Link
                key={index}
                to={product.link}
                className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/10 hover:border-primary/50 transition-all duration-500"
              >
                {product.comingSoon && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/10 text-yellow-300 border border-yellow-300/30">
                      Coming Soon
                    </span>
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br from-${product.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                <div className="relative p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-${product.color}-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                      <div className={`text-${product.color}-500`}>{product.icon}</div>
                    </div>
                    <h3 className="text-2xl font-semibold text-white group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                  </div>
                  
                  <p className="text-white/70 mb-6 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="space-y-2">
                    {product.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2 text-sm text-white/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* T-Shirt AI Design Generator Section - Redesigned */}
      <section className="relative py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/30 via-background to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.8),transparent_50%,rgba(0,0,0,0.8))]" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content Side */}
            <div className="relative z-10 space-y-10">
              <div className="space-y-8">
                <div className="inline-block animate-float">
                  <span className="bg-primary/10 text-primary px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 glass-effect">
                    <Sparkles className="w-5 h-5" />
                    Coming Soon
                  </span>
                </div>

                <h2 className="text-7xl font-bold leading-tight">
                  <div className="relative">
                    <div className="absolute -inset-x-20 -inset-y-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,61,0,0.1),transparent_50%)] animate-pulse-slow"></div>
                    <div className="absolute -inset-x-20 -inset-y-10 bg-[radial-gradient(circle_at_50%_50%,rgba(0,195,255,0.1),transparent_50%)] animate-pulse"></div>
                    
                    <span className="block text-2xl text-white/60 mb-6 title-reveal">Introducing</span>
                    
                    <div className="title-container relative">
                      <div 
                        className="text-6xl font-bold title-gradient title-dynamic title-highlight"
                        data-text="AI POD"
                      >
                        AI POD
                      </div>
                      <div 
                        className="text-6xl font-bold absolute inset-0 title-shadow opacity-50"
                        data-text="AI POD"
                      >
                        AI POD
                      </div>
                    </div>

                    <div className="title-container relative mt-4">
                      <div 
                        className="text-7xl font-bold title-gradient title-dynamic title-highlight"
                        data-text="Creation Suite"
                      >
                        Creation Suite
                      </div>
                      <div 
                        className="text-7xl font-bold absolute inset-0 title-shadow opacity-50"
                        data-text="Creation Suite"
                      >
                        Creation Suite
                      </div>
                    </div>

                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FF00C8] rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#00C3FF] rounded-full blur-[100px] opacity-20 animate-pulse-slow"></div>
                  </div>
                </h2>

                <p className="text-xl text-white/80 leading-relaxed max-w-xl">
                  Transform your ideas into ready-to-sell print-on-demand products with AI. From books and covers to shirts and coloring pages — all in one place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[
                  {
                    icon: <Layers className="w-6 h-6" />,
                    title: "Multi-Format AI Tools",
                    description: "Create shirts, books, covers, and more — instantly."
                  },
                  {
                    icon: <Palette className="w-6 h-6" />,
                    title: "Full Style Control",
                    description: "Choose design style, size, format, and niche."
                  },
                  {
                    icon: <Image className="w-6 h-6" />,
                    title: "Live Previews",
                    description: "Visualize your product in real-time before exporting."
                  },
                  {
                    icon: <Share2 className="w-6 h-6" />,
                    title: "Ready for Market",
                    description: "Export in print-ready formats for KDP, Merch, Redbubble, etc."
                  }
                ].map((feature, index) => (
                  <div key={index} className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/10 p-6 hover:bg-white/[0.05] hover:border-primary/50 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <div className="text-primary">{feature.icon}</div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-white/70">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  Start Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10">
                  Browse Tools
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Preview Side */}
            <div className="relative lg:h-[700px] flex items-center justify-center">
              <div className="relative w-full max-w-[600px] aspect-square">
                {/* Main Preview Area */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-purple-500/5 border border-white/10">
                  <div className="absolute inset-0 bg-grid-white/[0.02]" />
                  
                  {/* T-Shirt Preview */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-96 h-96">
                      {/* T-Shirt Shape */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl animate-pulse" />
                      <div className="absolute inset-12 border-2 border-primary/30 rounded-lg" />
                      
                      {/* Design Elements */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-64 h-64 rounded-full bg-gradient-to-r from-primary/30 via-purple-500/30 to-pink-500/30 animate-spin-slow blur-lg" />
                      </div>

                      {/* Interactive Elements */}
                      <div className="absolute inset-0">
                        {/* Design Points */}
                        {[
                          { top: "20%", left: "20%", label: "Customize Colors" },
                          { top: "30%", right: "20%", label: "Add Text" },
                          { bottom: "30%", left: "25%", label: "Apply Effects" },
                          { bottom: "20%", right: "25%", label: "Adjust Size" }
                        ].map((point, index) => (
                          <div
                            key={index}
                            className="absolute animate-pulse"
                            style={{ top: point.top, left: point.left, right: point.right, bottom: point.bottom }}
                          >
                            <div className="relative group">
                              <div className="w-3 h-3 rounded-full bg-primary" />
                              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-sm px-3 py-1 rounded-lg -translate-y-full -translate-x-1/2 left-1/2 mb-2">
                                {point.label}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Control Panel */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] p-4 backdrop-blur-sm bg-black/40 border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm text-white/70">AI generating your unique design...</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                          <Wand2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Design Elements */}
                <div className="absolute -top-8 -left-8 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
              </div>

              {/* Design Tools Panel */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 space-y-4">
                {[
                  { icon: <Palette className="w-4 h-4" />, label: "Colors" },
                  { icon: <Type className="w-4 h-4" />, label: "Typography" },
                  { icon: <Image className="w-4 h-4" />, label: "Effects" },
                  { icon: <Layers className="w-4 h-4" />, label: "Layers" }
                ].map((tool, index) => (
                  <div key={index} className="group relative">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 transition-all duration-300">
                      <div className="text-primary">{tool.icon}</div>
                    </div>
                    <div className="absolute left-full ml-2 px-3 py-1 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm text-white whitespace-nowrap">{tool.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Book Cover & Coloring Page Generators Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/30 via-background to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.8),transparent_50%,rgba(0,0,0,0.8))]" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Content Side */}
            <div className="relative z-10 space-y-10">
              <div className="space-y-8">
                <div className="inline-block animate-float">
                  <span className="bg-primary/10 text-primary px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 glass-effect">
                    <Sparkles className="w-5 h-5" />
                    Premium Tools
                  </span>
                </div>

                <h2 className="text-6xl font-bold leading-tight">
                  <div className="relative">
                    <div className="absolute -inset-x-20 -inset-y-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,61,0,0.1),transparent_50%)] animate-pulse-slow"></div>
                    <div className="absolute -inset-x-20 -inset-y-10 bg-[radial-gradient(circle_at_50%_50%,rgba(0,195,255,0.1),transparent_50%)] animate-pulse"></div>
                    
                    <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                      AI Book Cover & Coloring Page Generators
                    </span>

                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FF00C8] rounded-full blur-[100px] opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#00C3FF] rounded-full blur-[100px] opacity-20 animate-pulse-slow"></div>
                  </div>
                </h2>

                <p className="text-xl text-white/80 leading-relaxed max-w-xl">
                  Design stunning, print-ready interiors and full-wrap covers — instantly. Perfect for KDP, activity books, journals, and creative niches.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: <Palette className="w-6 h-6" />,
                    title: "AI Coloring Page Maker",
                    description: "Generate unique, print-ready black-and-white illustrations using just a prompt.",
                    features: [
                      "Style presets (mandala, kids, nature, floral)",
                      "SVG + PNG formats",
                      "Batch generation"
                    ]
                  },
                  {
                    icon: <BookOpen className="w-6 h-6" />,
                    title: "AI Cover Designer",
                    description: "Create full-wrap book covers with title, spine, and back cover in seconds.",
                    features: [
                      "Auto-size by trim and page count",
                      "Built-in font styles",
                      "CMYK PDF output"
                    ]
                  }
                ].map((tool, index) => (
                  <div key={index} className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/10 p-6 hover:bg-white/[0.05] hover:border-primary/50 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <div className="text-primary">{tool.icon}</div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{tool.title}</h3>
                        <p className="text-sm text-white/70 mb-4">{tool.description}</p>
                        <div className="space-y-2">
                          {tool.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center gap-2 text-sm text-white/60">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  Try Cover Tool
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10">
                  Try Coloring Tool
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Preview Side */}
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <div className="relative w-full max-w-[600px] aspect-square">
                {/* Main Preview Area */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/5 to-primary/5 border border-white/10">
                  <div className="absolute inset-0 bg-grid-white/[0.02]" />
                  
                  {/* Split Preview */}
                  <div className="absolute inset-0 flex">
                    {/* Coloring Page Side */}
                    <div className="w-1/2 border-r border-white/10 relative">
                      <div className="absolute inset-10 rounded-lg bg-white/5 backdrop-blur-sm overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 animate-pulse-slow flex items-center justify-center">
                            <Palette className="w-16 h-16 text-primary/50" />
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                          <span className="text-sm text-white/50">Coloring Page</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Book Cover Side */}
                    <div className="w-1/2 relative">
                      <div className="absolute inset-10 rounded-lg bg-white/5 backdrop-blur-sm overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-32 h-32 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-md transform rotate-3 animate-pulse"></div>
                            <div className="absolute inset-2 border border-white/20 rounded-sm"></div>
                            <BookOpen className="absolute inset-0 m-auto w-16 h-16 text-white/50" />
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                          <span className="text-sm text-white/50">Book Cover</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] p-4 backdrop-blur-sm bg-black/40 border border-white/10 rounded-xl">
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm text-white/70">AI preview loading...</span>
                    </div>
                  </div>
                </div>

                {/* Floating Design Elements */}
                <div className="absolute -top-8 -left-8 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 glass-effect">
                <DollarSign className="w-5 h-5" />
                Pricing Plans
              </span>
            </div>
            <h2 className="text-4xl font-bold relative">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Choose Your Plan
              </span>
            </h2>
            <p className="text-xl text-foreground/80 mt-4 max-w-2xl mx-auto">
              Start free. Upgrade as you grow. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className="relative flex flex-col items-center">
                {plan.popular && (
                  <div className="z-20 mb-[-20px] relative">
                    <div className="px-4 py-1 bg-primary/90 text-background rounded-full text-sm font-medium shadow-lg border border-primary/50">
                      Most Popular
                    </div>
                  </div>
                )}
                <div className="w-full">
                  <div className={`h-full rounded-xl backdrop-blur-sm border ${plan.popular ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-white/5'} p-8 transition-all duration-300 hover:border-primary/50 hover:bg-primary/5`}>
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                        <span className="text-white/70">/{plan.period}</span>
                      </div>
                      <p className="text-white/70 mt-2">{plan.description}</p>
                    </div>

                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <span className="text-white/80">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className={`w-full ${plan.buttonVariant === 'outline' ? 'border-primary/50 text-primary hover:bg-primary/10' : 'bg-primary hover:bg-primary/90'}`}
                      variant={plan.buttonVariant}
                    >
                      {plan.buttonText}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add-ons Section */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center mb-8">Need more? Add credits anytime</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {addOns.map((addon, index) => (
                <div key={index} className="bg-white/[0.03] backdrop-blur-sm border border-white/10 p-4 rounded-xl text-center">
                  <div className="font-semibold text-white mb-1">{addon.name}</div>
                  <div className="text-primary">{addon.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 glass-effect">
                <Clock className="w-5 h-5" />
                Coming Soon
              </span>
            </div>
            <h2 className="text-4xl font-bold relative">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                More Puzzle Types Coming Soon
              </span>
            </h2>
            <p className="text-xl text-foreground/80 mt-4 max-w-2xl mx-auto">
              We're constantly adding new puzzle types to our collection
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-items-center">
            {upcomingPuzzles.map((puzzle, index) => (
              <div key={index} className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/10 p-6 hover:bg-white/[0.05] hover:border-primary/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <div className="text-primary">{puzzle.icon}</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{puzzle.title}</h3>
                    <p className="text-sm text-white/70">{puzzle.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Planning Tools Section */}
      <section className="relative py-16 bg-gradient-to-b from-background via-background/50 to-background select-text">
        <FloatingEmoji emoji="📝" className="top-20 left-[5%] animate-float" />
        <FloatingEmoji emoji="💡" className="bottom-20 right-[5%] animate-float-reverse" />
        <div className="absolute inset-0 bg-gradient-radial from-secondary/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-primary/50 p-4 hover:border-primary/80 transition-all hover:scale-105 glass-effect">
                  <Search className="w-8 h-8 text-primary mb-2 animate-pulse-glow" />
                  <h4 className="font-semibold">Niche Finder</h4>
                  <p className="text-sm text-muted-foreground">Discover high-potential ideas using real-time trends and keyword data</p>
                </Card>
                <Card className="border-primary/50 p-4 hover:border-primary/80 transition-all hover:scale-105 glass-effect">
                  <BookTemplate className="w-8 h-8 text-primary mb-2 animate-pulse-glow" />
                  <h4 className="font-semibold">Prompt Library</h4>
                  <p className="text-sm text-muted-foreground">Save, reuse, and share your best prompts across all tools</p>
                </Card>
                <Card className="border-primary/50 p-4 hover:border-primary/80 transition-all hover:scale-105 glass-effect">
                  <Calendar className="w-8 h-8 text-primary mb-2 animate-pulse-glow" />
                  <h4 className="font-semibold">Launch Planner</h4>
                  <p className="text-sm text-muted-foreground">Plan seasonal releases and weekly drops for your POD products</p>
                </Card>
                <Card className="border-primary/50 p-4 hover:border-primary/80 transition-all hover:scale-105 glass-effect">
                  <Share2 className="w-8 h-8 text-primary mb-2 animate-pulse-glow" />
                  <h4 className="font-semibold">Export Organizer</h4>
                  <p className="text-sm text-muted-foreground">Group, rename, and format your final files before publishing</p>
                </Card>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-block">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <ListTodo className="w-4 h-4" />
                  Productivity Tools
                </span>
              </div>
              <h2 className="text-4xl font-bold">
                Smart Planning Tools for Every POD Creator
              </h2>
              <p className="text-lg text-foreground max-w-2xl mx-auto">
                Streamline your entire print-on-demand workflow — from books and shirts to covers and coloring pages — with powerful AI-assisted planning tools.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Discover new niches with built-in keyword research</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Organize and tag all your projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Track product ideas across formats</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Build a full release calendar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Collaborate with team members</span>
                </li>
              </ul>
              <Button className="text-white bg-emerald-500 hover:bg-emerald-600">
                Explore Planning Tools
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Trust / Social Proof Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6 mb-12">
            <h2 className="text-4xl font-bold text-white">
              Trusted by 25,000+ Print-on-Demand Creators Worldwide
            </h2>
            <p className="text-lg text-gray-200 max-w-3xl mx-auto">
              Our tools are used by sellers on these major platforms
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-12 gap-y-10">
            {[
              { name: "Amazon KDP", logo: <AmazonKDPLogo /> },
              { name: "Etsy", logo: <EtsyLogo /> },
              { name: "Redbubble", logo: <RedbubbleLogo /> },
              { name: "Gumroad", logo: <GumroadLogo /> },
              { name: "Merch by Amazon", logo: <MerchByAmazonLogo /> },
              { name: "Teespring", logo: <TeespringLogo /> }
            ].map((platform, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center justify-center"
              >
                <div className="w-32 h-16 mx-auto flex items-center justify-center">
                  {platform.logo}
                </div>
                {/*<div className="mt-2 text-sm text-gray-400">{platform.name}</div>*/}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-r from-accent/20 to-secondary/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block">
              <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 px-4 py-2 rounded-full">
                <Star className="w-5 h-5 text-primary" fill="currentColor" />
                <span className="text-primary font-medium">Our Happy Users</span>
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="inline-block bg-gradient-to-r from-[#00FF94] via-[#CCF666] to-[#96F8FF] bg-clip-text text-transparent">
                  What Our Community Says
                </span>
              </h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join thousands of satisfied creators who've transformed their puzzle-making journey
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                
                <div className="relative bg-white/[0.03] backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 p-0.5">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      {testimonial.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                          <CheckCircle className="w-3 h-3 text-background" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-white">{testimonial.name}</h4>
                      <p className="text-sm text-white/70">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" />
                    ))}
                  </div>

                  <blockquote className="mt-4">
                    <p className="text-white/80 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                  </blockquote>

                  <div className="mt-6 flex items-center gap-2 text-sm text-white/60">
                    <MapPin className="w-4 h-4" />
                    <span>{testimonial.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl">
              {[
                { number: "50K+", label: "Active Users" },
                { number: "4.9/5", label: "Average Rating" },
                { number: "98%", label: "Satisfaction Rate" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <p className="text-white/70 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 text-center">
            <Button 
              variant="outline" 
              className="group px-6 py-3 text-lg border-primary/50 text-primary hover:bg-primary/10"
            >
              Read More Reviews
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-24 bg-gradient-to-b from-background via-background/50 to-background select-text">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-6">
            <div className="inline-block mb-4">
              <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 glass-effect">
                <HelpCircle className="w-5 h-5" />
                FAQ
              </span>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-bold relative">
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
                <div className="absolute -inset-1 bg-primary/20 blur-xl opacity-50"></div>
              </h2>
              <p className="text-xl text-foreground max-w-2xl mx-auto font-medium">
                Got questions? We've got answers
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="group hover:border-primary/50 transition-all duration-300 glass-effect">
                <CardHeader>
                  <CardTitle className="text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 text-center">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-gradient-to-r from-accent/30 to-secondary/30 rounded-full blur-3xl animate-pulse-slow" />
        
        {/* Floating emojis with new positions */}
        <FloatingEmoji emoji="✨" className="top-20 left-[15%] animate-float" />
        <FloatingEmoji emoji="🎨" className="bottom-32 right-[20%] animate-float-reverse" />
        <FloatingEmoji emoji="🚀" className="top-40 right-[25%] animate-float-slow" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-block animate-bounce-slow">
              <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 px-4 py-2 rounded-full">
                <Brain className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">Start Your Journey</span>
              </div>
            </div>

            {/* Title with gradient */}
            <h2 className="text-5xl md:text-6xl font-bold">
              <span className="inline-block bg-gradient-to-r from-[#00FF94] via-[#CCF666] to-[#96F8FF] bg-clip-text text-transparent">
                Ready to Launch Your POD Business?
              </span>
            </h2>

            {/* Description with better contrast */}
            <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Join thousands of creators using our AI platform to publish shirts, books, covers, and coloring pages — all with zero design skills.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-12">
              {[
                {
                  icon: <Wand2 className="w-6 h-6" />,
                  title: "AI Creation Tools",
                  description: "Design books, shirts, and covers in seconds"
                },
                {
                  icon: <CheckCircle className="w-6 h-6" />,
                  title: "Commercial-Use Licensing",
                  description: "Safe for Amazon, Etsy, and Redbubble"
                },
                {
                  icon: <FileText className="w-6 h-6" />,
                  title: "Multiple Formats",
                  description: "Export in PDF, SVG, PNG, CMYK-ready files"
                },
                {
                  icon: <Search className="w-6 h-6" />,
                  title: "Niche & Keyword Finder",
                  description: "Plan your next bestseller with AI"
                }
              ].map((feature, index) => (
                <div key={index} className="text-center p-4 bg-white/[0.03] backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
              <Link to="/register">
                <Button size="lg" className="min-w-[200px] h-12 bg-primary hover:bg-primary/90 text-background group transition-all duration-300 animate-shimmer">
                  Start Creating Now
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/explore">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="min-w-[200px] h-12 border-primary/50 text-primary hover:bg-primary/10 group transition-all duration-300"
                >
                  Explore Tools
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Start badge */}
            <div className="inline-block mt-8">
              <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 px-4 py-2 rounded-full">
                <Star className="w-5 h-5 text-primary" fill="currentColor" />
                <span className="text-primary font-medium">Start for free, upgrade anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}; 