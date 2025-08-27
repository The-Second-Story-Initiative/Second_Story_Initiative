/**
 * Mentorship API routes for Second Story Initiative
 * Handle mentor-learner matching, session scheduling, and mentorship management
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Get Available Mentors
 * GET /api/mentorship/mentors
 */
router.get('/mentors', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { specialization, availability, experience_level } = req.query;

    let query = supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        bio,
        specializations,
        experience_level,
        availability_schedule,
        mentor_rating,
        total_mentees,
        profile_image_url,
        github_username,
        linkedin_url,
        created_at
      `)
      .eq('role', 'mentor')
      .eq('is_active_mentor', true);

    // Apply filters
    if (specialization) {
      query = query.contains('specializations', [specialization]);
    }

    if (experience_level) {
      query = query.eq('experience_level', experience_level);
    }

    const { data: mentors, error } = await query
      .order('mentor_rating', { ascending: false })
      .limit(20);

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch mentors' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { mentors },
      message: 'Mentors fetched successfully'
    });
  } catch (error) {
    console.error('Fetch mentors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mentors'
    });
  }
});

/**
 * Request Mentorship
 * POST /api/mentorship/request
 */
router.post('/request', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { mentor_id, message, preferred_schedule, goals } = req.body;

    if (!mentor_id) {
      res.status(400).json({ success: false, error: 'Mentor ID is required' });
      return;
    }

    // Check if mentor exists and is active
    const { data: mentor, error: mentorError } = await supabase
      .from('users')
      .select('id, full_name, role, is_active_mentor')
      .eq('id', mentor_id)
      .eq('role', 'mentor')
      .eq('is_active_mentor', true)
      .single();

    if (mentorError || !mentor) {
      res.status(404).json({ success: false, error: 'Mentor not found or not available' });
      return;
    }

    // Check if there's already a pending or active mentorship
    const { data: existingMentorship } = await supabase
      .from('mentorships')
      .select('id, status')
      .eq('mentee_id', req.user.id)
      .eq('mentor_id', mentor_id)
      .in('status', ['pending', 'active'])
      .single();

    if (existingMentorship) {
      res.status(400).json({ 
        success: false, 
        error: `You already have a ${existingMentorship.status} mentorship with this mentor` 
      });
      return;
    }

    // Create mentorship request
    const { data: mentorship, error: createError } = await supabase
      .from('mentorships')
      .insert({
        mentor_id,
        mentee_id: req.user.id,
        status: 'pending',
        request_message: message,
        preferred_schedule,
        goals,
        requested_at: new Date().toISOString()
      })
      .select(`
        *,
        mentor:mentor_id (
          id,
          full_name,
          email,
          specializations
        ),
        mentee:mentee_id (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (createError) {
      res.status(500).json({ success: false, error: 'Failed to create mentorship request' });
      return;
    }

    res.status(201).json({
      success: true,
      data: { mentorship },
      message: 'Mentorship request sent successfully'
    });
  } catch (error) {
    console.error('Request mentorship error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request mentorship'
    });
  }
});

/**
 * Get Mentorship Requests (for mentors)
 * GET /api/mentorship/requests
 */
router.get('/requests', authenticateToken, requireRole('mentor'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { status = 'pending' } = req.query;

    const { data: requests, error } = await supabase
      .from('mentorships')
      .select(`
        *,
        mentee:mentee_id (
          id,
          full_name,
          email,
          bio,
          current_learning_track,
          github_username,
          profile_image_url
        )
      `)
      .eq('mentor_id', req.user.id)
      .eq('status', status)
      .order('requested_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch mentorship requests' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { requests },
      message: 'Mentorship requests fetched successfully'
    });
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mentorship requests'
    });
  }
});

/**
 * Respond to Mentorship Request
 * POST /api/mentorship/requests/:requestId/respond
 */
router.post('/requests/:requestId/respond', authenticateToken, requireRole('mentor'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { requestId } = req.params;
    const { action, response_message, proposed_schedule } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      res.status(400).json({ success: false, error: 'Action must be either "accept" or "decline"' });
      return;
    }

    // Get the mentorship request
    const { data: mentorship, error: fetchError } = await supabase
      .from('mentorships')
      .select('*')
      .eq('id', requestId)
      .eq('mentor_id', req.user.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !mentorship) {
      res.status(404).json({ success: false, error: 'Mentorship request not found' });
      return;
    }

    // Update mentorship status
    const updateData: any = {
      status: action === 'accept' ? 'active' : 'declined',
      response_message,
      responded_at: new Date().toISOString()
    };

    if (action === 'accept') {
      updateData.started_at = new Date().toISOString();
      updateData.schedule = proposed_schedule;
    }

    const { data: updatedMentorship, error: updateError } = await supabase
      .from('mentorships')
      .update(updateData)
      .eq('id', requestId)
      .select(`
        *,
        mentor:mentor_id (
          id,
          full_name,
          email
        ),
        mentee:mentee_id (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (updateError) {
      res.status(500).json({ success: false, error: 'Failed to update mentorship request' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { mentorship: updatedMentorship },
      message: `Mentorship request ${action}ed successfully`
    });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to respond to mentorship request'
    });
  }
});

/**
 * Get User's Mentorships
 * GET /api/mentorship/my-mentorships
 */
router.get('/my-mentorships', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { status } = req.query;

    let query = supabase
      .from('mentorships')
      .select(`
        *,
        mentor:mentor_id (
          id,
          full_name,
          email,
          bio,
          specializations,
          profile_image_url,
          github_username
        ),
        mentee:mentee_id (
          id,
          full_name,
          email,
          bio,
          current_learning_track,
          profile_image_url,
          github_username
        )
      `);

    // Filter by user role
    if (req.user.role === 'mentor') {
      query = query.eq('mentor_id', req.user.id);
    } else {
      query = query.eq('mentee_id', req.user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: mentorships, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch mentorships' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { mentorships },
      message: 'Mentorships fetched successfully'
    });
  } catch (error) {
    console.error('Fetch mentorships error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mentorships'
    });
  }
});

/**
 * Schedule Mentorship Session
 * POST /api/mentorship/:mentorshipId/sessions
 */
router.post('/:mentorshipId/sessions', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { mentorshipId } = req.params;
    const { scheduled_at, duration_minutes = 60, agenda, session_type = 'general' } = req.body;

    if (!scheduled_at) {
      res.status(400).json({ success: false, error: 'Scheduled time is required' });
      return;
    }

    // Verify mentorship exists and user is part of it
    const { data: mentorship, error: mentorshipError } = await supabase
      .from('mentorships')
      .select('*')
      .eq('id', mentorshipId)
      .eq('status', 'active')
      .or(`mentor_id.eq.${req.user.id},mentee_id.eq.${req.user.id}`)
      .single();

    if (mentorshipError || !mentorship) {
      res.status(404).json({ success: false, error: 'Active mentorship not found' });
      return;
    }

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('mentorship_sessions')
      .insert({
        mentorship_id: mentorshipId,
        scheduled_at,
        duration_minutes,
        agenda,
        session_type,
        status: 'scheduled',
        created_by: req.user.id,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        mentorship:mentorship_id (
          mentor:mentor_id (full_name),
          mentee:mentee_id (full_name)
        )
      `)
      .single();

    if (sessionError) {
      res.status(500).json({ success: false, error: 'Failed to schedule session' });
      return;
    }

    res.status(201).json({
      success: true,
      data: { session },
      message: 'Session scheduled successfully'
    });
  } catch (error) {
    console.error('Schedule session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule session'
    });
  }
});

