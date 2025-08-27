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
      try {
        // Simulate API call - replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data - replace with actual API responses
        setStats({
          learningProgress: {
            completedModules: 12,
            totalModules: 24,
            currentStreak: 7,
            weeklyGoal: 5,
            weeklyProgress: 3,
          },
          githubActivity: {
            repositories: 8,
            commits: 45,
            stars: 23,
            contributions: 156,
          },
          mentorship: {
            activeMentorships: 2,
            upcomingSessions: 1,
            totalSessions: 8,
          },
          aiMentor: {
            questionsAsked: 34,
            codeReviews: 12,
            helpfulResponses: 28,
          },
        });

        setRecentActivity([
          {
            id: '1',
            type: 'learning',
            title: 'Completed React Hooks Module',
            description: 'Finished learning about useState and useEffect',
            timestamp: '2 hours ago',
            icon: BookOpen,
            color: 'text-primary-600',
          },
          {
            id: '2',
            type: 'github',
            title: 'Pushed to todo-app repository',
            description: 'Added authentication and user management',
            timestamp: '4 hours ago',
            icon: Github,
            color: 'text-secondary-600',
          },
          {
            id: '3',
            type: 'ai_mentor',
            title: 'AI Code Review Completed',
            description: 'Received feedback on your React component structure',
            timestamp: '6 hours ago',
            icon: Bot,
            color: 'text-accent-600',
          },
          {
            id: '4',
            type: 'mentorship',
            title: 'Mentorship Session Scheduled',
            description: 'Career guidance session with Sarah Chen',
            timestamp: '1 day ago',
            icon: Users,
            color: 'text-success-600',
          },
        ]);
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

        {/* Upcoming Events */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">Upcoming</h3>
              <Calendar className="h-5 w-5 text-secondary-500" />
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-success-100">
                  <Users className="h-4 w-4 text-success-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900">
                    Mentorship Session
                  </p>
                  <p className="text-sm text-secondary-600">
                    Career guidance with Sarah Chen
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">
                    Tomorrow at 2:00 PM
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-primary-100">
                  <BookOpen className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900">
                    Module Deadline
                  </p>
                  <p className="text-sm text-secondary-600">
                    Complete Advanced React Patterns
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">
                    Due in 3 days
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-accent-100">
                  <Code className="h-4 w-4 text-accent-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900">
                    Project Review
                  </p>
                  <p className="text-sm text-secondary-600">
                    Submit portfolio project for feedback
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">
                    Due in 1 week
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-secondary-200">
              <Link
                to="/mentorship"
                className="text-sm text-primary-600 hover:text-primary-500 inline-flex items-center"
              >
                Manage schedule
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;