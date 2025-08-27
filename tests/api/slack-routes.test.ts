/**
 * Tests for Slack API routes
 */

import request from 'supertest';
import express from 'express';
import slackRoutes from '../../api/routes/slack';
import crypto from 'crypto';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('@anthropic-ai/sdk');
jest.mock('../../api/slack/DatabaseService');
jest.mock('../../api/slack/ContentAggregator');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/slack', slackRoutes);

// Mock environment variables
process.env.SLACK_SIGNING_SECRET = 'test-signing-secret';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

describe('Slack API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/slack/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Slack integration API is healthy',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Slack Events Endpoint', () => {
    const createSlackSignature = (body: string, timestamp: string) => {
      const sigBasestring = `v0:${timestamp}:${body}`;
      return 'v0=' + crypto
        .createHmac('sha256', process.env.SLACK_SIGNING_SECRET!)
        .update(sigBasestring)
        .digest('hex');
    };

    describe('URL Verification', () => {
      it('should handle URL verification challenge', async () => {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const challengeBody = JSON.stringify({
          type: 'url_verification',
          challenge: 'test-challenge-123'
        });
        const signature = createSlackSignature(challengeBody, timestamp);

        const response = await request(app)
          .post('/api/slack/events')
          .set('x-slack-signature', signature)
          .set('x-slack-request-timestamp', timestamp)
          .send({
            type: 'url_verification',
            challenge: 'test-challenge-123'
          })
          .expect(200);

        expect(response.body).toEqual({
          challenge: 'test-challenge-123'
        });
      });
    });

    describe('Event Handling', () => {
      it('should handle team_join events', async () => {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const eventBody = JSON.stringify({
          type: 'event_callback',
          event: {
            type: 'team_join',
            user: {
              id: 'U1234567890',
              real_name: 'John Doe'
            }
          }
        });
        const signature = createSlackSignature(eventBody, timestamp);

        const response = await request(app)
          .post('/api/slack/events')
          .set('x-slack-signature', signature)
          .set('x-slack-request-timestamp', timestamp)
          .send({
            type: 'event_callback',
            event: {
              type: 'team_join',
              user: {
                id: 'U1234567890',
                real_name: 'John Doe'
              }
            }
          })
          .expect(200);

        expect(response.body).toEqual({ success: true });
      });

      it('should handle app_mention events', async () => {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const eventBody = JSON.stringify({
          type: 'event_callback',
          event: {
            type: 'app_mention',
            user: 'U1234567890',
            text: 'Hello bot!',
            channel: 'C1234567890'
          }
        });
        const signature = createSlackSignature(eventBody, timestamp);

        const response = await request(app)
          .post('/api/slack/events')
          .set('x-slack-signature', signature)
          .set('x-slack-request-timestamp', timestamp)
          .send({
            type: 'event_callback',
            event: {
              type: 'app_mention',
              user: 'U1234567890',
              text: 'Hello bot!',
              channel: 'C1234567890'
            }
          })
          .expect(200);

        expect(response.body).toEqual({ success: true });
      });
    });

    describe('Security', () => {
      it('should reject requests without signature', async () => {
        const response = await request(app)
          .post('/api/slack/events')
          .send({
            type: 'url_verification',
            challenge: 'test-challenge'
          })
          .expect(400);

        expect(response.body).toEqual({
          error: 'Missing Slack signature headers'
        });
      });

      it('should reject requests with invalid signature', async () => {
        const timestamp = Math.floor(Date.now() / 1000).toString();

        const response = await request(app)
          .post('/api/slack/events')
          .set('x-slack-signature', 'v0=invalid-signature')
          .set('x-slack-request-timestamp', timestamp)
          .send({
            type: 'url_verification',
            challenge: 'test-challenge'
          })
          .expect(400);

        expect(response.body).toEqual({
          error: 'Invalid signature'
        });
      });

      it('should reject old requests', async () => {
        const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString(); // 400 seconds ago
        const eventBody = JSON.stringify({
          type: 'url_verification',
          challenge: 'test-challenge'
        });
        const signature = createSlackSignature(eventBody, oldTimestamp);

        const response = await request(app)
          .post('/api/slack/events')
          .set('x-slack-signature', signature)
          .set('x-slack-request-timestamp', oldTimestamp)
          .send({
            type: 'url_verification',
            challenge: 'test-challenge'
          })
          .expect(400);

        expect(response.body).toEqual({
          error: 'Request too old'
        });
      });
    });
  });

  describe('Learner Profile Management', () => {
    describe('GET /api/slack/learners/:slackUserId', () => {
      it('should return learner profile when found', async () => {
        // Mock DatabaseService.getLearnerProfile
        const mockProfile = global.testData.mockProfile;
        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.getLearnerProfile = jest.fn().mockResolvedValue(mockProfile);

        const response = await request(app)
          .get('/api/slack/learners/U1234567890')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockProfile
        });
      });

      it('should return 404 when learner not found', async () => {
        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.getLearnerProfile = jest.fn().mockResolvedValue(null);

        const response = await request(app)
          .get('/api/slack/learners/UNOTFOUND')
          .expect(404);

        expect(response.body).toEqual({
          error: 'Learner not found'
        });
      });
    });

    describe('POST /api/slack/learners', () => {
      it('should create new learner profile', async () => {
        const mockProfile = global.testData.mockProfile;
        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.getLearnerProfile = jest.fn().mockResolvedValue(null);
        DatabaseService.prototype.createLearnerProfile = jest.fn().mockResolvedValue(mockProfile);

        const response = await request(app)
          .post('/api/slack/learners')
          .send({
            slackUserId: 'U1234567890',
            name: 'John Doe',
            email: 'john@example.com'
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: expect.objectContaining({
            slack_user_id: 'U1234567890',
            name: 'Test User'
          })
        });
      });

      it('should return 409 when profile already exists', async () => {
        const mockProfile = global.testData.mockProfile;
        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.getLearnerProfile = jest.fn().mockResolvedValue(mockProfile);

        const response = await request(app)
          .post('/api/slack/learners')
          .send({
            slackUserId: 'U1234567890',
            name: 'John Doe'
          })
          .expect(409);

        expect(response.body).toEqual({
          error: 'Learner profile already exists'
        });
      });

      it('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/slack/learners')
          .send({
            name: 'John Doe'
          })
          .expect(400);

        expect(response.body).toEqual({
          error: 'slackUserId and name are required'
        });
      });
    });

    describe('PUT /api/slack/learners/:slackUserId', () => {
      it('should update learner profile', async () => {
        const updatedProfile = {
          ...global.testData.mockProfile,
          track: 'python',
          current_week: 3
        };

        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.updateLearnerProfile = jest.fn().mockResolvedValue(updatedProfile);

        const response = await request(app)
          .put('/api/slack/learners/U1234567890')
          .send({
            track: 'python',
            current_week: 3
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: expect.objectContaining({
            track: 'python',
            current_week: 3
          })
        });
      });
    });
  });

  describe('Progress Tracking', () => {
    describe('GET /api/slack/learners/:slackUserId/progress', () => {
      it('should return learner progress', async () => {
        const mockProgress = [
          {
            id: 'progress-1',
            learner_id: 'learner-1',
            date: '2024-01-01T00:00:00Z',
            activity_type: 'challenge',
            description: 'Completed HTML basics',
            status: 'completed',
            metadata: {},
            created_at: '2024-01-01T00:00:00Z'
          }
        ];

        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.getLearnerProgress = jest.fn().mockResolvedValue(mockProgress);

        const response = await request(app)
          .get('/api/slack/learners/U1234567890/progress')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockProgress
        });
      });

      it('should handle limit parameter', async () => {
        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        const mockGetProgress = jest.fn().mockResolvedValue([]);
        DatabaseService.prototype.getLearnerProgress = mockGetProgress;

        await request(app)
          .get('/api/slack/learners/U1234567890/progress?limit=5')
          .expect(200);

        expect(mockGetProgress).toHaveBeenCalledWith('U1234567890', 5);
      });
    });

    describe('POST /api/slack/learners/:slackUserId/progress', () => {
      it('should record progress entry', async () => {
        const mockEntry = {
          id: 'progress-1',
          learner_id: 'learner-1',
          date: '2024-01-01T00:00:00Z',
          activity_type: 'challenge',
          description: 'Completed CSS challenge',
          status: 'completed',
          metadata: { difficulty: 'beginner' },
          created_at: '2024-01-01T00:00:00Z'
        };

        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.recordProgress = jest.fn().mockResolvedValue(mockEntry);

        const response = await request(app)
          .post('/api/slack/learners/U1234567890/progress')
          .send({
            activity_type: 'challenge',
            description: 'Completed CSS challenge',
            status: 'completed',
            metadata: { difficulty: 'beginner' }
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockEntry
        });
      });

      it('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/slack/learners/U1234567890/progress')
          .send({
            description: 'Incomplete entry'
          })
          .expect(400);

        expect(response.body).toEqual({
          error: 'activity_type, description, and status are required'
        });
      });
    });
  });

  describe('Standup Management', () => {
    describe('POST /api/slack/learners/:slackUserId/standup', () => {
      it('should record standup entry', async () => {
        const mockStandup = {
          id: 'standup-1',
          learner_id: 'learner-1',
          date: '2024-01-01',
          yesterday_progress: 'Worked on CSS',
          today_goals: 'Start JavaScript',
          blockers: 'None',
          mood_rating: 4,
          created_at: '2024-01-01T00:00:00Z'
        };

        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.recordStandup = jest.fn().mockResolvedValue(mockStandup);

        const response = await request(app)
          .post('/api/slack/learners/U1234567890/standup')
          .send({
            yesterday_progress: 'Worked on CSS',
            today_goals: 'Start JavaScript',
            blockers: 'None',
            mood_rating: 4
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockStandup
        });
      });

      it('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/slack/learners/U1234567890/standup')
          .send({
            yesterday_progress: 'Worked on CSS'
          })
          .expect(400);

        expect(response.body).toEqual({
          error: 'yesterday_progress and today_goals are required'
        });
      });
    });
  });

  describe('Content Endpoints', () => {
    describe('GET /api/slack/jobs', () => {
      it('should return curated jobs', async () => {
        const mockJobBlocks = [
          {
            type: 'header',
            text: { type: 'plain_text', text: '💼 Job Listings' }
          }
        ];

        const ContentAggregator = require('../../api/slack/ContentAggregator').ContentAggregator;
        ContentAggregator.prototype.getCuratedJobs = jest.fn().mockResolvedValue(mockJobBlocks);

        const response = await request(app)
          .get('/api/slack/jobs?keywords=javascript')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockJobBlocks
        });
      });
    });

    describe('GET /api/slack/resources', () => {
      it('should return curated learning resources', async () => {
        const mockResourceBlocks = [
          {
            type: 'header',
            text: { type: 'plain_text', text: '📚 Learning Resources' }
          }
        ];

        const ContentAggregator = require('../../api/slack/ContentAggregator').ContentAggregator;
        ContentAggregator.prototype.getCuratedLearningResources = jest.fn().mockResolvedValue(mockResourceBlocks);

        const response = await request(app)
          .get('/api/slack/resources?topic=react')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockResourceBlocks
        });
      });
    });
  });

  describe('Mentor Endpoints', () => {
    describe('GET /api/slack/mentors', () => {
      it('should return all mentors', async () => {
        const mockMentors = [
          {
            id: 'mentor-1',
            slack_user_id: 'U0987654321',
            name: 'Jane Smith',
            specialties: ['JavaScript', 'React'],
            is_active: true
          }
        ];

        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.getMentorProfiles = jest.fn().mockResolvedValue(mockMentors);

        const response = await request(app)
          .get('/api/slack/mentors')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockMentors
        });
      });
    });

    describe('GET /api/slack/mentors/available', () => {
      it('should return available mentors for skills', async () => {
        const mockMentors = [
          {
            id: 'mentor-1',
            name: 'JavaScript Expert',
            specialties: ['JavaScript', 'Node.js']
          }
        ];

        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.findAvailableMentors = jest.fn().mockResolvedValue(mockMentors);

        const response = await request(app)
          .get('/api/slack/mentors/available?skills=javascript,node')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockMentors
        });
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('GET /api/slack/metrics', () => {
      it('should return system metrics', async () => {
        const mockLearnerMetrics = {
          totalLearners: 50,
          activeLearners: 35,
          challengesCompletedThisWeek: 120,
          averageCompletionRate: 75
        };

        const mockEngagementMetrics = {
          standupsThisWeek: 180,
          mentorSessionsThisWeek: 45,
          pairSessionsThisWeek: 20
        };

        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.getLearnerMetrics = jest.fn().mockResolvedValue(mockLearnerMetrics);
        DatabaseService.prototype.getEngagementMetrics = jest.fn().mockResolvedValue(mockEngagementMetrics);

        const response = await request(app)
          .get('/api/slack/metrics')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: {
            learners: mockLearnerMetrics,
            engagement: mockEngagementMetrics
          }
        });
      });
    });

    describe('GET /api/slack/admin/at-risk-learners', () => {
      it('should return at-risk learners', async () => {
        const atRiskLearners = [
          {
            ...global.testData.mockProfile,
            days_inactive: 10,
            completion_rate: 20
          }
        ];

        const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
        DatabaseService.prototype.identifyAtRiskLearners = jest.fn().mockResolvedValue(atRiskLearners);

        const response = await request(app)
          .get('/api/slack/admin/at-risk-learners')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: atRiskLearners
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const DatabaseService = require('../../api/slack/DatabaseService').DatabaseService;
      DatabaseService.prototype.getLearnerProfile = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/slack/learners/U1234567890')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to get learner profile'
      });
    });

    it('should handle content aggregation errors', async () => {
      const ContentAggregator = require('../../api/slack/ContentAggregator').ContentAggregator;
      ContentAggregator.prototype.getCuratedJobs = jest.fn().mockRejectedValue(new Error('API error'));

      const response = await request(app)
        .get('/api/slack/jobs')
        .expect(200);

      expect(response.body.data).toEqual([
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Sorry, I encountered an error while fetching job listings. Please try again later.'
          }
        }
      ]);
    });
  });
});