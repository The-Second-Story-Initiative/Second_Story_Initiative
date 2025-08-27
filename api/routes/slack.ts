/**
 * Slack Integration Routes for Second Story Initiative
 * Handles webhooks, events, and API endpoints for the Slack ecosystem
 */

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { DatabaseService } from '../slack/DatabaseService.js';
import { ContentAggregator } from '../slack/ContentAggregator.js';
import Anthropic from '@anthropic-ai/sdk';
import { App } from '@slack/bolt';

const router = express.Router();

// Initialize services
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Mock Slack app for content aggregator (in production this would be the actual bot instance)
const mockSlackApp = {
  client: {
    chat: {
      postMessage: async (params: any) => {
        console.log('Mock Slack message:', params);
        return { ok: true };
      }
    }
  }
} as any;

const database = new DatabaseService(supabase);
const contentAggregator = new ContentAggregator(claude, mockSlackApp);

// Middleware to verify Slack requests
const verifySlackRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    const slackSignature = req.headers['x-slack-signature'] as string;
    const timestamp = req.headers['x-slack-request-timestamp'] as string;
    const body = JSON.stringify(req.body);

    if (!slackSignature || !timestamp) {
      return res.status(400).json({ error: 'Missing Slack signature headers' });
    }

    // Check if request is too old (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
      return res.status(400).json({ error: 'Request too old' });
    }

    // Verify signature
    const sigBasestring = `v0:${timestamp}:${body}`;
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', process.env.SLACK_SIGNING_SECRET!)
      .update(sigBasestring)
      .digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature))) {
      next();
    } else {
      res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Error verifying Slack request:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Slack integration API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Slack Events API endpoint
router.post('/events', verifySlackRequest, async (req: Request, res: Response) => {
  try {
    const { type, challenge, event } = req.body;

    // Handle URL verification challenge
    if (type === 'url_verification') {
      return res.json({ challenge });
    }

    // Handle events
    if (type === 'event_callback' && event) {
      await handleSlackEvent(event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling Slack event:', error);
    res.status(500).json({ error: 'Event handling failed' });
  }
});

// Slack interactive components endpoint
router.post('/interactive', verifySlackRequest, async (req: Request, res: Response) => {
  try {
    const payload = JSON.parse(req.body.payload);
    await handleInteractiveComponent(payload);
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling interactive component:', error);
    res.status(500).json({ error: 'Interactive component handling failed' });
  }
});

// Slack slash commands endpoint
router.post('/commands', verifySlackRequest, async (req: Request, res: Response) => {
  try {
    const { command, text, user_id, channel_id } = req.body;
    const response = await handleSlashCommand(command, text, user_id, channel_id);
    res.json(response);
  } catch (error) {
    console.error('Error handling slash command:', error);
    res.status(500).json({ 
      response_type: 'ephemeral',
      text: 'Sorry, there was an error processing your command. Please try again later.'
    });
  }
});

// API Routes for Slack bot management

// Get learner profile
router.get('/learners/:slackUserId', async (req: Request, res: Response) => {
  try {
    const { slackUserId } = req.params;
    const profile = await database.getLearnerProfile(slackUserId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Learner not found' });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error getting learner profile:', error);
    res.status(500).json({ error: 'Failed to get learner profile' });
  }
});

// Create learner profile
router.post('/learners', async (req: Request, res: Response) => {
  try {
    const { slackUserId, name, email, track } = req.body;

    if (!slackUserId || !name) {
      return res.status(400).json({ error: 'slackUserId and name are required' });
    }

    // Check if profile already exists
    const existingProfile = await database.getLearnerProfile(slackUserId);
    if (existingProfile) {
      return res.status(409).json({ error: 'Learner profile already exists' });
    }

    const profile = await database.createLearnerProfile(slackUserId);
    
    // Update with additional info if provided
    if (email || track) {
      const updatedProfile = await database.updateLearnerProfile(slackUserId, {
        email,
        track,
        name
      });
      return res.json({ success: true, data: updatedProfile });
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error creating learner profile:', error);
    res.status(500).json({ error: 'Failed to create learner profile' });
  }
});

// Update learner profile
router.put('/learners/:slackUserId', async (req: Request, res: Response) => {
  try {
    const { slackUserId } = req.params;
    const updates = req.body;

    const profile = await database.updateLearnerProfile(slackUserId, updates);
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error updating learner profile:', error);
    res.status(500).json({ error: 'Failed to update learner profile' });
  }
});

// Get learner progress
router.get('/learners/:slackUserId/progress', async (req: Request, res: Response) => {
  try {
    const { slackUserId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const progress = await database.getLearnerProgress(slackUserId, limit);
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Error getting learner progress:', error);
    res.status(500).json({ error: 'Failed to get learner progress' });
  }
});

// Record progress entry
router.post('/learners/:slackUserId/progress', async (req: Request, res: Response) => {
  try {
    const { slackUserId } = req.params;
    const { activity_type, description, status, metadata } = req.body;

    if (!activity_type || !description || !status) {
      return res.status(400).json({ 
        error: 'activity_type, description, and status are required' 
      });
    }

    const entry = await database.recordProgress(slackUserId, {
      date: new Date().toISOString(),
      activity_type,
      description,
      status,
      metadata: metadata || {}
    });

    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error recording progress:', error);
    res.status(500).json({ error: 'Failed to record progress' });
  }
});

// Record standup
router.post('/learners/:slackUserId/standup', async (req: Request, res: Response) => {
  try {
    const { slackUserId } = req.params;
    const { yesterday_progress, today_goals, blockers, mood_rating } = req.body;

    if (!yesterday_progress || !today_goals) {
      return res.status(400).json({ 
        error: 'yesterday_progress and today_goals are required' 
      });
    }

    const standup = await database.recordStandup(slackUserId, {
      yesterday_progress,
      today_goals,
      blockers: blockers || '',
      mood_rating: mood_rating || 3
    });

    res.json({ success: true, data: standup });
  } catch (error) {
    console.error('Error recording standup:', error);
    res.status(500).json({ error: 'Failed to record standup' });
  }
});

// Get challenges for learner
router.get('/learners/:slackUserId/challenges', async (req: Request, res: Response) => {
  try {
    const { slackUserId } = req.params;
    const challenges = await database.getChallengesForLearner(slackUserId);
    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Error getting challenges:', error);
    res.status(500).json({ error: 'Failed to get challenges' });
  }
});

// Get curated jobs
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { keywords, location } = req.query;
    const jobs = await contentAggregator.getCuratedJobs(
      keywords as string,
      location as string
    );
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Error getting curated jobs:', error);
    res.status(500).json({ error: 'Failed to get curated jobs' });
  }
});

// Get learning resources
router.get('/resources', async (req: Request, res: Response) => {
  try {
    const { topic } = req.query;
    const resources = await contentAggregator.getCuratedLearningResources(topic as string);
    res.json({ success: true, data: resources });
  } catch (error) {
    console.error('Error getting learning resources:', error);
    res.status(500).json({ error: 'Failed to get learning resources' });
  }
});

// Get all mentors
router.get('/mentors', async (req: Request, res: Response) => {
  try {
    const mentors = await database.getMentorProfiles();
    res.json({ success: true, data: mentors });
  } catch (error) {
    console.error('Error getting mentors:', error);
    res.status(500).json({ error: 'Failed to get mentors' });
  }
});

// Find available mentors
router.get('/mentors/available', async (req: Request, res: Response) => {
  try {
    const { skills } = req.query;
    const skillsArray = skills ? (skills as string).split(',') : undefined;
    const mentors = await database.findAvailableMentors(skillsArray);
    res.json({ success: true, data: mentors });
  } catch (error) {
    console.error('Error finding available mentors:', error);
    res.status(500).json({ error: 'Failed to find available mentors' });
  }
});

// Get metrics (admin only)
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication
    const [learnerMetrics, engagementMetrics] = await Promise.all([
      database.getLearnerMetrics(),
      database.getEngagementMetrics()
    ]);

    res.json({ 
      success: true, 
      data: {
        learners: learnerMetrics,
        engagement: engagementMetrics
      }
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Get at-risk learners (admin only)
router.get('/admin/at-risk-learners', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication
    const atRiskLearners = await database.identifyAtRiskLearners();
    res.json({ success: true, data: atRiskLearners });
  } catch (error) {
    console.error('Error getting at-risk learners:', error);
    res.status(500).json({ error: 'Failed to get at-risk learners' });
  }
});

// Trigger content aggregation
router.post('/admin/aggregate-content', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication
    const { contentType, channelId } = req.body;

    if (!contentType) {
      return res.status(400).json({ error: 'contentType is required' });
    }

    // This would normally post to Slack, but for API we'll just return the content
    const content = await contentAggregator.aggregateContent(contentType, 10);
    const curated = await contentAggregator.curateContent(content, contentType);

    res.json({ success: true, data: curated });
  } catch (error) {
    console.error('Error aggregating content:', error);
    res.status(500).json({ error: 'Failed to aggregate content' });
  }
});

