import { useState, useMemo } from "react";
import type { ProjectResponse } from "../../core/interfaces/project.interface";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Github, Gitlab, ExternalLink, ArrowRight, Plus, FolderGit2, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectListProps {
  projects: ProjectResponse[];
  isLoading: boolean;
}

export const ProjectList = ({ projects, isLoading }: ProjectListProps) => {
  const navigate = useNavigate();
  const [platformFilter, setPlatformFilter] = useState<"ALL" | "GITHUB" | "GITLAB">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Apply filters - memoized to prevent recalculation on every render
  // Must be called before any early returns to maintain hook order
  const filteredProjects = useMemo(() => {
    let result = projects;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    // Platform filter
    if (platformFilter !== "ALL") {
      result = result.filter(p => p.platform === platformFilter);
    }
    
    // Status filter
    if (statusFilter === "ACTIVE") {
      result = result.filter(p => p.is_active);
    } else if (statusFilter === "INACTIVE") {
      result = result.filter(p => !p.is_active);
    }
    
    return result;
  }, [projects, searchQuery, platformFilter, statusFilter]);

  // Show only first 6 projects
  const displayProjects = filteredProjects.slice(0, 6);
  const hasMore = filteredProjects.length > 6;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border rounded-xl bg-card/50">
        <div className="p-4 rounded-full bg-primary/5 mb-4">
          <FolderGit2 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Connect your first repository to start receiving AI-powered code reviews.
        </p>
        <Button onClick={() => navigate("/projects/new")} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Responsive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold tracking-tight">Recent Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            {filteredProjects.length < projects.length && ' (filtered)'}
          </p>
        </div>

        {/* Responsive Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant={isSearchOpen ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery("");
            }}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Button>

          <div className="relative flex-1 sm:flex-none min-w-[140px]">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as typeof platformFilter)}
              className="w-full h-9 px-3 pr-8 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer transition-colors"
            >
              <option value="ALL">All Platforms</option>
              <option value="GITHUB">GitHub</option>
              <option value="GITLAB">GitLab</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative flex-1 sm:flex-none min-w-[120px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full h-9 px-3 pr-8 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer transition-colors"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {hasMore && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/projects")} 
              className="gap-2 group w-full sm:w-auto"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>
      </div>

      {/* Full Width Search Bar */}
      {isSearchOpen && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-11 border-2 focus:border-primary transition-all"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {displayProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-xl bg-muted/20">
          <div className="p-4 rounded-full bg-muted mb-4">
            <FolderGit2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-2">No projects found</p>
          <p className="text-sm text-muted-foreground mb-6 text-center">Try adjusting your filters or search query</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setPlatformFilter("ALL");
              setStatusFilter("ALL");
              setSearchQuery("");
              setIsSearchOpen(false);
            }}
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayProjects.map((project) => (
            <div 
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="group cursor-pointer"
            >
              <div className="relative h-full p-6 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${
                      project.platform === "GITHUB" 
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100" 
                        : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-500"
                    }`}>
                      {project.platform === "GITHUB" ? <Github className="w-5 h-5" /> : <Gitlab className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {project.platform}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant={project.is_active ? "default" : "secondary"} 
                    className={project.is_active 
                      ? "bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-500/20" 
                      : "bg-gray-500/15 text-gray-600 dark:text-gray-400"
                    }
                  >
                    {project.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-1">
                  {project.name}
                </h3>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                  {project.description || "No description provided"}
                </p>

                <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">Updated</span>
                    <span>{new Date(project.updated_at || project.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>
                  <a 
                    href={project.repository_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium group/link"
                  >
                    <span>View Repo</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
