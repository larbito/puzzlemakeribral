import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search,
  Filter,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  ChevronDown,
  Users,
  TrendingUp,
  Activity,
  GripVertical,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
  DragOverEvent,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';

interface Task {
  id: string;
  name: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
}

interface Project {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  tasks: Task[];
  progress: number;
  trend: string;
  engagement: number;
  assignees: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

const statusColumns = [
  {
    id: 'todo',
    title: 'To Do',
    color: 'from-purple-500/20 to-blue-500/20 text-blue-500',
    icon: AlertCircle
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'from-orange-500/20 to-pink-500/20 text-pink-500',
    icon: Clock
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'from-green-500/20 to-emerald-500/20 text-emerald-500',
    icon: CheckCircle
  }
];

const initialProjects: Project[] = [
  {
    id: '1',
    title: 'Summer Puzzle Collection',
    description: 'A collection of summer-themed puzzles for all ages',
    deadline: '2024-06-01',
    status: 'in-progress',
    tasks: [
      { id: '1-1', name: 'Design cover page', completed: true, priority: 'high' },
      { id: '1-2', name: 'Create 20 sudoku puzzles', completed: true, priority: 'medium' },
      { id: '1-3', name: 'Add word searches', completed: false, priority: 'medium' },
      { id: '1-4', name: 'Final review', completed: false, priority: 'high' }
    ],
    progress: 50,
    trend: '+15%',
    engagement: 89,
    assignees: ['John', 'Sarah'],
    tags: ['summer', 'kids', 'puzzles'],
    priority: 'high'
  },
  {
    id: '2',
    title: 'Kids Activity Book',
    description: 'Educational activity book for children aged 6-12',
    deadline: '2024-06-15',
    status: 'todo',
    tasks: [
      { id: '2-1', name: 'Outline content structure', completed: true, priority: 'high' },
      { id: '2-2', name: 'Design character mascots', completed: false, priority: 'medium' },
      { id: '2-3', name: 'Create simple puzzles', completed: false, priority: 'low' },
      { id: '2-4', name: 'Add educational elements', completed: false, priority: 'medium' }
    ],
    progress: 25,
    trend: '+8%',
    engagement: 45,
    assignees: ['Mike', 'Emma'],
    tags: ['education', 'kids', 'activities'],
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Brain Teasers Volume 2',
    description: 'Advanced collection of brain teasers and logic puzzles',
    deadline: '2024-06-30',
    status: 'completed',
    tasks: [
      { id: '3-1', name: 'Research puzzle types', completed: true, priority: 'high' },
      { id: '3-2', name: 'Create difficulty levels', completed: true, priority: 'medium' },
      { id: '3-3', name: 'Generate puzzles', completed: true, priority: 'high' },
      { id: '3-4', name: 'Test and validate', completed: true, priority: 'high' }
    ],
    progress: 100,
    trend: '+25%',
    engagement: 156,
    assignees: ['John', 'Lisa', 'Mike'],
    tags: ['advanced', 'logic', 'brain-teasers'],
    priority: 'high'
  }
];

const DraggableProjectCard = ({ project, id }: { project: Project; id: string }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="group"
      >
        <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-white/5 dark:via-white/2.5 dark:to-transparent backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
          
          <CardHeader className="relative pb-4">
            <div className="flex items-center gap-3">
              <div {...listeners} className="cursor-grab active:cursor-grabbing">
                <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors">
                  <GripVertical className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-bold">{project.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Star className={cn("h-4 w-4", getPriorityColor(project.priority))} />
                  <span className="text-sm text-muted-foreground">
                    Due: {new Date(project.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="relative space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 1 }}
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r",
                    project.progress === 100
                      ? "from-emerald-500 to-green-500"
                      : "from-primary to-primary/50"
                  )}
                />
              </div>
            </div>

            <div className="space-y-3">
              {project.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
                >
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    task.completed ? "bg-emerald-500" : "bg-primary/20"
                  )} />
                  <span className={cn(
                    "text-sm flex-1",
                    task.completed && "line-through text-muted-foreground"
                  )}>
                    {task.name}
                  </span>
                  <Star className={cn("h-3 w-3", getPriorityColor(task.priority))} />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{project.tasks.filter(t => t.completed).length}/{project.tasks.length}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-emerald-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>{project.trend}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const DroppableColumn = ({ 
  children, 
  id, 
  title, 
  icon: Icon, 
  color, 
  projectCount 
}: { 
  children: React.ReactNode; 
  id: string; 
  title: string; 
  icon: any; 
  color: string; 
  projectCount: number;
}) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br",
            color
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {projectCount} {projectCount === 1 ? 'project' : 'projects'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        {children}
      </div>
    </div>
  );
};

export const Content = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeProject = projects.find(p => p.id === active.id);
    if (!activeProject) return;

    // If dropping over a column
    if (statusColumns.find(col => col.id === over.id)) {
      if (over.id !== activeProject.status) {
        setProjects(projects.map(project =>
          project.id === active.id
            ? { ...project, status: over.id as string }
            : project
        ));
      }
    }
    // If dropping over another project
    else {
      const overProject = projects.find(p => p.id === over.id);
      if (!overProject || overProject.status === activeProject.status) return;

      setProjects(projects.map(project =>
        project.id === active.id
          ? { ...project, status: overProject.status }
          : project
      ));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeProject = projects.find(p => p.id === active.id);
    const overProject = projects.find(p => p.id === over.id);

    if (!activeProject) return;

    // If dropping over a column
    if (statusColumns.find(col => col.id === over.id)) {
      setProjects(projects.map(project =>
        project.id === active.id
          ? { ...project, status: over.id as string }
          : project
      ));
    }
    // If dropping over another project
    else if (overProject && activeProject.id !== overProject.id) {
      const activeIndex = projects.findIndex(p => p.id === active.id);
      const overIndex = projects.findIndex(p => p.id === over.id);
      
      // Update the project's status to match the target column
      const updatedProjects = [...projects];
      updatedProjects[activeIndex] = {
        ...activeProject,
        status: overProject.status
      };

      // Reorder the projects
      const reorderedProjects = arrayMove(updatedProjects, activeIndex, overIndex);
      setProjects(reorderedProjects);
    }

    setActiveId(null);
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeProject = projects.find(p => p.id === activeId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Content Plan
            </h2>
            <p className="text-muted-foreground mt-1">
              Track and manage your puzzle book projects
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {statusColumns.map(column => (
              <DroppableColumn
                key={column.id}
                id={column.id}
                title={column.title}
                icon={column.icon}
                color={column.color}
                projectCount={projects.filter(p => p.status === column.id).length}
              >
                <SortableContext
                  items={projects
                    .filter(p => p.status === column.id)
                    .map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence mode="popLayout">
                    {projects
                      .filter(project => project.status === column.id)
                      .map(project => (
                        <DraggableProjectCard
                          key={project.id}
                          project={project}
                          id={project.id}
                        />
                      ))}
                  </AnimatePresence>
                </SortableContext>
              </DroppableColumn>
            ))}

            {createPortal(
              <DragOverlay>
                {activeId && activeProject ? (
                  <div style={{ width: '100%' }}>
                    <DraggableProjectCard
                      project={activeProject}
                      id={activeId as string}
                    />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </div>
      </div>
    </div>
  );
}; 