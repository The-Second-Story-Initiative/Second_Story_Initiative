import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  Github, 
  Heart, 
  Eye, 
  Star,
  Code,
  Calendar,
  User,
  Globe,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Project, ProjectFilters } from '../../types';
import { useAuthStore } from '../../stores/authStore';

const ProjectsShowcase = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProjectFilters>({
    technologies: [],
    status: undefined,
    visibility: undefined,
    featured: false,
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all');

  useEffect(() => {
    fetchProjects();
  }, [viewMode]);

  useEffect(() => {
    applyFilters();
  }, [projects, filters]);

  const fetchProjects = async () => {
    try {
      const endpoint = viewMode === 'my' ? '/api/projects/my' : '/api/projects';
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data);
      } else {
        toast.error('Failed to load projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    if (filters.search) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
        project.description.toLowerCase().includes(filters.search!.toLowerCase()) ||
        project.technologies.some(tech => 
          tech.toLowerCase().includes(filters.search!.toLowerCase())
        )
      );
    }

    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    if (filters.visibility) {
      filtered = filtered.filter(project => project.visibility === filters.visibility);
    }

    if (filters.featured) {
      filtered = filtered.filter(project => project.featured);
    }

    if (filters.technologies && filters.technologies.length > 0) {
      filtered = filtered.filter(project => 
        filters.technologies!.some(tech => 
          project.technologies.includes(tech)
        )
      );
    }

    setFilteredProjects(filtered);
  };

  const toggleLike = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(prev => prev.map(project => 
          project.id === projectId 
            ? { ...project, likes_count: data.likes_count }
            : project
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return '📋';
      case 'in_progress': return '🚧';
      case 'completed': return '✅';
      case 'archived': return '📦';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-600 to-accent-700 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Project Showcase</h1>
        <p className="text-accent-100 text-lg">
          Discover amazing projects from our community and showcase your own work
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span className="font-semibold">{projects.length} Projects</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span className="font-semibold">Community Driven</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span className="font-semibold">Open Source</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Projects
              </button>
              <button
                onClick={() => setViewMode('my')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'my'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Projects
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            
            {viewMode === 'my' && (
              <Link
                to="/projects/new"
                className="flex items-center space-x-2 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    status: e.target.value as any || undefined 
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={filters.visibility || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    visibility: e.target.value as any || undefined 
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                >
                  <option value="">All Visibility</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={(e) => setFilters({ ...filters, featured: e.target.checked })}
                    className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured Only</span>
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ search: '', status: undefined, visibility: undefined, featured: false, technologies: [] })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {project.image_url && (
              <img
                src={project.image_url}
                alt={project.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                  {project.title}
                </h3>
                <div className="flex items-center space-x-1">
                  {project.featured && (
                    <span className="bg-accent-100 text-accent-800 text-xs font-medium px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                  {viewMode === 'my' && (
                    <Link
                      to={`/projects/${project.id}/edit`}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {project.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  <span>{getStatusIcon(project.status)}</span>
                  <span>{project.status.replace('_', ' ')}</span>
                </span>
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Heart className="h-4 w-4" />
                    <span>{project.likes_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{project.views_count}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {project.technologies.slice(0, 3).map((tech, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      +{project.technologies.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {project.github_repo_url && (
                    <a
                      href={project.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {project.live_demo_url && (
                    <a
                      href={project.live_demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleLike(project.id)}
                    className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                  <Link
                    to={`/projects/${project.id}`}
                    className="bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {viewMode === 'my' ? 'No projects yet' : 'No projects found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {viewMode === 'my' 
              ? 'Start building something amazing and showcase it to the community.'
              : 'Try adjusting your search criteria or filters to find projects.'
            }
          </p>
          {viewMode === 'my' && (
            <Link
              to="/projects/new"
              className="inline-flex items-center space-x-2 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Your First Project</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsShowcase;