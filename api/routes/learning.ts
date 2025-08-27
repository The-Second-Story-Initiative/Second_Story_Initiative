/**
 * Learning Pathways API routes for Second Story Initiative
 * Handle learning tracks, modules, progress tracking, and achievements
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Get All Learning Tracks
 * GET /api/learning/tracks
 */
router.get('/tracks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: tracks, error } = await supabase
      .from('learning_tracks')
      .select(`
        *,
        modules:modules(count)
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch learning tracks' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { tracks },
      message: 'Learning tracks fetched successfully'
    });
  } catch (error) {
    console.error('Fetch tracks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning tracks'
    });
  }
});

/**
 * Get Track Details with Modules
 * GET /api/learning/tracks/:trackId
 */
router.get('/tracks/:trackId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackId } = req.params;

    const { data: track, error } = await supabase
      .from('learning_tracks')
      .select(`
        *,
        modules (
          id,
          title,
          description,
          content,
          order_index,
          estimated_hours,
          difficulty_level,
          prerequisites,
          learning_objectives,
          is_active
        )
      `)
      .eq('id', trackId)
      .eq('is_active', true)
      .single();

    if (error || !track) {
      res.status(404).json({ success: false, error: 'Learning track not found' });
      return;
    }

    // Sort modules by order_index
    if (track.modules) {
      track.modules.sort((a: any, b: any) => a.order_index - b.order_index);
    }

    res.status(200).json({
      success: true,
      data: { track },
      message: 'Track details fetched successfully'
    });
  } catch (error) {
    console.error('Fetch track details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch track details'
    });
  }
});

/**
 * Enroll in Learning Track
 * POST /api/learning/tracks/:trackId/enroll
 */
router.post('/tracks/:trackId/enroll', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { trackId } = req.params;

    // Check if track exists
    const { data: track, error: trackError } = await supabase
      .from('learning_tracks')
      .select('id, name')
      .eq('id', trackId)
      .eq('is_active', true)
      .single();

    if (trackError || !track) {
      res.status(404).json({ success: false, error: 'Learning track not found' });
      return;
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('user_track_enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('track_id', trackId)
      .single();

    if (existingEnrollment) {
      res.status(400).json({ success: false, error: 'Already enrolled in this track' });
      return;
    }

    // Create enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('user_track_enrollments')
      .insert({
        user_id: req.user.id,
        track_id: trackId,
        enrolled_at: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (enrollError) {
      res.status(500).json({ success: false, error: 'Failed to enroll in track' });
      return;
    }

    res.status(201).json({
      success: true,
      data: { enrollment, track },
      message: `Successfully enrolled in ${track.name}`
    });
  } catch (error) {
    console.error('Track enrollment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enroll in track'
    });
  }
});

/**
 * Get User's Learning Progress
 * GET /api/learning/progress
 */
router.get('/progress', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get user's track enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('user_track_enrollments')
      .select(`
        *,
        learning_tracks (
          id,
          name,
          description,
          difficulty_level,
          estimated_hours
        )
      `)
      .eq('user_id', req.user.id)
      .eq('status', 'active');

    if (enrollError) {
      res.status(500).json({ success: false, error: 'Failed to fetch enrollments' });
      return;
    }

    // Get detailed progress for each track
    const progressData = await Promise.all(
      (enrollments || []).map(async (enrollment: any) => {
        const { data: progress } = await supabase
          .from('progress')
          .select(`
            *,
            modules (
              id,
              title,
              track_id,
              order_index
            )
          `)
          .eq('user_id', req.user!.id)
          .eq('modules.track_id', enrollment.track_id);

        const { data: modules } = await supabase
          .from('modules')
          .select('id, title, order_index')
          .eq('track_id', enrollment.track_id)
          .eq('is_active', true)
          .order('order_index');

        const totalModules = modules?.length || 0;
        const completedModules = progress?.filter(p => p.status === 'completed').length || 0;
        const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        return {
          ...enrollment,
          progress: {
            total_modules: totalModules,
            completed_modules: completedModules,
            progress_percentage: progressPercentage,
            current_module: progress?.find(p => p.status === 'in_progress')?.modules || null,
            recent_activity: progress?.slice(0, 3) || []
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: { enrollments: progressData },
      message: 'Learning progress fetched successfully'
    });
  } catch (error) {
    console.error('Fetch progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning progress'
    });
  }
});

/**
 * Update Module Progress
 * POST /api/learning/modules/:moduleId/progress
 */
router.post('/modules/:moduleId/progress', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { moduleId } = req.params;
    const { status, completion_percentage = 0, notes = '' } = req.body;

    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status value' });
      return;
    }

    // Check if module exists
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('id, title, track_id')
      .eq('id', moduleId)
      .eq('is_active', true)
      .single();

    if (moduleError || !module) {
      res.status(404).json({ success: false, error: 'Module not found' });
      return;
    }

    // Check if user is enrolled in the track
    const { data: enrollment } = await supabase
      .from('user_track_enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('track_id', module.track_id)
      .eq('status', 'active')
      .single();

    if (!enrollment) {
      res.status(403).json({ success: false, error: 'Not enrolled in this learning track' });
      return;
    }

    // Update or create progress record
    const { data: existingProgress } = await supabase
      .from('progress')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('module_id', moduleId)
      .single();

    let progressRecord;
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('progress')
        .update({
          status,
          completion_percentage,
          notes,
          updated_at: new Date().toISOString(),
          ...(status === 'completed' && { completed_at: new Date().toISOString() })
        })
        .eq('id', existingProgress.id)
        .select()
        .single();

      if (error) {
        res.status(500).json({ success: false, error: 'Failed to update progress' });
        return;
      }
      progressRecord = data;
    } else {
      // Create new progress record
      const { data, error } = await supabase
        .from('progress')
        .insert({
          user_id: req.user.id,
          module_id: moduleId,
          status,
          completion_percentage,
          notes,
          started_at: new Date().toISOString(),
          ...(status === 'completed' && { completed_at: new Date().toISOString() })
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ success: false, error: 'Failed to create progress record' });
        return;
      }
      progressRecord = data;
    }

    res.status(200).json({
      success: true,
      data: { progress: progressRecord, module },
      message: 'Progress updated successfully'
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress'
    });
  }
});

/**
 * Get Module Details
 * GET /api/learning/modules/:moduleId
 */
router.get('/modules/:moduleId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { moduleId } = req.params;

    const { data: module, error } = await supabase
      .from('modules')
      .select(`
        *,
        learning_tracks (
          id,
          name,
          description
        )
      `)
      .eq('id', moduleId)
      .eq('is_active', true)
      .single();

    if (error || !module) {
      res.status(404).json({ success: false, error: 'Module not found' });
      return;
    }

    // Get user's progress for this module if authenticated
    let userProgress = null;
    if (req.user) {
      const { data: progress } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('module_id', moduleId)
        .single();
      
      userProgress = progress;
    }

    res.status(200).json({
      success: true,
      data: { 
        module,
        user_progress: userProgress
      },
      message: 'Module details fetched successfully'
    });
  } catch (error) {
    console.error('Fetch module error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch module details'
    });
  }
});

/**
 * Get Learning Analytics
 * GET /api/learning/analytics
 */
router.get('/analytics', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get overall progress statistics
    const { data: allProgress } = await supabase
      .from('progress')
      .select(`
        *,
        modules (
          track_id,
          learning_tracks (name)
        )
      `)
      .eq('user_id', req.user.id);

    const totalModules = allProgress?.length || 0;
    const completedModules = allProgress?.filter(p => p.status === 'completed').length || 0;
    const inProgressModules = allProgress?.filter(p => p.status === 'in_progress').length || 0;

    // Calculate time spent (mock data for now)
    const totalTimeSpent = allProgress?.reduce((total, p) => {
      return total + (p.completion_percentage * 2); // Rough estimate: 2 hours per 100%
    }, 0) || 0;

    // Get track-wise progress
    const trackProgress = allProgress?.reduce((acc: any, progress: any) => {
      const trackName = progress.modules?.learning_tracks?.name || 'Unknown';
      if (!acc[trackName]) {
        acc[trackName] = { total: 0, completed: 0 };
      }
      acc[trackName].total++;
      if (progress.status === 'completed') {
        acc[trackName].completed++;
      }
      return acc;
    }, {}) || {};

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = allProgress?.filter(p => 
      new Date(p.updated_at) > sevenDaysAgo
    ).length || 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total_modules: totalModules,
          completed_modules: completedModules,
          in_progress_modules: inProgressModules,
          completion_rate: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
          total_time_spent: Math.round(totalTimeSpent),
          recent_activity: recentActivity
        },
        track_progress: Object.entries(trackProgress).map(([name, data]: [string, any]) => ({
          track_name: name,
          total_modules: data.total,
          completed_modules: data.completed,
          progress_percentage: Math.round((data.completed / data.total) * 100)
        })),
        recent_progress: allProgress?.slice(0, 5) || []
      },
      message: 'Learning analytics fetched successfully'
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning analytics'
    });
  }
});

export default router;