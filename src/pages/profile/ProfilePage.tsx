import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Github, 
  Linkedin, 
  Twitter,
  Globe,
  Edit3,
  Save,
  X,
  Camera,
  Award,
  BookOpen,
  Code,
  Users,
  Star,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { ProfileUpdateForm } from '../../types';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  github_username?: string;
  linkedin_url?: string;
  twitter_username?: string;
  skills: string[];
  interests: string[];
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferred_languages: string[];
  timezone: string;
  availability: 'full-time' | 'part-time' | 'weekends' | 'flexible';
  created_at: string;
  updated_at: string;
  stats: {
    completed_modules: number;
    total_learning_hours: number;
    github_commits: number;
    projects_created: number;
    mentorships_given: number;
    mentorships_received: number;
    achievements_earned: number;
  };
  recent_activity: {
    type: string;
    title: string;
    description: string;
    date: string;
  }[];
}

const ProfilePage = () => {
  const { user, updateProfile } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateForm>({
    full_name: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    github_username: '',
    linkedin_url: '',
    twitter_username: '',
    skills: [],
    interests: [],
    experience_level: 'beginner',
    preferred_languages: [],
    timezone: '',
    availability: 'flexible'
  });
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        setFormData({
          full_name: data.data.full_name || '',
          bio: data.data.bio || '',
          location: data.data.location || '',
          phone: data.data.phone || '',
          website: data.data.website || '',
          github_username: data.data.github_username || '',
          linkedin_url: data.data.linkedin_url || '',
          twitter_username: data.data.twitter_username || '',
          skills: data.data.skills || [],
          interests: data.data.interests || [],
          experience_level: data.data.experience_level || 'beginner',
          preferred_languages: data.data.preferred_languages || [],
          timezone: data.data.timezone || '',
          availability: data.data.availability || 'flexible'
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        updateProfile(data.data);
        setEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, avatar_url: data.avatar_url } : null);
        toast.success('Avatar updated successfully!');
      } else {
        toast.error('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.preferred_languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        preferred_languages: [...prev.preferred_languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_languages: prev.preferred_languages.filter(l => l !== language)
    }));
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white text-primary-600 rounded-full p-2 cursor-pointer hover:bg-gray-50 transition-colors">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile.full_name}</h1>
              <p className="text-primary-100 text-lg">{profile.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getExperienceColor(profile.experience_level)}`}>
                  {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
                </span>
                {profile.location && (
                  <div className="flex items-center space-x-1 text-primary-100">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 lg:mt-0">
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            {editing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-600">
                {profile.bio || 'No bio available'}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{profile.email}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Your phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{profile.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Your location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location || 'Not provided'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                {editing ? (
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="Your website URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Globe className="h-4 w-4" />
                    {profile.website ? (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {profile.website}
                      </a>
                    ) : (
                      <span>Not provided</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Username</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.github_username}
                    onChange={(e) => setFormData(prev => ({ ...prev, github_username: e.target.value }))}
                    placeholder="Your GitHub username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Github className="h-4 w-4" />
                    {profile.github_username ? (
                      <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        @{profile.github_username}
                      </a>
                    ) : (
                      <span>Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                {editing ? (
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="Your LinkedIn profile URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Linkedin className="h-4 w-4" />
                    {profile.linkedin_url ? (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        LinkedIn Profile
                      </a>
                    ) : (
                      <span>Not provided</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twitter Username</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.twitter_username}
                    onChange={(e) => setFormData(prev => ({ ...prev, twitter_username: e.target.value }))}
                    placeholder="Your Twitter username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Twitter className="h-4 w-4" />
                    {profile.twitter_username ? (
                      <a href={`https://twitter.com/${profile.twitter_username}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        @{profile.twitter_username}
                      </a>
                    ) : (
                      <span>Not provided</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills and Interests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills &amp; Interests</h2>
            
            {/* Skills */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              {editing && (
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="Add a skill"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(editing ? formData.skills : profile.skills).map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {skill}
                    {editing && (
                      <button
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
              {editing && (
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                    placeholder="Add an interest"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={addInterest}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(editing ? formData.interests : profile.interests).map((interest, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    {interest}
                    {editing && (
                      <button
                        onClick={() => removeInterest(interest)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Programming Languages</label>
              {editing && (
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                    placeholder="Add a programming language"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    onClick={addLanguage}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(editing ? formData.preferred_languages : profile.preferred_languages).map((language, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    {language}
                    {editing && (
                      <button
                        onClick={() => removeLanguage(language)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Preferences */}
          {editing && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="weekends">Weekends</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    placeholder="e.g., UTC-5, EST, PST"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {editing && (
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setEditing(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Completed Modules</span>
                </div>
                <span className="font-semibold text-gray-900">{profile.stats.completed_modules}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Learning Hours</span>
                </div>
                <span className="font-semibold text-gray-900">{profile.stats.total_learning_hours}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Code className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">GitHub Commits</span>
                </div>
                <span className="font-semibold text-gray-900">{profile.stats.github_commits}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Projects Created</span>
                </div>
                <span className="font-semibold text-gray-900">{profile.stats.projects_created}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm text-gray-600">Mentorships</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {profile.stats.mentorships_given + profile.stats.mentorships_received}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Achievements</span>
                </div>
                <span className="font-semibold text-gray-900">{profile.stats.achievements_earned}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {profile.recent_activity.map((activity, index) => (
                <div key={index} className="border-l-2 border-primary-200 pl-4 pb-3">
                  <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                  <p className="text-gray-600 text-xs">{activity.description}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Member Since */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Since</h3>
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{new Date(profile.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;