// Helper functions for event handling

async function handleSlackEvent(event: any): Promise<void> {
  try {
    switch (event.type) {
      case 'team_join':
        await handleNewMember(event.user);
        break;
      case 'app_mention':
        await handleMention(event);
        break;
      case 'reaction_added':
        if (['tada', 'rocket', 'fire', 'star', '100'].includes(event.reaction)) {
          await handleAchievementReaction(event);
        }
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
  } catch (error) {
    console.error('Error handling Slack event:', error);
  }
}

async function handleNewMember(user: any): Promise<void> {
  try {
    // Create learner profile for new member
    const profile = await database.createLearnerProfile(user.id);
    console.log('Created profile for new member:', profile);
  } catch (error) {
    console.error('Error handling new member:', error);
  }
}

async function handleMention(event: any): Promise<void> {
  try {
    // Log mention for now - in production this would be handled by the bot
    console.log('Bot mentioned:', event);
  } catch (error) {
    console.error('Error handling mention:', error);
  }
}

async function handleAchievementReaction(event: any): Promise<void> {
  try {
    // Record achievement reaction
    console.log('Achievement reaction:', event);
    // TODO: Implement achievement tracking
  } catch (error) {
    console.error('Error handling achievement reaction:', error);
  }
}

async function handleInteractiveComponent(payload: any): Promise<void> {
  try {
    // Handle button clicks, select menus, etc.
    console.log('Interactive component:', payload);
  } catch (error) {
    console.error('Error handling interactive component:', error);
  }
}

async function handleSlashCommand(
  command: string, 
  text: string, 
  userId: string, 
  channelId: string
): Promise<any> {
  try {
    switch (command) {
      case '/progress':
        return await getProgressResponse(userId);
      case '/challenge':
        return await getChallengeResponse(userId);
      case '/jobs':
        return await getJobsResponse(text);
      case '/resources':
        return await getResourcesResponse(text);
      default:
        return {
          response_type: 'ephemeral',
          text: `Unknown command: ${command}`
        };
    }
  } catch (error) {
    console.error('Error handling slash command:', error);
    return {
      response_type: 'ephemeral',
      text: 'Sorry, there was an error processing your command.'
    };
  }
}

async function getProgressResponse(userId: string): Promise<any> {
  try {
    const profile = await database.getLearnerProfile(userId);
    const progress = await database.getLearnerProgress(userId, 5);

    if (!profile) {
      return {
        response_type: 'ephemeral',
        text: 'Profile not found. Please contact an admin.'
      };
    }

    const progressText = progress.length > 0 
      ? progress.map(p => `• ${p.description} (${p.status})`).join('\n')
      : 'No recent progress recorded';

    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Your Progress Summary*\n\n*Week:* ${profile.current_week}\n*Completion Rate:* ${profile.completion_rate}%\n*Challenges Completed:* ${profile.challenges_completed}\n\n*Recent Activity:*\n${progressText}`
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error getting progress response:', error);
    return {
      response_type: 'ephemeral',
      text: 'Error retrieving your progress. Please try again later.'
    };
  }
}

async function getChallengeResponse(userId: string): Promise<any> {
  try {
    const challenges = await database.getChallengesForLearner(userId);
    
    if (challenges.length === 0) {
      return {
        response_type: 'ephemeral',
        text: 'No challenges available for your current level.'
      };
    }

    const nextChallenge = challenges[0];
    
    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Next Challenge: ${nextChallenge.title}*\n\n${nextChallenge.description}\n\n*Difficulty:* ${nextChallenge.difficulty}\n*Estimated Time:* ${nextChallenge.estimated_hours} hours`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Instructions:*\n${nextChallenge.instructions}`
          }
        }
      ]
    };
  } catch (error) {
    console.error('Error getting challenge response:', error);
    return {
      response_type: 'ephemeral',
      text: 'Error retrieving challenges. Please try again later.'
    };
  }
}

async function getJobsResponse(keywords?: string): Promise<any> {
  try {
    const jobs = await contentAggregator.getCuratedJobs(keywords);
    
    return {
      response_type: 'ephemeral',
      blocks: jobs
    };
  } catch (error) {
    console.error('Error getting jobs response:', error);
    return {
      response_type: 'ephemeral',
      text: 'Error retrieving job listings. Please try again later.'
    };
  }
}

async function getResourcesResponse(topic?: string): Promise<any> {
  try {
    const resources = await contentAggregator.getCuratedLearningResources(topic);
    
    return {
      response_type: 'ephemeral',
      blocks: resources
    };
  } catch (error) {
    console.error('Error getting resources response:', error);
    return {
      response_type: 'ephemeral',
      text: 'Error retrieving learning resources. Please try again later.'
    };
  }
}

export default router;