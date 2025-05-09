import { Users, Target, Star, Sparkles, Heart, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const values = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Innovation',
    description: 'Pushing the boundaries of puzzle creation with AI technology'
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'User-Centric',
    description: 'Designing with our users in mind, every step of the way'
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: 'Quality',
    description: 'Delivering excellence in every puzzle book we help create'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Efficiency',
    description: 'Streamlining the creation process without compromising quality'
  }
];

const team = [
  {
    name: 'Sarah Johnson',
    role: 'Founder & CEO',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&q=80',
    description: 'Former educator turned tech entrepreneur'
  },
  {
    name: 'Michael Chen',
    role: 'CTO',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&q=80',
    description: 'AI expert with a passion for education'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Design',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&q=80',
    description: 'Award-winning designer focused on UX'
  }
];

export const About = () => {
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
              <Users className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium">Our Story</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Revolutionizing Puzzle Creation
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to make puzzle book creation accessible to everyone through the power of AI.
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 animate-gradient" />
          
          <CardContent className="p-8 md:p-12 text-center relative">
            <p className="text-2xl md:text-3xl font-light leading-relaxed max-w-4xl mx-auto">
              "Our vision is to empower educators, publishers, and creators to build engaging puzzle books that inspire learning and creativity across all ages."
            </p>
          </CardContent>
        </Card>

        {/* Company Values */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Our Values
            </h2>
            <p className="text-muted-foreground mt-2">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <CardHeader>
                  <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit group-hover:scale-110 transition-transform">
                    {value.icon}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <CardTitle className="mb-2">{value.title}</CardTitle>
                  <CardDescription>{value.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Meet Our Team
            </h2>
            <p className="text-muted-foreground mt-2">
              The passionate people behind PuzzleCraft
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <CardHeader>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                    <img
                      src={member.image}
                      alt={member.name}
                      className="relative rounded-full w-full h-full object-cover border-2 border-primary/20 group-hover:border-primary/50 transition-colors"
                    />
                  </div>
                  <CardTitle className="text-center">{member.name}</CardTitle>
                  <CardDescription className="text-center text-primary">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="text-center">
                  <p className="text-muted-foreground">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Join Us CTA */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 animate-gradient" />
            
            <CardContent className="p-8 relative">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Join Our Journey
              </h3>
              <p className="text-muted-foreground mb-6">
                Be part of the future of puzzle creation. Start creating your first puzzle book today.
              </p>
              <Button
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trust Badge */}
        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-6 py-3 rounded-full">
            <div className="p-2 rounded-full bg-primary/10">
              <Star className="w-5 h-5 text-primary" fill="currentColor" />
            </div>
            <p className="text-muted-foreground">
              Trusted by thousands of creators worldwide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 