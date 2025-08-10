import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  Activity, 
  Package, 
  FileText, 
  Layers, 
  PanelRight, 
  Palette, 
  BookOpen, 
  Puzzle, 
  CalendarDays, 
  BarChart,
  TrendingUp,
  Check,
  Clock,
  Shirt,
  Coins,
  Crown
} from "lucide-react";
import { PageLayout } from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Download, Zap, LineChart, Wand2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const quickActions = [
  {
    title: 'T-shirt Designer',
    description: 'Create professional t-shirt designs with AI',
    icon: Shirt,
    color: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30',
    iconColor: 'text-blue-500',
    href: '/dashboard/t-shirts'
  },
  {
    title: 'Coloring Page Generator',
    description: 'Design unique coloring pages with AI',
    icon: Palette,
    color: 'from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30',
    iconColor: 'text-purple-500',
    href: '/dashboard/coloring'
  },
  {
    title: 'Cover Designer',
    description: 'Create professional book covers',
    icon: BookOpen,
    color: 'from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30',
    iconColor: 'text-green-500',
    href: '/dashboard/kdp-covers'
      },
    {
    title: 'Puzzle Book Generator',
    description: 'Generate puzzle books for publishing',
    icon: Puzzle,
    color: 'from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30',
    iconColor: 'text-amber-500',
    href: '/dashboard/puzzles'
  },
  {
    title: 'Content Planner',
    description: 'Plan your POD product releases',
    icon: CalendarDays,
    color: 'from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30',
    iconColor: 'text-pink-500',
    href: '/dashboard/content'
  },
  {
    title: 'Bulk Generator',
    description: 'Create multiple designs at once',
    icon: Layers,
    color: 'from-indigo-500/20 to-violet-500/20 hover:from-indigo-500/30 hover:to-violet-500/30',
    iconColor: 'text-indigo-500',
    href: '/dashboard/bulk'
  }
];

const recentProjects = [
  {
    title: 'Fantasy Coloring Book',
    date: 'May 6, 2024',
    type: 'Coloring',
    items: 25,
    status: 'completed',
    progress: 100,
    trend: '+15%',
    icon: Palette,
    iconColor: 'text-purple-500',
    fileType: '.pdf'
  },
  {
    title: 'Advanced Sudoku Collection',
    date: 'May 5, 2024',
    type: 'Puzzle',
    items: 50,
    status: 'completed',
    progress: 100,
    trend: '+12%',
    icon: Puzzle,
    iconColor: 'text-amber-500',
    fileType: '.pdf'
  },
  {
    title: 'Mystery Novel Series Covers',
    date: 'May 3, 2024',
    type: 'Cover',
    items: 5,
    status: 'in-progress',
    progress: 65,
    trend: '+8%',
    icon: BookOpen,
    iconColor: 'text-green-500',
    fileType: '.pdf'
  },
  {
    title: 'Mixed Puzzle Book',
    date: 'May 1, 2024',
    type: 'Puzzle',
    items: 45,
    status: 'completed',
    progress: 100,
    trend: '+15%',
    icon: Puzzle,
    iconColor: 'text-amber-500',
    fileType: '.pdf'
  }
];

const usageBreakdown = [
  { type: 'T-shirt Designs', used: 356, limit: 500, color: 'bg-blue-500' },
  { type: 'Coloring Pages', used: 220, limit: 300, color: 'bg-purple-500' },
  { type: 'Book Covers', used: 78, limit: 100, color: 'bg-green-500' },
  { type: 'Puzzle Pages', used: 188, limit: 300, color: 'bg-amber-500' }
];

const MotionCard = motion(Card);