/**
 * Get Mentorship Sessions
 * GET /api/mentorship/:mentorshipId/sessions
 */
router.get('/:mentorshipId/sessions', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { mentorshipId } = req.params;
    const { status, limit = 20 } = req.query;

    // Verify user is part of the mentorship
    const { data: mentorship } = await supabase
      .from('mentorships')
      .select('id')
      .eq('id', mentorshipId)
      .or(`mentor_id.eq.${req.user.id},mentee_id.eq.${req.user.id}`)
      .single();

    if (!mentorship) {
      res.status(404).json({ success: false, error: 'Mentorship not found' });
      return;
    }

    let query = supabase
      .from('mentorship_sessions')
      .select('*')
      .eq('mentorship_id', mentorshipId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sessions, error } = await query
      .order('scheduled_at', { ascending: false })
      .limit(Number(limit));

    if (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { sessions },
      message: 'Sessions fetched successfully'
    });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

/**
 * Update Session Status
 * PATCH /api/mentorship/sessions/:sessionId
 */
router.patch('/sessions/:sessionId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { sessionId } = req.params;
    const { status, notes, feedback } = req.body;

    if (!['scheduled', 'completed', 'cancelled', 'no_show'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status value' });
      return;
    }

    // Verify session exists and user is part of the mentorship
    const { data: session, error: sessionError } = await supabase
      .from('mentorship_sessions')
      .select(`
        *,
        mentorship:mentorship_id (
          mentor_id,
          mentee_id
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }

    const mentorship = session.mentorship as any;
    if (mentorship.mentor_id !== req.user.id && mentorship.mentee_id !== req.user.id) {
      res.status(403).json({ success: false, error: 'Not authorized to update this session' });
      return;
    }

    // Update session
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (notes) updateData.notes = notes;
    if (feedback) updateData.feedback = feedback;
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const { data: updatedSession, error: updateError } = await supabase
      .from('mentorship_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      res.status(500).json({ success: false, error: 'Failed to update session' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { session: updatedSession },
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session'
    });
  }
});

/**
 * Get Mentorship Analytics
 * GET /api/mentorship/analytics
 */
router.get('/analytics', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    let analytics: any = {};

    if (req.user.role === 'mentor') {
      // Mentor analytics
      const { data: mentorships } = await supabase
        .from('mentorships')
        .select('*')
        .eq('mentor_id', req.user.id);

      const { data: sessions } = await supabase
        .from('mentorship_sessions')
        .select(`
          *,
          mentorship:mentorship_id (
            mentor_id
          )
        `)
        .eq('mentorship.mentor_id', req.user.id);

      analytics = {
        total_mentees: mentorships?.length || 0,
        active_mentorships: mentorships?.filter(m => m.status === 'active').length || 0,
        total_sessions: sessions?.length || 0,
        completed_sessions: sessions?.filter(s => s.status === 'completed').length || 0,
        pending_requests: mentorships?.filter(m => m.status === 'pending').length || 0
      };
    } else {
      // Mentee analytics
      const { data: mentorships } = await supabase
        .from('mentorships')
        .select('*')
        .eq('mentee_id', req.user.id);

      const { data: sessions } = await supabase
        .from('mentorship_sessions')
        .select(`
          *,
          mentorship:mentorship_id (
            mentee_id
          )
        `)
        .eq('mentorship.mentee_id', req.user.id);

      analytics = {
        total_mentors: mentorships?.length || 0,
        active_mentorships: mentorships?.filter(m => m.status === 'active').length || 0,
        total_sessions: sessions?.length || 0,
        completed_sessions: sessions?.filter(s => s.status === 'completed').length || 0,
        pending_requests: mentorships?.filter(m => m.status === 'pending').length || 0
      };
    }

    res.status(200).json({
      success: true,
      data: { analytics },
      message: 'Analytics fetched successfully'
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

export default router;