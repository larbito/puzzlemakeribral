import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Save, 
  FolderOpen, 
  Trash, 
  Loader2, 
  BookOpen, 
  Calendar, 
  CloudOff,
  Check,
  X 
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// Types for saved projects
interface SavedProject {
  id: string;
  name: string;
  coverState: any;
  bookSettings: any;
  savedAt: string;
  thumbnailUrl?: string;
}

interface SaveLoadProjectProps {
  coverState: any;
  bookSettings: any;
  onLoadProject: (coverState: any, bookSettings: any) => void;
}

const SaveLoadProject: React.FC<SaveLoadProjectProps> = ({
  coverState,
  bookSettings,
  onLoadProject,
}) => {
  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setLoadDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Load saved projects from localStorage on component mount
  useEffect(() => {
    const projects = localStorage.getItem("bookCoverProjects");
    if (projects) {
      setSavedProjects(JSON.parse(projects));
    }
  }, []);

  // Save a new project
  const handleSaveProject = () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setIsLoading(true);

    try {
      // Create a new project object
      const newProject: SavedProject = {
        id: Date.now().toString(),
        name: projectName.trim(),
        coverState,
        bookSettings,
        savedAt: new Date().toISOString(),
        thumbnailUrl: coverState.frontCoverImage || undefined,
      };

      // Add to saved projects
      const updatedProjects = [...savedProjects, newProject];
      setSavedProjects(updatedProjects);

      // Save to localStorage
      localStorage.setItem("bookCoverProjects", JSON.stringify(updatedProjects));

      toast.success("Project saved successfully");
      setSaveDialogOpen(false);
      setProjectName("");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project");
    } finally {
      setIsLoading(false);
    }
  };

  // Load a project
  const handleLoadProject = () => {
    if (!selectedProjectId) {
      toast.error("Please select a project to load");
      return;
    }

    const project = savedProjects.find(p => p.id === selectedProjectId);
    if (!project) {
      toast.error("Project not found");
      return;
    }

    onLoadProject(project.coverState, project.bookSettings);
    toast.success(`Project "${project.name}" loaded successfully`);
    setLoadDialogOpen(false);
    setSelectedProjectId(null);
  };

  // Delete a project
  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedProjects = savedProjects.filter(p => p.id !== projectId);
    setSavedProjects(updatedProjects);
    localStorage.setItem("bookCoverProjects", JSON.stringify(updatedProjects));
    
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
    
    toast.success("Project deleted");
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={() => setSaveDialogOpen(true)}
      >
        <Save className="w-4 h-4" />
        <span className="hidden sm:inline">Save</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={() => setLoadDialogOpen(true)}
        disabled={savedProjects.length === 0}
      >
        <FolderOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Load</span>
      </Button>

      {/* Save Project Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
            <DialogDescription>
              Save your current book cover design for future editing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="projectName" className="text-sm font-medium">
                Project Name
              </label>
              <Input
                id="projectName"
                placeholder="My Fantasy Book Cover"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            
            {coverState.frontCoverImage && (
              <div className="border rounded p-3 bg-secondary/20">
                <p className="text-xs text-muted-foreground mb-2">Current Cover Preview:</p>
                <img 
                  src={coverState.frontCoverImage} 
                  alt="Cover preview" 
                  className="w-full max-h-32 object-contain rounded"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={isLoading || !projectName.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Project Dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Load Project</DialogTitle>
            <DialogDescription>
              Select a previously saved book cover project
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {savedProjects.length === 0 ? (
              <div className="text-center py-8">
                <CloudOff className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No saved projects found</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px] pr-4">
                <div className="space-y-2">
                  {savedProjects.map((project) => (
                    <Card
                      key={project.id}
                      className={`cursor-pointer transition-all ${
                        selectedProjectId === project.id
                          ? "border-primary"
                          : "hover:border-muted-foreground"
                      }`}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-16 h-16 rounded bg-secondary/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {project.thumbnailUrl ? (
                            <img
                              src={project.thumbnailUrl}
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-medium truncate">{project.name}</h3>
                            {selectedProjectId === project.id && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>
                              {formatDistanceToNow(new Date(project.savedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => handleDeleteProject(project.id, e)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLoadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLoadProject}
              disabled={!selectedProjectId}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Load Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SaveLoadProject; 