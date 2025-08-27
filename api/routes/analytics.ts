/**
 * Analytics API routes for Second Story Initiative
 * Handle user progress tracking, platform metrics, and reporting
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Get User Dashboard Analytics
 * GET /api/analytics/dashboard
 */
router.get('/dashboard', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const userId = req.user.id;
    const analytics: any = {};

    // Learning Progress
    const { data: enrollments } = await supabase
      .from('user_track_enrollments')
      .select(`
        *,
        track:track_id (
          title,
          total_modules
        )
      `)
      .eq('user_id', userId);

    const { data: moduleProgress } = await supabase
      .from('user_module_progress')
      .select('*')
      .eq('user_id', userId);

    // Calculate learning metrics
    const totalEnrollments = enrollments?.length || 0;
    const completedModules = moduleProgress?.filter(p => p.status === 'completed').length || 0;
    const inProgressModules = moduleProgress?.filter(p => p.status === 'in_progress').length || 0;
    const totalModules = enrollments?.reduce((sum, e) => sum + (e.track?.total_modules || 0), 0) || 0;
    const completionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    analytics.learning = {
      total_enrollments: totalEnrollments,
      completed_modules: completedModules,
      in_progress_modules: inProgressModules,
      total_modules: totalModules,
      completion_rate: completionRate,
      estimated_hours: completedModules * 2 // Assuming 2 hours per module
    };

    // GitHub Activity
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId);

    analytics.projects = {
      total_projects: projects?.length || 0,
      active_projects: projects?.filter(p => p.status === 'active').length || 0,
      completed_projects: projects?.filter(p => p.status === 'completed').length || 0,
      submitted_projects: projects?.filter(p => p.status === 'submitted').length || 0
    };

    // AI Mentor Interactions
    const { data: aiReviews } = await supabase
      .from('ai_reviews')
      .select('*')
      .eq('user_id', userId);

    const { data: aiChats } = await supabase
      .from('ai_chat_history')
      .select('*')
      .eq('user_id', userId);

    analytics.ai_mentor = {
      total_reviews: aiReviews?.length || 0,
      total_chat_sessions: aiChats?.length || 0,
      recent_reviews: aiReviews?.slice(-5) || [],
      avg_review_score: aiReviews?.length > 0 
        ? Math.round(aiReviews.reduce((sum, r) => sum + (r.score || 0), 0) / aiReviews.length)
        : 0
    };

    // Mentorship Data
    let mentorshipQuery = supabase
      .from('mentorships')
      .select('*');

    if (req.user.role === 'mentor') {
      mentorshipQuery = mentorshipQuery.eq('mentor_id', userId);
    } else {
      mentorshipQuery = mentorshipQuery.eq('mentee_id', userId);
    }

    const { data: mentorships } = await mentorshipQuery;

    const { data: sessions } = await supabase
      .from('mentorship_sessions')
      .select(`
        *,
        mentorship:mentorship_id (
          mentor_id,
          mentee_id
        )
      `)
      .or(`mentorship.mentor_id.eq.${userId},mentorship.mentee_id.eq.${userId}`);

    analytics.mentorship = {
      total_mentorships: mentorships?.length || 0,
      active_mentorships: mentorships?.filter(m => m.status === 'active').length || 0,
      total_sessions: sessions?.length || 0,
      completed_sessions: sessions?.filter(s => s.status === 'completed').length || 0
    };

    // Recent Activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = {
      modules_completed: moduleProgress?.filter(p => 
        p.status === 'completed' && new Date(p.completed_at) > thirtyDaysAgo
      ).length || 0,
      projects_created: projects?.filter(p => 
        new Date(p.created_at) > thirtyDaysAgo
      ).length || 0,
      ai_reviews_received: aiReviews?.filter(r => 
        new Date(r.created_at) > thirtyDaysAgo
      ).length || 0,
      mentorship_sessions: sessions?.filter(s => 
        s.status === 'completed' && new Date(s.completed_at) > thirtyDaysAgo
      ).length || 0
    };

    analytics.recent_activity = recentActivity;

    res.status(200).json({
      success: true,
      data: { analytics },
      message: 'Dashboard analytics fetched successfully'
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics'
    });
  }
});

/**
 * Get Learning Progress Analytics
 * GET /api/analytics/learning-progress
 */
