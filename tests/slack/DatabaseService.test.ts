/**
 * Tests for DatabaseService
 */

import { DatabaseService, LearnerProfile, ProgressEntry } from '../../api/slack/DatabaseService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        limit: jest.fn(),
        order: jest.fn()
      })),
      gte: jest.fn(() => ({
        single: jest.fn(),
        limit: jest.fn(),
        order: jest.fn()
      })),
      lt: jest.fn(() => ({
        order: jest.fn()
      })),
      lte: jest.fn(() => ({
        order: jest.fn()
      })),
      overlaps: jest.fn(() => ({
        lt: jest.fn(() => ({
          order: jest.fn()
        }))
      })),
      or: jest.fn(() => ({
        order: jest.fn()
      })),
      order: jest.fn(),
      limit: jest.fn(),
      single: jest.fn()
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  })),
  rpc: jest.fn()
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let supabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    supabaseClient = createClient('test-url', 'test-key');
    databaseService = new DatabaseService(supabaseClient);
  });

  describe('Learner Profile Management', () => {
    const mockProfile: LearnerProfile = global.testData.mockProfile;

    describe('createLearnerProfile', () => {
      it('should create a new learner profile successfully', async () => {
        const mockInsertChain = {
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          }))
        };

        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue(mockInsertChain)
        });

        const result = await databaseService.createLearnerProfile('U1234567890');

        expect(mockSupabase.from).toHaveBeenCalledWith('learner_profiles');
        expect(result).toEqual(mockProfile);
      });

      it('should handle database errors when creating profile', async () => {
        const mockError = new Error('Database connection failed');
        const mockInsertChain = {
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: mockError })
          }))
        };

        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue(mockInsertChain)
        });

        await expect(databaseService.createLearnerProfile('U1234567890'))
          .rejects.toThrow('Database connection failed');
      });
    });

    describe('getLearnerProfile', () => {
      it('should retrieve existing learner profile', async () => {
        const mockSelectChain = {
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          }))
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue(mockSelectChain)
        });

        const result = await databaseService.getLearnerProfile('U1234567890');

        expect(mockSupabase.from).toHaveBeenCalledWith('learner_profiles');
        expect(mockSelectChain.eq).toHaveBeenCalledWith('slack_user_id', 'U1234567890');
        expect(result).toEqual(mockProfile);
      });

      it('should return null when profile not found', async () => {
        const mockSelectChain = {
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { code: 'PGRST116' } // No rows returned
            })
          }))
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue(mockSelectChain)
        });

        const result = await databaseService.getLearnerProfile('UNOTFOUND');

        expect(result).toBeNull();
      });
    });

    describe('updateLearnerProfile', () => {
      it('should update learner profile successfully', async () => {
        const updates = { track: 'python', current_week: 2 };
        const updatedProfile = { ...mockProfile, ...updates };

        const mockUpdateChain = {
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: updatedProfile, error: null })
            }))
          }))
        };

        mockSupabase.from.mockReturnValue({
          update: jest.fn().mockReturnValue(mockUpdateChain)
        });

        const result = await databaseService.updateLearnerProfile('U1234567890', updates);

        expect(mockSupabase.from).toHaveBeenCalledWith('learner_profiles');
        expect(result).toEqual(updatedProfile);
      });
    });
  });

  describe('Progress Tracking', () => {
    const mockProgressEntry: Omit<ProgressEntry, 'id' | 'learner_id' | 'created_at'> = {
      date: '2024-01-01T00:00:00Z',
      activity_type: 'challenge',
      description: 'Completed HTML basics challenge',
      status: 'completed',
      metadata: { difficulty: 'beginner' }
    };

    describe('recordProgress', () => {
      it('should record progress entry successfully', async () => {
        // Mock getLearnerProfile
        const mockProfile = { ...global.testData.mockProfile, id: 'profile-id-123' };
        const mockSelectChain = {
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          }))
        };

        // Mock progress insert
        const mockInsertChain = {
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ 
              data: { ...mockProgressEntry, id: 'progress-id-123', learner_id: 'profile-id-123' }, 
              error: null 
            })
          }))
        };

        // Mock profile update for metrics
        const mockUpdateChain = {
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
            }))
          }))
        };

        mockSupabase.from
          .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockSelectChain) })
          .mockReturnValueOnce({ insert: jest.fn().mockReturnValue(mockInsertChain) })
          .mockReturnValueOnce({ update: jest.fn().mockReturnValue(mockUpdateChain) });

        const result = await databaseService.recordProgress('U1234567890', mockProgressEntry);

        expect(result).toHaveProperty('id');
        expect(result.activity_type).toBe('challenge');
        expect(result.status).toBe('completed');
      });

      it('should throw error when learner not found', async () => {
        const mockSelectChain = {
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          }))
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue(mockSelectChain)
        });

        await expect(databaseService.recordProgress('UNOTFOUND', mockProgressEntry))
          .rejects.toThrow('Learner profile not found');
      });
    });
  });

  describe('Challenge Management', () => {
    const mockChallenge = {
      title: 'HTML Basics',
      description: 'Learn HTML fundamentals',
      difficulty: 'beginner' as const,
      track: 'web_development',
      week_number: 1,
      skills_required: [],
      skills_learned: ['HTML'],
      instructions: 'Create an HTML page',
      success_criteria: ['Valid HTML structure'],
      created_by: 'system',
      estimated_hours: 2,
      resources: []
    };

    describe('createChallenge', () => {
      it('should create a new challenge successfully', async () => {
        const mockInsertChain = {
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ 
              data: { ...mockChallenge, id: 'challenge-id-123' }, 
              error: null 
            })
          }))
        };

        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue(mockInsertChain)
        });

        const result = await databaseService.createChallenge(mockChallenge);

        expect(mockSupabase.from).toHaveBeenCalledWith('challenges');
        expect(result).toHaveProperty('id');
        expect(result.title).toBe('HTML Basics');
      });
    });

    describe('getChallengesForLearner', () => {
      it('should return challenges for learner track and week', async () => {
        const mockProfile = { ...global.testData.mockProfile, track: 'web_development', current_week: 2 };
        const mockChallenges = [
          { ...mockChallenge, id: 'challenge-1', week_number: 1 },
          { ...mockChallenge, id: 'challenge-2', week_number: 2 }
        ];

        // Mock profile lookup
        const mockProfileChain = {
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          }))
        };

        // Mock challenges lookup
        const mockChallengesChain = {
          eq: jest.fn(() => ({
            lte: jest.fn(() => ({
              order: jest.fn().mockResolvedValue({ data: mockChallenges, error: null })
            }))
          }))
        };

        mockSupabase.from
          .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockProfileChain) })
          .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockChallengesChain) });

        const result = await databaseService.getChallengesForLearner('U1234567890');

        expect(result).toHaveLength(2);
        expect(result[0].week_number).toBe(1);
        expect(result[1].week_number).toBe(2);
      });
    });
  });

  describe('Standup Management', () => {
    const mockStandupData = {
      yesterday_progress: 'Completed HTML tutorial',
      today_goals: 'Start CSS challenge',
      blockers: 'None',
      mood_rating: 4
    };

    describe('recordStandup', () => {
      it('should create new standup entry', async () => {
        const mockProfile = { ...global.testData.mockProfile, id: 'profile-id-123' };
        
        // Mock profile lookup
        const mockProfileChain = {
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          }))
        };

        // Mock existing standup check (none found)
        const mockExistingChain = {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: null, error: null })
              }))
            }))
          }))
        };

        // Mock standup insert
        const mockInsertChain = {
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ 
              data: { ...mockStandupData, id: 'standup-id-123', learner_id: 'profile-id-123' }, 
              error: null 
            })
          }))
        };

        // Mock progress recording
        const mockProgressChain = {
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ 
              data: { id: 'progress-id-123' }, 
              error: null 
            })
          }))
        };

        mockSupabase.from
          .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockProfileChain) })
          .mockReturnValueOnce(mockExistingChain)
          .mockReturnValueOnce({ insert: jest.fn().mockReturnValue(mockInsertChain) })
          .mockReturnValueOnce({ insert: jest.fn().mockReturnValue(mockProgressChain) })
          .mockReturnValueOnce({ update: jest.fn().mockReturnValue({ eq: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }) })) })) }) });

        const result = await databaseService.recordStandup('U1234567890', mockStandupData);

        expect(result).toHaveProperty('id');
        expect(result.today_goals).toBe('Start CSS challenge');
        expect(result.mood_rating).toBe(4);
      });
    });
  });

  describe('Metrics and Analytics', () => {
    describe('getLearnerMetrics', () => {
      it('should return comprehensive learner metrics', async () => {
        const mockMetrics = {
          totalLearners: 50,
          activeLearners: 35,
          challengesCompletedThisWeek: 120,
          averageCompletionRate: 78
        };

        // Mock various metric queries
        mockSupabase.from
          .mockReturnValueOnce({ 
            select: jest.fn().mockResolvedValue({ data: new Array(50), error: null }) 
          })
          .mockReturnValueOnce({ 
            select: jest.fn(() => ({
              gte: jest.fn().mockResolvedValue({ data: new Array(35), error: null })
            }))
          })
          .mockReturnValueOnce({ 
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  gte: jest.fn().mockResolvedValue({ data: new Array(120), error: null })
                }))
              }))
            }))
          })
          .mockReturnValueOnce({ 
            select: jest.fn().mockResolvedValue({ 
              data: [
                { completion_rate: 85 },
                { completion_rate: 70 },
                { completion_rate: 80 }
              ], 
              error: null 
            }) 
          });

        const result = await databaseService.getLearnerMetrics();

        expect(result.totalLearners).toBe(50);
        expect(result.activeLearners).toBe(35);
        expect(result.challengesCompletedThisWeek).toBe(120);
        expect(result.averageCompletionRate).toBe(78); // Average of 85, 70, 80
      });
    });

    describe('identifyAtRiskLearners', () => {
      it('should identify learners who need support', async () => {
        const atRiskLearners = [
          { ...global.testData.mockProfile, days_inactive: 10, completion_rate: 25 },
          { ...global.testData.mockProfile, days_inactive: 14, completion_rate: 45 }
        ];

        const mockSelectChain = {
          or: jest.fn(() => ({
            order: jest.fn().mockResolvedValue({ data: atRiskLearners, error: null })
          }))
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue(mockSelectChain)
        });

        const result = await databaseService.identifyAtRiskLearners();

        expect(result).toHaveLength(2);
        expect(result[0].days_inactive).toBe(10);
        expect(result[1].completion_rate).toBe(45);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const mockError = new Error('Connection timeout');
      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockRejectedValue(mockError)
        }))
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain)
      });

      const result = await databaseService.getLearnerProfile('U1234567890');
      expect(result).toBeNull();
    });

    it('should handle invalid data gracefully', async () => {
      const invalidData = { invalid: 'data' };
      
      await expect(databaseService.createLearnerProfile(''))
        .rejects.toThrow();
    });
  });
});