export const Overview = () => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  const totalUsed = usageBreakdown.reduce((acc, item) => acc + item.used, 0);
  const totalLimit = usageBreakdown.reduce((acc, item) => acc + item.limit, 0);
  const totalPercentage = Math.round((totalUsed / totalLimit) * 100);

  // Placeholder user for now
  const user = {
    name: 'Creator',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    credits: 120,
    plan: 'Pro'
  };

  return (
    <div className="space-y-8 p-8">
      {/* Hero Banner */}
      <MotionCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-background" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hey {user.name}, ready to create something amazing?</h1>
              <p className="text-muted-foreground">Use quick starts below to jump into your favorite tools or continue where you left off.</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Link to="/dashboard/prompt-to-image"><Button size="sm"><Wand2 className="h-4 w-4 mr-2" /> Prompt to Image</Button></Link>
                <Link to="/dashboard/coloring"><Button size="sm" variant="outline"><Palette className="h-4 w-4 mr-2" /> Coloring</Button></Link>
                <Link to="/dashboard/kdp-covers"><Button size="sm" variant="outline"><BookOpen className="h-4 w-4 mr-2" /> Covers</Button></Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-2 ring-primary/30">
                  <AvatarImage src={user.avatar} alt="avatar" />
                  <AvatarFallback>CR</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" />
                  {user.credits}
                </div>
              </div>
              <div className="hidden md:flex flex-col gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm w-max">
                  Plan: {user.plan}
                </div>
                <Button variant="outline" size="sm" className="w-max">Add credits</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </MotionCard>

      {/* Stats + Body */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Stats Section (compact row) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden backdrop-blur-3xl border-primary/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">68</div>
            <div className="flex items-center mt-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+12 from last month</span>
            </div>
          </CardContent>
        </MotionCard>

        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden backdrop-blur-3xl border-primary/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Items Generated</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">842</div>
            <div className="flex items-center mt-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+142 items this month</span>
            </div>
          </CardContent>
        </MotionCard>

        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden backdrop-blur-3xl border-primary/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Top Tool Used</CardTitle>
            <Palette className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">Coloring Pages</div>
            <div className="flex items-center mt-1 text-xs">
              <span className="text-muted-foreground">45% of all creations</span>
            </div>
          </CardContent>
        </MotionCard>

        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden backdrop-blur-3xl border-primary/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-grid-white/[0.02]" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Growth Trend</CardTitle>
            <LineChart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+24%</div>
            <div className="flex items-center mt-1 text-xs">
              <span className="text-muted-foreground">compared to last month</span>
            </div>
          </CardContent>
        </MotionCard>
          </div>

          {/* Recent Activity Timeline (new) */}
          <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="relative overflow-hidden border-primary/15">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Recent Activity
              </CardTitle>
              <CardDescription>Your latest projects and actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {recentProjects.slice(0, 5).map((project, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-white/10">
                    <project.icon className={cn("h-4 w-4", project.iconColor)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{project.title}</div>
                      <div className="text-xs text-muted-foreground">{project.date}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{project.items} {project.type === 'Puzzle' ? 'pages' : 'items'} • {project.status}</div>
                    <div className="mt-2 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} className="h-full bg-gradient-to-r from-primary to-secondary" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </MotionCard>
        </div>

        {/* Right: Account & Usage */}
        <div className="space-y-6">
          {/* Subscription Usage */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative overflow-hidden backdrop-blur-3xl border-primary/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Subscription Usage
          </CardTitle>
          <CardDescription>You've used {totalPercentage}% of your monthly quota</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalPercentage}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className="h-full bg-gradient-to-r from-primary to-secondary"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {totalUsed} of {totalLimit} items generated this month
          </p>
          
          <div className="mt-4 flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs gap-1"
              onClick={() => setShowBreakdown(!showBreakdown)}
            >
              {showBreakdown ? 'Hide' : 'View'} Usage Breakdown
              <ChevronDown className={`h-3 w-3 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs bg-primary/10 hover:bg-primary/20"
            >
              Upgrade Plan
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          
          {showBreakdown && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-primary/10 space-y-3"
            >
              {usageBreakdown.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/80">{item.type}</span>
                    <span className="text-white/80">{item.used} / {item.limit}</span>
                  </div>
                  <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.used / item.limit) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.1 * index }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </MotionCard>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          Quick Actions
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <MotionCard
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="group relative overflow-hidden backdrop-blur-3xl border-primary/20"
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br transition-all duration-300",
                action.color
              )} />
              <div className="absolute inset-0 bg-grid-white/[0.02]" />
              <CardHeader>
                <div className={cn(
                  "p-3 w-fit rounded-xl bg-white/5 backdrop-blur-xl group-hover:scale-110 transition-transform",
                  action.iconColor
                )}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4 text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to={action.href}>
                <Button className="w-full bg-white/10 backdrop-blur-xl hover:bg-white/20 transition-colors">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New
                </Button>
                </Link>
              </CardContent>
            </MotionCard>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Recent Projects
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentProjects.map((project, index) => (
            <MotionCard
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1 }}
              className="group relative overflow-hidden backdrop-blur-3xl border-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
              <div className="absolute inset-0 bg-grid-white/[0.02]" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <project.icon className={`h-5 w-5 ${project.iconColor}`} />
                    <span className="truncate">{project.title}</span>
                  </CardTitle>
                  <div className="text-xs py-1 px-2 rounded-full bg-white/10 backdrop-blur-sm">
                    {project.fileType}
                  </div>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Created on {project.date} • {project.items} {project.type === 'Puzzle' ? 'pages' : 'items'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 1, delay: 1.2 + index * 0.1 }}
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        project.status === 'completed' ? "bg-green-500" : "bg-amber-500"
                      )} />
                      <span className="text-sm text-muted-foreground capitalize">
                        {project.status}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" className="bg-white/5 backdrop-blur-xl hover:bg-white/10">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <TrendingUp className="h-4 w-4" />
                    {project.trend} engagement this week
                  </div>
                </div>
              </CardContent>
            </MotionCard>
          ))}
        </div>
      </div>
    </div>
  );
}; 