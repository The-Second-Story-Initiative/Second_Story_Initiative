/**
 * Authentication API routes for Second Story Initiative
 * Handle user registration, login, token management, and profile management
 */
import { Router, type Request, type Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = 'learner' } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
      return;
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authData.user) {
      res.status(400).json({
        success: false,
        error: authError?.message || 'Failed to create user'
      });
      return;
    }

    // Create user profile in database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role,
        profile_data: {}
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      res.status(500).json({
        success: false,
        error: 'Failed to create user profile'
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role
        }
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
      return;
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role, profile_data')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: profile,
        session: authData.session
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await supabase.auth.signOut();
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get Current User Profile
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Get full user profile with additional data
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: profile }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Update User Profile
 * PUT /api/auth/profile
 */
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const { name, profile_data } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (profile_data) updateData.profile_data = profile_data;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: updatedProfile },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;