router.get('/learning-progress', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { timeframe = '30d', track_id } = req.query;
    const userId = req.user.id;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get progress data
    let progressQuery = supabase
      .from('user_module_progress')
      .select(`
        *,
        module:module_id (
          title,
          track_id,
          track:track_id (
            title
          )
        )
      `)
      .eq('user_id', userId)
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString());

    if (track_id) {
      progressQuery = progressQuery.eq('module.track_id', track_id);
    }

    const { data: progressData, error } = await progressQuery
      .order('updated_at', { ascending: true });

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch progress data' });
      return;
    }

    // Group progress by date
    const dailyProgress: { [key: string]: any } = {};
    
    progressData?.forEach(progress => {
      const date = new Date(progress.updated_at).toISOString().split('T')[0];
      
      if (!dailyProgress[date]) {
        dailyProgress[date] = {
          date,
          modules_started: 0,
          modules_completed: 0,
          time_spent: 0
        };
      }
      
      if (progress.status === 'completed') {
        dailyProgress[date].modules_completed++;
      } else if (progress.status === 'in_progress') {
        dailyProgress[date].modules_started++;
      }
      
      dailyProgress[date].time_spent += progress.time_spent || 0;
    });

    // Convert to array and fill missing dates
    const progressArray = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      progressArray.push(dailyProgress[dateStr] || {
        date: dateStr,
        modules_started: 0,
        modules_completed: 0,
        time_spent: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary statistics
    const summary = {
      total_modules_completed: progressData?.filter(p => p.status === 'completed').length || 0,
      total_time_spent: progressData?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0,
      avg_daily_progress: progressArray.length > 0 
        ? Math.round(progressArray.reduce((sum, day) => sum + day.modules_completed, 0) / progressArray.length * 100) / 100
        : 0,
      streak_days: calculateStreak(progressArray)
    };

    res.status(200).json({
      success: true,
      data: {
        progress: progressArray,
        summary
      },
      message: 'Learning progress analytics fetched successfully'
    });
  } catch (error) {
    console.error('Learning progress analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning progress analytics'
    });
  }
});

/**
 * Get Platform Analytics (Admin only)
 * GET /api/analytics/platform
 */
router.get('/platform', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // User Statistics
    const { data: allUsers } = await supabase
      .from('users')
      .select('*');

    const { data: newUsers } = await supabase
      .from('users')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const userStats = {
      total_users: allUsers?.length || 0,
      new_users: newUsers?.length || 0,
      learners: allUsers?.filter(u => u.role === 'learner').length || 0,
      mentors: allUsers?.filter(u => u.role === 'mentor').length || 0,
      employers: allUsers?.filter(u => u.role === 'employer').length || 0,
      active_users: allUsers?.filter(u => 
        new Date(u.last_login_at) > startDate
      ).length || 0
    };

    // Learning Statistics
    const { data: enrollments } = await supabase
      .from('user_track_enrollments')
      .select('*');

    const { data: moduleProgress } = await supabase
      .from('user_module_progress')
      .select('*')
      .gte('updated_at', startDate.toISOString());

    const learningStats = {
      total_enrollments: enrollments?.length || 0,
      new_enrollments: enrollments?.filter(e => 
        new Date(e.enrolled_at) > startDate
      ).length || 0,
      modules_completed: moduleProgress?.filter(p => p.status === 'completed').length || 0,
      avg_completion_rate: calculateAvgCompletionRate(enrollments, moduleProgress)
    };

    // Project Statistics
    const { data: projects } = await supabase
      .from('projects')
      .select('*');

    const { data: newProjects } = await supabase
      .from('projects')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const projectStats = {
      total_projects: projects?.length || 0,
      new_projects: newProjects?.length || 0,
      active_projects: projects?.filter(p => p.status === 'active').length || 0,
      completed_projects: projects?.filter(p => p.status === 'completed').length || 0
    };

    // Mentorship Statistics
    const { data: mentorships } = await supabase
      .from('mentorships')
      .select('*');

    const { data: sessions } = await supabase
      .from('mentorship_sessions')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const mentorshipStats = {
      total_mentorships: mentorships?.length || 0,
      active_mentorships: mentorships?.filter(m => m.status === 'active').length || 0,
      new_sessions: sessions?.length || 0,
      completed_sessions: sessions?.filter(s => s.status === 'completed').length || 0
    };

    // AI Mentor Usage
    const { data: aiReviews } = await supabase
      .from('ai_reviews')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const { data: aiChats } = await supabase
      .from('ai_chat_history')
      .select('*')
      .gte('created_at', startDate.toISOString());

    const aiStats = {
      total_reviews: aiReviews?.length || 0,
      total_chat_sessions: aiChats?.length || 0,
      avg_review_score: aiReviews?.length > 0 
        ? Math.round(aiReviews.reduce((sum, r) => sum + (r.score || 0), 0) / aiReviews.length)
        : 0
    };

    const analytics = {
      users: userStats,
      learning: learningStats,
      projects: projectStats,
      mentorship: mentorshipStats,
      ai_mentor: aiStats,
      timeframe
    };

    res.status(200).json({
      success: true,
      data: { analytics },
      message: 'Platform analytics fetched successfully'
    });
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform analytics'
    });
  }
});

