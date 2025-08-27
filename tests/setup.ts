/**
 * Jest setup file for Second Story Initiative tests
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });
dotenv.config(); // Fallback to main .env

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console.log to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Global test timeout
jest.setTimeout(30000);

// Mock external services for testing
jest.mock('@slack/bolt');
jest.mock('@anthropic-ai/sdk');
jest.mock('@octokit/rest');

// Setup global test data
global.testData = {
  mockSlackUserId: 'U1234567890',
  mockChannelId: 'C1234567890',
  mockTimestamp: '1234567890.123456',
  mockProfile: {
    user_id: 'U1234567890',
    slack_user_id: 'U1234567890',
    name: 'Test User',
    email: 'test@example.com',
    track: 'web_development',
    current_week: 1,
    skills: ['HTML', 'CSS'],
    goals: ['Learn JavaScript'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_active: '2024-01-01T00:00:00Z',
    completion_rate: 75,
    challenges_completed: 3,
    challenges_failed: 1,
    mentor_sessions_attended: 2,
    mentor_sessions_missed: 0,
    days_inactive: 0,
    achievement_badges: ['first_commit'],
    preferences: {
      notification_frequency: 'daily',
      preferred_learning_style: 'hands-on',
      availability: ['Monday 9-11 AM'],
      interests: ['frontend', 'react']
    }
  }
};

// Cleanup after tests
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  // Clean up any open handles
});

export {};