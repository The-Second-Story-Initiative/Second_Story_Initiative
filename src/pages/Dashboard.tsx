import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Bot,
  Users,
  Github,
  TrendingUp,
  Clock,
  Target,
  Award,
  ArrowRight,
  Calendar,
  Code,
  MessageSquare,
  Star,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface DashboardStats {
  learningProgress: {
    completedModules: number;
    totalModules: number;
    currentStreak: number;
    weeklyGoal: number;
    weeklyProgress: number;
  };
  githubActivity: {
    repositories: number;
    commits: number;
    stars: number;
    contributions: number;
  };
  mentorship: {
    activeMentorships: number;
    upcomingSessions: number;
    totalSessions: number;
  };
  aiMentor: {
    questionsAsked: number;
    codeReviews: number;
    helpfulResponses: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'learning' | 'github' | 'mentorship' | 'ai_mentor';
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { token } = useAuthStore.getState();
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      try {
        const res = await fetch('/api/analytics/dashboard', { headers });
        if (res.ok) {
          const json = await res.json();
          const d = json.data ?? json;
          setStats({
            learningProgress: {
              completedModules: d.learning_progress?.completed_modules ?? 0,
              totalModules: d.learning_progress?.total_modules ?? 1,
              currentStreak: d.learning_progress?.current_streak ?? 0,
              weeklyGoal: d.learning_progress?.weekly_goal ?? 5,
              weeklyProgress: d.learning_progress?.weekly_progress ?? 0,
            },
            githubActivity: {
              repositories: d.github_activity?.repositories ?? 0,
              commits: d.github_activity?.commits_this_week ?? 0,
              stars: d.github_activity?.stars_received ?? 0,
              contributions: d.github_activity?.contributions_this_year ?? 0,
            },
            mentorship: {
              activeMentorships: d.mentorship?.active_mentorships ?? 0,
              upcomingSessions: d.mentorship?.upcoming_sessions ?? 0,
              totalSessions: d.mentorship?.total_sessions_completed ?? 0,
            },
            aiMentor: {
              questionsAsked: d.ai_mentor?.questions_asked ?? 0,
              codeReviews: d.ai_mentor?.code_reviews_completed ?? 0,
              helpfulResponses: d.ai_mentor?.helpful_responses ?? 0,
            },
          });

          const activities = d.learning_progress?.recent_activity ?? [];
          const iconMap: Record<string, any> = {
            module_completed: BookOpen,
            track_started: BookOpen,
            quiz_passed: Award,
            project_submitted: Github,
          };
          const colorMap: Record<string, string> = {
            module_completed: 'text-primary-600',
            track_started: 'text-accent-600',
            quiz_passed: 'text-success-600',
            project_submitted: 'text-secondary-600',
          };
          setRecentActivity(
            activities.slice(0, 5).map((a: any) => ({
              id: a.id,
              type: 'learning' as const,
              title: a.title,
              description: a.description,
              timestamp: new Date(a.timestamp).toLocaleDateString(),
              icon: iconMap[a.type] ?? BookOpen,
              color: colorMap[a.type] ?? 'text-primary-600',
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Continue Learning',
      description: 'Resume your current learning path',
      icon: BookOpen,
      href: '/learning',
      color: 'bg-primary-500',
    },
    {
      title: 'Ask AI Mentor',
      description: 'Get help with coding questions',
      icon: Bot,
      href: '/mentor',
      color: 'bg-accent-500',
    },
    {
      title: 'View Projects',
      description: 'Manage your GitHub projects',
      icon: Github,
      href: '/projects',
      color: 'bg-secondary-500',
    },
    {
      title: 'Find Mentors',
      description: 'Connect with industry experts',
      icon: Users,
      href: '/mentorship',
      color: 'bg-success-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Learner'}! 👋
        </h1>
        <p className="text-primary-100">
          Ready to continue your journey? You're making great progress!
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.href}
            className="card hover:shadow-lg transition-shadow group"
          >
            <div className="card-content">
              <div className={`h-12 w-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-secondary-900 mb-1">
                {action.title}
              </h3>
              <p className="text-sm text-secondary-600">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Learning Progress */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-secondary-900">Learning Progress</h3>
                <BookOpen className="h-5 w-5 text-primary-600" />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Modules Completed</span>
                    <span>{stats.learningProgress.completedModules}/{stats.learningProgress.totalModules}</span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full" 
                      style={{ width: `${(stats.learningProgress.completedModules / stats.learningProgress.totalModules) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4 text-success-500" />
                    <span className="text-sm text-secondary-600">Streak</span>
                  </div>
                  <span className="font-semibold text-success-600">{stats.learningProgress.currentStreak} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* GitHub Activity */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-secondary-900">GitHub Activity</h3>
                <Github className="h-5 w-5 text-secondary-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Repositories</span>
                  <span className="font-semibold">{stats.githubActivity.repositories}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Commits</span>
                  <span className="font-semibold">{stats.githubActivity.commits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Stars</span>
                  <span className="font-semibold">{stats.githubActivity.stars}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mentorship */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-secondary-900">Mentorship</h3>
                <Users className="h-5 w-5 text-success-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Active</span>
                  <span className="font-semibold">{stats.mentorship.activeMentorships}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Upcoming</span>
                  <span className="font-semibold">{stats.mentorship.upcomingSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Total Sessions</span>
                  <span className="font-semibold">{stats.mentorship.totalSessions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Mentor */}
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-secondary-900">AI Mentor</h3>
                <Bot className="h-5 w-5 text-accent-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Questions</span>
                  <span className="font-semibold">{stats.aiMentor.questionsAsked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Code Reviews</span>
                  <span className="font-semibold">{stats.aiMentor.codeReviews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary-600">Helpful</span>
                  <span className="font-semibold">{stats.aiMentor.helpfulResponses}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">Recent Activity</h3>
              <Activity className="h-5 w-5 text-secondary-500" />
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-secondary-100`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-secondary-600">
                      {activity.description}
                    </p>
                    <p className="text-xs text-secondary-500 mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <Link
                to="/analytics"
                className="text-sm text-primary-600 hover:text-primary-500 inline-flex items-center"
              >
                View all activity
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">Getting Started</h3>
              <Calendar className="h-5 w-5 text-secondary-500" />
            </div>
            <div className="space-y-4">
              <Link to="/learning" className="flex items-start space-x-3 group no-underline hover:no-underline">
                <div className="p-2 rounded-lg bg-primary-100">
                  <BookOpen className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900 group-hover:text-primary-600">
                    Enroll in a Learning Path
                  </p>
                  <p className="text-sm text-secondary-600">
                    Browse structured tracks and begin learning
                  </p>
                </div>
              </Link>
              <Link to="/mentor" className="flex items-start space-x-3 group no-underline hover:no-underline">
                <div className="p-2 rounded-lg bg-accent-100">
                  <Bot className="h-4 w-4 text-accent-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900 group-hover:text-primary-600">
                    Ask the AI Mentor
                  </p>
                  <p className="text-sm text-secondary-600">
                    Get instant help with code questions
                  </p>
                </div>
              </Link>
              <Link to="/mentorship" className="flex items-start space-x-3 group no-underline hover:no-underline">
                <div className="p-2 rounded-lg bg-success-100">
                  <Users className="h-4 w-4 text-success-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900 group-hover:text-primary-600">
                    Find a Mentor
                  </p>
                  <p className="text-sm text-secondary-600">
                    Connect with an industry professional
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;