/**
 * Get User Engagement Metrics
 * GET /api/analytics/engagement
 */
router.get('/engagement', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const userId = req.user.id;
    const { timeframe = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get user activity data
    const activities = [];

    // Module progress activities
    const { data: moduleActivities } = await supabase
      .from('user_module_progress')
      .select(`
        updated_at,
        status,
        module:module_id (
          title,
          track:track_id (
            title
          )
        )
      `)
      .eq('user_id', userId)
      .gte('updated_at', startDate.toISOString())
      .order('updated_at', { ascending: false });

    moduleActivities?.forEach(activity => {
      activities.push({
        type: 'module_progress',
        timestamp: activity.updated_at,
        description: `${activity.status === 'completed' ? 'Completed' : 'Started'} module: ${activity.module?.title}`,
        metadata: {
          module: activity.module?.title,
          track: activity.module?.track?.title,
          status: activity.status
        }
      });
    });

    // Project activities
    const { data: projectActivities } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    projectActivities?.forEach(project => {
      activities.push({
        type: 'project_created',
        timestamp: project.created_at,
        description: `Created project: ${project.title}`,
        metadata: {
          project: project.title,
          status: project.status
        }
      });
    });

    // AI Review activities
    const { data: reviewActivities } = await supabase
      .from('ai_reviews')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    reviewActivities?.forEach(review => {
      activities.push({
        type: 'ai_review',
        timestamp: review.created_at,
        description: `Received AI code review`,
        metadata: {
          score: review.score,
          suggestions_count: review.suggestions?.length || 0
        }
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate engagement metrics
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const activeDays = new Set(activities.map(a => new Date(a.timestamp).toISOString().split('T')[0])).size;
    
    const metrics = {
      total_activities: activities.length,
      active_days: activeDays,
      engagement_rate: Math.round((activeDays / totalDays) * 100),
      avg_activities_per_day: Math.round((activities.length / totalDays) * 100) / 100,
      activity_breakdown: {
        module_progress: activities.filter(a => a.type === 'module_progress').length,
        project_created: activities.filter(a => a.type === 'project_created').length,
        ai_review: activities.filter(a => a.type === 'ai_review').length
      }
    };

    res.status(200).json({
      success: true,
      data: {
        activities: activities.slice(0, 50), // Limit to recent 50 activities
        metrics
      },
      message: 'Engagement metrics fetched successfully'
    });
  } catch (error) {
    console.error('Engagement metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement metrics'
    });
  }
});

// Helper Functions
function calculateStreak(progressArray: any[]): number {
  let currentStreak = 0;
  let maxStreak = 0;
  
  for (let i = progressArray.length - 1; i >= 0; i--) {
    if (progressArray[i].modules_completed > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak;
}

function calculateAvgCompletionRate(enrollments: any[], moduleProgress: any[]): number {
  if (!enrollments || enrollments.length === 0) return 0;
  
  const completionRates = enrollments.map(enrollment => {
    const userProgress = moduleProgress?.filter(p => p.user_id === enrollment.user_id) || [];
    const completedModules = userProgress.filter(p => p.status === 'completed').length;
    const totalModules = enrollment.track?.total_modules || 1;
    return (completedModules / totalModules) * 100;
  });
  
  return Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length);
}

export default router;