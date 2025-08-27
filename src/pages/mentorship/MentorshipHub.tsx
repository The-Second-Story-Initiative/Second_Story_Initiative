import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  MessageCircle, 
  Calendar,
  Award,
  BookOpen,
  Code,
  Heart,
  CheckCircle,
  XCircle,
  User,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Mentor, MentorFilters, MentorshipRequest } from '../../types';
import { useAuthStore } from '../../stores/authStore';

const MentorshipHub = () => {
  const { user } = useAuthStore();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'find' | 'requests'>('find');
  const [filters, setFilters] = useState<MentorFilters>({
    expertise: [],
    availability: undefined,
    experience_level: undefined,
    price_range: undefined,
    rating: undefined,
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMentors();
    fetchMyRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [mentors, filters]);

  const fetchMentors = async () => {
    try {
      const response = await fetch('/api/mentorship/mentors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMentors(data.data);
      } else {
        toast.error('Failed to load mentors');
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast.error('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await fetch('/api/mentorship/requests/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...mentors];

    if (filters.search) {
      filtered = filtered.filter(mentor => 
        mentor.full_name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        mentor.bio.toLowerCase().includes(filters.search!.toLowerCase()) ||
        mentor.expertise.some(skill => 
          skill.toLowerCase().includes(filters.search!.toLowerCase())
        )
      );
    }

    if (filters.expertise && filters.expertise.length > 0) {
      filtered = filtered.filter(mentor => 
        filters.expertise!.some(skill => 
          mentor.expertise.includes(skill)
        )
      );
    }

    if (filters.availability) {
      filtered = filtered.filter(mentor => mentor.availability === filters.availability);
    }

    if (filters.experience_level) {
      filtered = filtered.filter(mentor => mentor.experience_level === filters.experience_level);
    }

    if (filters.rating) {
      filtered = filtered.filter(mentor => mentor.rating >= filters.rating!);
    }

    setFilteredMentors(filtered);
  };

  const sendMentorshipRequest = async (mentorId: string, message: string) => {
    try {
      const response = await fetch('/api/mentorship/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          mentor_id: mentorId,
          message
        })
      });

      if (response.ok) {
        toast.success('Mentorship request sent successfully!');
        fetchMyRequests();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Failed to send request');
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'completed': return <Award className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Mentorship Hub</h1>
        <p className="text-primary-100 text-lg">
          Connect with experienced mentors and accelerate your learning journey
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span className="font-semibold">{mentors.length} Mentors</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">1-on-1 Sessions</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span className="font-semibold">Expert Guidance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('find')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'find'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Find Mentors
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Requests ({myRequests.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'find' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search mentors..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Availability
                      </label>
                      <select
                        value={filters.availability || ''}
                        onChange={(e) => setFilters({ 
                          ...filters, 
                          availability: e.target.value as any || undefined 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">All Availability</option>
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level
                      </label>
                      <select
                        value={filters.experience_level || ''}
                        onChange={(e) => setFilters({ 
                          ...filters, 
                          experience_level: e.target.value as any || undefined 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">All Levels</option>
                        <option value="junior">Junior (1-3 years)</option>
                        <option value="mid">Mid (3-7 years)</option>
                        <option value="senior">Senior (7+ years)</option>
                        <option value="expert">Expert (10+ years)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Rating
                      </label>
                      <select
                        value={filters.rating || ''}
                        onChange={(e) => setFilters({ 
                          ...filters, 
                          rating: e.target.value ? parseFloat(e.target.value) : undefined 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Any Rating</option>
                        <option value="4.5">4.5+ Stars</option>
                        <option value="4.0">4.0+ Stars</option>
                        <option value="3.5">3.5+ Stars</option>
                        <option value="3.0">3.0+ Stars</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => setFilters({ 
                          search: '', 
                          expertise: [], 
                          availability: undefined, 
                          experience_level: undefined, 
                          rating: undefined 
                        })}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mentors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor) => (
                  <div key={mentor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start space-x-4 mb-4">
                        <img
                          src={mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.full_name)}&background=6366f1&color=fff`}
                          alt={mentor.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {mentor.full_name}
                          </h3>
                          <p className="text-sm text-gray-600">{mentor.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{mentor.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-sm text-gray-500">({mentor.total_sessions} sessions)</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {mentor.bio}
                      </p>

                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {mentor.expertise.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {mentor.expertise.length > 3 && (
                            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                              +{mentor.expertise.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(mentor.availability)}`}>
                          {mentor.availability}
                        </span>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>{mentor.timezone}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">${mentor.hourly_rate}/hour</span>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            to={`/mentorship/mentors/${mentor.id}`}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            View Profile
                          </Link>
                          <button
                            onClick={() => {
                              const message = prompt('Enter a message for your mentorship request:');
                              if (message) {
                                sendMentorshipRequest(mentor.id, message);
                              }
                            }}
                            disabled={mentor.availability === 'unavailable'}
                            className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Request
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMentors.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search criteria or filters to find mentors.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              {myRequests.length > 0 ? (
                myRequests.map((request) => (
                  <div key={request.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Request to {request.mentor?.full_name}
                          </h3>
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRequestStatusColor(request.status)}`}>
                            {getRequestStatusIcon(request.status)}
                            <span>{request.status}</span>
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{request.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Sent {new Date(request.created_at).toLocaleDateString()}</span>
                          {request.response_message && (
                            <span>• Response: {request.response_message}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {request.status === 'accepted' && (
                          <Link
                            to={`/mentorship/sessions/${request.id}`}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                          >
                            View Session
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No mentorship requests</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't sent any mentorship requests yet. Find a mentor to get started!
                  </p>
                  <button
                    onClick={() => setActiveTab('find')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Find Mentors
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorshipHub;