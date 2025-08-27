/**
 * Projects API routes for Second Story Initiative
 * Handle project showcase, portfolio management, and project interactions
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Get All Public Projects
 * GET /api/projects
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, visibility, featured, technologies } = req.query;
    
    let query = supabase
      .from('projects')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (featured === 'true') {
      query = query.eq('featured', true);
    }
    
    if (technologies) {
      const techArray = Array.isArray(technologies) ? technologies : [technologies];
      query = query.overlaps('technologies', techArray);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Fetch projects error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch projects'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: projects || [],
      message: 'Projects fetched successfully'
    });
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

/**
 * Get User's Projects
 * GET /api/projects/my
 */
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, status, visibility, featured, technologies } = req.query;
    const userId = req.user?.id;
    
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (visibility) {
      query = query.eq('visibility', visibility);
    }
    
    if (featured === 'true') {
      query = query.eq('featured', true);
    }
    
    if (technologies) {
      const techArray = Array.isArray(technologies) ? technologies : [technologies];
      query = query.overlaps('technologies', techArray);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Fetch user projects error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user projects'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: projects || [],
      message: 'User projects fetched successfully'
    });
  } catch (error) {
    console.error('Fetch user projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user projects'
    });
  }
});

/**
 * Get Project by ID
 * GET /api/projects/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fetch project error:', error);
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Increment view count
    await supabase
      .from('projects')
      .update({ views_count: (project.views_count || 0) + 1 })
      .eq('id', id);

    res.status(200).json({
      success: true,
      data: project,
      message: 'Project fetched successfully'
    });
  } catch (error) {
    console.error('Fetch project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

/**
 * Create New Project
 * POST /api/projects
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      title,
      description,
      github_repo_url,
      live_demo_url,
      technologies,
      status,
      visibility,
      image_url
    } = req.body;

    // Validate required fields
    if (!title || !description) {
      res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
      return;
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title,
        description,
        github_repo_url,
        live_demo_url,
        technologies: technologies || [],
        status: status || 'planning',
        visibility: visibility || 'public',
        image_url,
        featured: false,
        likes_count: 0,
        views_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Create project error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project'
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

/**
 * Update Project
 * PUT /api/projects/:id
 */
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      title,
      description,
      github_repo_url,
      live_demo_url,
      technologies,
      status,
      visibility,
      image_url
    } = req.body;

    // Check if user owns the project
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    if (existingProject.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this project'
      });
      return;
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update({
        title,
        description,
        github_repo_url,
        live_demo_url,
        technologies,
        status,
        visibility,
        image_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

/**
 * Delete Project
 * DELETE /api/projects/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if user owns the project
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingProject) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    if (existingProject.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this project'
      });
      return;
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete project'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

/**
 * Toggle Project Like
 * POST /api/projects/:id/like
 */
router.post('/:id/like', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, likes_count')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }

    // Check if user already liked this project
    const { data: existingLike, error: likeError } = await supabase
      .from('project_likes')
      .select('id')
      .eq('project_id', id)
      .eq('user_id', userId)
      .single();

    let newLikesCount = project.likes_count || 0;

    if (existingLike) {
      // Unlike the project
      await supabase
        .from('project_likes')
        .delete()
        .eq('project_id', id)
        .eq('user_id', userId);
      
      newLikesCount = Math.max(0, newLikesCount - 1);
    } else {
      // Like the project
      await supabase
        .from('project_likes')
        .insert({
          project_id: id,
          user_id: userId
        });
      
      newLikesCount = newLikesCount + 1;
    }

    // Update project likes count
    const { error: updateError } = await supabase
      .from('projects')
      .update({ likes_count: newLikesCount })
      .eq('id', id);

    if (updateError) {
      console.error('Update likes count error:', updateError);
      res.status(500).json({
        success: false,
        error: 'Failed to update likes count'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        likes_count: newLikesCount,
        liked: !existingLike
      },
      message: existingLike ? 'Project unliked' : 'Project liked'
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
});

export default router;