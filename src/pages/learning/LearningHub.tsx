import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Filter, 
  Search,
  Play,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { LearningTrack, LearningTrackFilters } from '../../types';

const LearningHub = () => {
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<LearningTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LearningTrackFilters>({
    difficulty: undefined,
    duration: undefined,
    featured: false,
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tracks, filters]);

  const fetchTracks = async () => {
    try {
      const response = await fetch('/api/learning/tracks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTracks(data.data);
      } else {
        toast.error('Failed to load learning tracks');
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast.error('Failed to load learning tracks');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tracks];

    if (filters.search) {
      filtered = filtered.filter(track => 
        track.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
        track.description.toLowerCase().includes(filters.search!.toLowerCase()) ||
        track.skills_covered.some(skill => 
          skill.toLowerCase().includes(filters.search!.toLowerCase())
        )
      );
    }

    if (filters.difficulty) {
      filtered = filtered.filter(track => track.difficulty === filters.difficulty);
    }

    if (filters.duration) {
      filtered = filtered.filter(track => {
        if (filters.duration === 'short') return track.duration_weeks <= 4;
        if (filters.duration === 'medium') return track.duration_weeks > 4 && track.duration_weeks <= 12;
        if (filters.duration === 'long') return track.duration_weeks > 12;
        return true;
      });
    }

    if (filters.featured) {
      filtered = filtered.filter(track => track.is_featured);
    }

    setFilteredTracks(filtered);
  };

  const handleEnroll = async (trackId: string) => {
    try {
      const response = await fetch(`/api/learning/tracks/${trackId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Successfully enrolled in track!');
        // Refresh tracks to update enrollment status
        fetchTracks();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to enroll in track');
      }
    } catch (error) {
      console.error('Error enrolling in track:', error);
      toast.error('Failed to enroll in track');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDurationText = (weeks: number) => {
    if (weeks <= 4) return `${weeks} weeks`;
    if (weeks <= 12) return `${Math.round(weeks / 4)} months`;
    return `${Math.round(weeks / 12)} months`;
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
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Learning Pathways</h1>
        <p className="text-primary-100 text-lg">
          Structured learning tracks designed to take you from beginner to expert
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span className="font-semibold">{tracks.length} Tracks</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span className="font-semibold">
                {tracks.reduce((sum, track) => sum + track.enrollment_count, 0)} Students
              </span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">Expert Instructors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tracks, skills, or topics..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={filters.difficulty || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    difficulty: e.target.value as any || undefined 
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <select
                  value={filters.duration || ''}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    duration: e.target.value as any || undefined 
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Any Duration</option>
                  <option value="short">Short (1-4 weeks)</option>
                  <option value="medium">Medium (1-3 months)</option>
                  <option value="long">Long (3+ months)</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={(e) => setFilters({ ...filters, featured: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured Only</span>
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ search: '', difficulty: undefined, duration: undefined, featured: false })}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Learning Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTracks.map((track) => (
          <div key={track.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {track.image_url && (
              <img
                src={track.image_url}
                alt={track.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                  {track.title}
                </h3>
                {track.is_featured && (
                  <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                    Featured
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {track.description}
              </p>

              <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{getDurationText(track.duration_weeks)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{track.enrollment_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-current text-yellow-400" />
                  <span>{track.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="mb-4">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(track.difficulty)}`}>
                  {track.difficulty.charAt(0).toUpperCase() + track.difficulty.slice(1)}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {track.skills_covered.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                  {track.skills_covered.length > 3 && (
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      +{track.skills_covered.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/learning/tracks/${track.id}`}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-center text-sm font-medium"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleEnroll(track.id)}
                  className="flex items-center justify-center px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <Play className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTracks.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tracks found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or filters to find learning tracks.
          </p>
        </div>
      )}
    </div>
  );
};

export default LearningHub;