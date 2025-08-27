/**
 * Database Service for Second Story Initiative
 * Handles learner profiles, progress tracking, and analytics
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface LearnerProfile {
  id?: string;
  user_id: string;
  slack_user_id: string;
  name: string;
  email?: string;
  track?: string;
  current_week: number;
  skills: string[];
  goals: string[];
  mentor_id?: string;
  timezone?: string;
  github_username?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  created_at: string;
  updated_at: string;
  last_active: string;
  completion_rate: number;
  challenges_completed: number;
  challenges_failed: number;
  mentor_sessions_attended: number;
  mentor_sessions_missed: number;
  days_inactive: number;
  achievement_badges: string[];
  preferences: {
    notification_frequency: 'daily' | 'weekly' | 'minimal';
    preferred_learning_style: 'visual' | 'hands-on' | 'reading' | 'mixed';
    availability: string[];
    interests: string[];
  };
}

export interface ProgressEntry {
  id?: string;
  learner_id: string;
  date: string;
  activity_type: 'challenge' | 'mentor_session' | 'pair_programming' | 'standup' | 'achievement';
  description: string;
  status: 'completed' | 'in_progress' | 'failed' | 'skipped';
  metadata: any;
  created_at: string;
}

export interface Challenge {
  id?: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  track: string;
  week_number: number;
  skills_required: string[];
  skills_learned: string[];
  github_template?: string;
  instructions: string;
  success_criteria: string[];
  resources: {
    title: string;
    url: string;
    type: 'video' | 'article' | 'documentation' | 'tutorial';
  }[];
  estimated_hours: number;
  created_at: string;
  created_by: string;
}

export interface MentorProfile {
  id?: string;
  user_id: string;
  slack_user_id: string;
  name: string;
  email: string;
  specialties: string[];
  experience_years: number;
  availability: {
    timezone: string;
    schedule: string[];
  };
  max_mentees: number;
  current_mentees: string[];
  bio: string;
  linkedin_url?: string;
  github_username?: string;
  created_at: string;
  is_active: boolean;
}

export interface StandupEntry {
  id?: string;
  learner_id: string;
  date: string;
  yesterday_progress: string;
  today_goals: string;
  blockers: string;
  mood_rating: number; // 1-5
  created_at: string;
}

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // Learner Profile Management
  async createLearnerProfile(slackUserId: string): Promise<LearnerProfile> {
    try {
      // Get Slack user info first
      const userInfo = await this.getSlackUserInfo(slackUserId);
      
      const profileData: Partial<LearnerProfile> = {
        slack_user_id: slackUserId,
        user_id: slackUserId, // Using slack ID as user ID for now
        name: userInfo.real_name || userInfo.display_name || 'Unknown User',
        email: userInfo.email,
        current_week: 1,
        skills: [],
        goals: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        completion_rate: 0,
        challenges_completed: 0,
        challenges_failed: 0,
        mentor_sessions_attended: 0,
        mentor_sessions_missed: 0,
        days_inactive: 0,
        achievement_badges: [],
        preferences: {
          notification_frequency: 'daily',
          preferred_learning_style: 'mixed',
          availability: [],
          interests: [],
        },
      };

      const { data, error } = await this.supabase
        .from('learner_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as LearnerProfile;
    } catch (error) {
      console.error('Error creating learner profile:', error);
      throw error;
    }
  }

  async getLearnerProfile(slackUserId: string): Promise<LearnerProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('learner_profiles')
        .select('*')
        .eq('slack_user_id', slackUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data as LearnerProfile | null;
    } catch (error) {
      console.error('Error getting learner profile:', error);
      return null;
    }
  }

  async updateLearnerProfile(slackUserId: string, updates: Partial<LearnerProfile>): Promise<LearnerProfile> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('learner_profiles')
        .update(updateData)
        .eq('slack_user_id', slackUserId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as LearnerProfile;
    } catch (error) {
      console.error('Error updating learner profile:', error);
      throw error;
    }
  }

  async getAllLearnerProfiles(): Promise<LearnerProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('learner_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data as LearnerProfile[];
    } catch (error) {
      console.error('Error getting all learner profiles:', error);
      return [];
    }
  }

  // Progress Tracking
  async recordProgress(learnerSlackId: string, entry: Omit<ProgressEntry, 'id' | 'learner_id' | 'created_at'>): Promise<ProgressEntry> {
    try {
      const learner = await this.getLearnerProfile(learnerSlackId);
      if (!learner) {
        throw new Error('Learner profile not found');
      }

      const progressData: Omit<ProgressEntry, 'id'> = {
        learner_id: learner.id!,
        ...entry,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('progress_entries')
        .insert(progressData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update learner's last active and relevant metrics
      await this.updateLearnerMetrics(learnerSlackId, entry.activity_type, entry.status);

      return data as ProgressEntry;
    } catch (error) {
      console.error('Error recording progress:', error);
      throw error;
    }
  }

  async getLearnerProgress(slackUserId: string, limit: number = 10): Promise<ProgressEntry[]> {
    try {
      const learner = await this.getLearnerProfile(slackUserId);
      if (!learner) {
        return [];
      }

      const { data, error } = await this.supabase
        .from('progress_entries')
        .select('*')
        .eq('learner_id', learner.id!)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data as ProgressEntry[];
    } catch (error) {
      console.error('Error getting learner progress:', error);
      return [];
    }
  }

  // Challenge Management
  async createChallenge(challenge: Omit<Challenge, 'id' | 'created_at'>): Promise<Challenge> {
    try {
      const challengeData = {
        ...challenge,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('challenges')
        .insert(challengeData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as Challenge;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  async getChallengesForLearner(slackUserId: string): Promise<Challenge[]> {
    try {
      const learner = await this.getLearnerProfile(slackUserId);
      if (!learner) {
        return [];
      }

      const { data, error } = await this.supabase
        .from('challenges')
        .select('*')
        .eq('track', learner.track || 'general')
        .lte('week_number', learner.current_week + 1) // Include current and next week
        .order('week_number', { ascending: true });

      if (error) {
        throw error;
      }

      return data as Challenge[];
    } catch (error) {
      console.error('Error getting challenges for learner:', error);
      return [];
    }
  }

  // Standup Management
  async recordStandup(slackUserId: string, standupData: Omit<StandupEntry, 'id' | 'learner_id' | 'created_at' | 'date'>): Promise<StandupEntry> {
    try {
      const learner = await this.getLearnerProfile(slackUserId);
      if (!learner) {
        throw new Error('Learner profile not found');
      }

      const entryData: Omit<StandupEntry, 'id'> = {
        learner_id: learner.id!,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        ...standupData,
        created_at: new Date().toISOString(),
      };

      // Check if standup for today already exists
      const { data: existing } = await this.supabase
        .from('standups')
        .select('id')
        .eq('learner_id', learner.id!)
        .eq('date', entryData.date)
        .single();

      let result;
      if (existing) {
        // Update existing standup
        const { data, error } = await this.supabase
          .from('standups')
          .update(entryData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new standup
        const { data, error } = await this.supabase
          .from('standups')
          .insert(entryData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Record progress
      await this.recordProgress(slackUserId, {
        date: new Date().toISOString(),
        activity_type: 'standup',
        description: `Daily standup: ${standupData.today_goals}`,
        status: 'completed',
        metadata: { mood_rating: standupData.mood_rating },
      });

      return result as StandupEntry;
    } catch (error) {
      console.error('Error recording standup:', error);
      throw error;
    }
  }

  // Mentor Management
  async getMentorProfiles(): Promise<MentorProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('mentor_profiles')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      return data as MentorProfile[];
    } catch (error) {
      console.error('Error getting mentor profiles:', error);
      return [];
    }
  }

  async findAvailableMentors(skills?: string[]): Promise<MentorProfile[]> {
    try {
      let query = this.supabase
        .from('mentor_profiles')
        .select('*')
        .eq('is_active', true);

      if (skills && skills.length > 0) {
        query = query.overlaps('specialties', skills);
      }

      const { data, error } = await query
        .lt('current_mentees', 'max_mentees')
        .order('experience_years', { ascending: false });

      if (error) {
        throw error;
      }

      return data as MentorProfile[];
    } catch (error) {
      console.error('Error finding available mentors:', error);
      return [];
    }
  }

  // Analytics and Metrics
  async getLearnerMetrics(): Promise<any> {
    try {
      const { data: totalLearners, error: totalError } = await this.supabase
        .from('learner_profiles')
        .select('id', { count: 'exact' });

      const { data: activeLearners, error: activeError } = await this.supabase
        .from('learner_profiles')
        .select('id', { count: 'exact' })
        .gte('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { data: challengesThisWeek, error: challengesError } = await this.supabase
        .from('progress_entries')
        .select('id', { count: 'exact' })
        .eq('activity_type', 'challenge')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { data: avgCompletion, error: completionError } = await this.supabase
        .from('learner_profiles')
        .select('completion_rate');

      if (totalError || activeError || challengesError || completionError) {
        throw new Error('Error fetching metrics');
      }

      const averageCompletionRate = avgCompletion?.length 
        ? avgCompletion.reduce((sum, l) => sum + l.completion_rate, 0) / avgCompletion.length 
        : 0;

      return {
        totalLearners: totalLearners?.length || 0,
        activeLearners: activeLearners?.length || 0,
        challengesCompletedThisWeek: challengesThisWeek?.length || 0,
        averageCompletionRate: Math.round(averageCompletionRate),
      };
    } catch (error) {
      console.error('Error getting learner metrics:', error);
      return {
        totalLearners: 0,
        activeLearners: 0,
        challengesCompletedThisWeek: 0,
        averageCompletionRate: 0,
      };
    }
  }

  async getEngagementMetrics(): Promise<any> {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: standups, error: standupError } = await this.supabase
        .from('standups')
        .select('id', { count: 'exact' })
        .gte('created_at', weekAgo.toISOString());

      const { data: mentorSessions, error: mentorError } = await this.supabase
        .from('progress_entries')
        .select('id', { count: 'exact' })
        .eq('activity_type', 'mentor_session')
        .gte('created_at', weekAgo.toISOString());

      const { data: pairSessions, error: pairError } = await this.supabase
        .from('progress_entries')
        .select('id', { count: 'exact' })
        .eq('activity_type', 'pair_programming')
        .gte('created_at', weekAgo.toISOString());

      if (standupError || mentorError || pairError) {
        throw new Error('Error fetching engagement metrics');
      }

      return {
        standupsThisWeek: standups?.length || 0,
        mentorSessionsThisWeek: mentorSessions?.length || 0,
        pairSessionsThisWeek: pairSessions?.length || 0,
      };
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      return {
        standupsThisWeek: 0,
        mentorSessionsThisWeek: 0,
        pairSessionsThisWeek: 0,
      };
    }
  }

  async identifyAtRiskLearners(): Promise<LearnerProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('learner_profiles')
        .select('*')
        .or('days_inactive.gte.7,completion_rate.lt.30,challenges_failed.gte.3')
        .order('days_inactive', { ascending: false });

      if (error) {
        throw error;
      }

      return data as LearnerProfile[];
    } catch (error) {
      console.error('Error identifying at-risk learners:', error);
      return [];
    }
  }

  // Helper Methods
  private async updateLearnerMetrics(slackUserId: string, activityType: string, status: string): Promise<void> {
    try {
      const learner = await this.getLearnerProfile(slackUserId);
      if (!learner) return;

      const updates: Partial<LearnerProfile> = {
        last_active: new Date().toISOString(),
        days_inactive: 0, // Reset since they're active now
      };

      if (activityType === 'challenge') {
        if (status === 'completed') {
          updates.challenges_completed = (learner.challenges_completed || 0) + 1;
        } else if (status === 'failed') {
          updates.challenges_failed = (learner.challenges_failed || 0) + 1;
        }
      } else if (activityType === 'mentor_session') {
        if (status === 'completed') {
          updates.mentor_sessions_attended = (learner.mentor_sessions_attended || 0) + 1;
        } else if (status === 'skipped') {
          updates.mentor_sessions_missed = (learner.mentor_sessions_missed || 0) + 1;
        }
      }

      // Recalculate completion rate
      const totalChallenges = (updates.challenges_completed || learner.challenges_completed || 0) + 
                            (updates.challenges_failed || learner.challenges_failed || 0);
      if (totalChallenges > 0) {
        updates.completion_rate = Math.round(
          ((updates.challenges_completed || learner.challenges_completed || 0) / totalChallenges) * 100
        );
      }

      await this.updateLearnerProfile(slackUserId, updates);
    } catch (error) {
      console.error('Error updating learner metrics:', error);
    }
  }

  private async getSlackUserInfo(slackUserId: string): Promise<any> {
    // This would typically call Slack API to get user info
    // For now, return minimal info
    return {
      id: slackUserId,
      real_name: 'Unknown User',
      display_name: 'Unknown User',
      email: null,
    };
  }
}