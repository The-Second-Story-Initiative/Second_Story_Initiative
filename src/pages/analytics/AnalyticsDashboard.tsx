import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Code, 
  MessageCircle,
  Award,
  Calendar,
  Clock,
  Target,
  Activity,
  GitBranch,
  Star,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { DashboardAnalytics, LearningActivity, PlatformAnalytics } from '../../types';
import { useAuthStore } from '../../stores/authStore';

const AnalyticsDashboard = () => {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);
  const [learningActivity, setLearningActivity] = useState<LearningActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'personal' | 'platform'>('personal');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch personal analytics
      const { token } = useAuthStore.getState();
      const personalResponse = await fetch(`/api/analytics/dashboard?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (personalResponse.ok) {
        const personalData = await personalResponse.json();
        setAnalytics(personalData.data);
      }

      // Fetch platform analytics (if user has access)
      const platformResponse = await fetch(`/api/analytics/platform?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        }
      });
      
      if (platformResponse.ok) {
        const platformData = await platformResponse.json();
        setPlatformAnalytics(platformData.data);
      }

      // Fetch learning activity
      const activityResponse = await fetch(`/api/analytics/learning-activity?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        }
      });
      
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setLearningActivity(activityData.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(`/api/analytics/export?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Analytics data exported successfully!');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

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
      <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 rounded-lg p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-secondary-100 text-lg">
              Track your progress and platform insights
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/70 focus:ring-2 focus:ring-white/30"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={exportData}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('personal')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'personal'
                  ? 'border-secondary-500 text-secondary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Personal Analytics
            </button>
            {platformAnalytics && (
              <button
                onClick={() => setActiveTab('platform')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'platform'
                    ? 'border-secondary-500 text-secondary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Platform Analytics
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'personal' && analytics && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Learning Hours</p>
                      <p className="text-2xl font-bold">{(analytics as any).total_learning_hours ?? 0}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-200" />
                  </div>
                  {(() => { const c = (analytics as any).learning_hours_change ?? 0; return (
                  <div className={`flex items-center space-x-1 mt-2 ${getChangeColor(c)}`}>
                    {getChangeIcon(c)}
                    <span className="text-sm">
                      {c > 0 ? '+' : ''}{c}% from last period
                    </span>
                  </div>
                  ); })()}
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Completed Modules</p>
                      <p className="text-2xl font-bold">{analytics.learning_progress?.completed_modules ?? 0}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-green-200" />
                  </div>
                  {(() => { const c = (analytics as any).completed_modules_change ?? 0; return (
                  <div className={`flex items-center space-x-1 mt-2 ${getChangeColor(c)}`}>
                    {getChangeIcon(c)}
                    <span className="text-sm">
                      {c > 0 ? '+' : ''}{c}% from last period
                    </span>
                  </div>
                  ); })()}
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">GitHub Commits</p>
                      <p className="text-2xl font-bold">{analytics.github_activity?.commits_this_week ?? 0}</p>
                    </div>
                    <GitBranch className="h-8 w-8 text-purple-200" />
                  </div>
                  {(() => { const c = (analytics as any).github_commits_change ?? 0; return (
                  <div className={`flex items-center space-x-1 mt-2 ${getChangeColor(c)}`}>
                    {getChangeIcon(c)}
                    <span className="text-sm">
                      {c > 0 ? '+' : ''}{c}% from last period
                    </span>
                  </div>
                  ); })()}
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">AI Interactions</p>
                      <p className="text-2xl font-bold">{analytics.ai_mentor?.questions_asked ?? 0}</p>
                    </div>
                    <MessageCircle className="h-8 w-8 text-orange-200" />
                  </div>
                  {(() => { const c = (analytics as any).ai_interactions_change ?? 0; return (
                  <div className={`flex items-center space-x-1 mt-2 ${getChangeColor(c)}`}>
                    {getChangeIcon(c)}
                    <span className="text-sm">
                      {c > 0 ? '+' : ''}{c}% from last period
                    </span>
                  </div>
                  ); })()}
                </div>
              </div>

              {/* Learning Activity Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Activity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={learningActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="hours" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h3>
                  <div className="space-y-4">
                    {((analytics as any).learning_tracks ?? []).map((track: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{track.name}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${track.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 ml-4">{track.progress}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={(analytics as any).skills_distribution ?? []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {((analytics as any).skills_distribution ?? []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
                <div className="space-y-3">
                  {((analytics as any).recent_achievements ?? []).map((achievement: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Award className="h-6 w-6 text-yellow-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{achievement.title}</p>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'platform' && platformAnalytics && (
            <div className="space-y-6">
              {/* Platform Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm">Total Users</p>
                      <p className="text-2xl font-bold">{formatNumber(platformAnalytics.users?.total ?? 0)}</p>
                    </div>
                    <Users className="h-8 w-8 text-indigo-200" />
                  </div>
                  {(() => { const c = (platformAnalytics as any).users_growth ?? 0; return (
                  <div className={`flex items-center space-x-1 mt-2 ${getChangeColor(c)}`}>
                    {getChangeIcon(c)}
                    <span className="text-sm">
                      {c > 0 ? '+' : ''}{c}% growth
                    </span>
                  </div>
                  ); })()}
                </div>

                <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-teal-100 text-sm">Active Sessions</p>
                      <p className="text-2xl font-bold">{formatNumber(platformAnalytics.users?.active_this_month ?? 0)}</p>
                    </div>
                    <Activity className="h-8 w-8 text-teal-200" />
                  </div>
                  {(() => { const c = (platformAnalytics as any).sessions_growth ?? 0; return (
                  <div className={`flex items-center space-x-1 mt-2 ${getChangeColor(c)}`}>
                    {getChangeIcon(c)}
                    <span className="text-sm">
                      {c > 0 ? '+' : ''}{c}% growth
                    </span>
                  </div>
                  ); })()}
                </div>

                <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-100 text-sm">Total Projects</p>
                      <p className="text-2xl font-bold">{formatNumber(platformAnalytics.projects?.total_projects ?? 0)}</p>
                    </div>
                    <Code className="h-8 w-8 text-pink-200" />
                  </div>
                  {(() => { const c = (platformAnalytics as any).projects_growth ?? 0; return (
                  <div className={`flex items-center space-x-1 mt-2 ${getChangeColor(c)}`}>
                    {getChangeIcon(c)}
                    <span className="text-sm">
                      {c > 0 ? '+' : ''}{c}% growth
                    </span>
                  </div>
                  ); })()}
                </div>

                <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">Mentorships</p>
                      <p className="text-2xl font-bold">{formatNumber(platformAnalytics.mentorship?.total_mentors ?? 0)}</p>
                    </div>
                    <Star className="h-8 w-8 text-amber-200" />
                  </div>
                  {(() => { const c = (platformAnalytics as any).mentorships_growth ?? 0; return (
                  <div className={`flex items-center space-x-1 mt-2 ${getChangeColor(c)}`}>
                    {getChangeIcon(c)}
                    <span className="text-sm">
                      {c > 0 ? '+' : ''}{c}% growth
                    </span>
                  </div>
                  ); })()}
                </div>
              </div>

              {/* Platform Usage Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Usage Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={(platformAnalytics as any).usage_trends ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Feature Usage */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={(platformAnalytics as any).feature_usage ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;