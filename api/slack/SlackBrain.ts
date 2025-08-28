/**
 * Second Story Slack Brain Bot for StrayDog Syndications LLC
 * Powered by Claude 4.1, integrating entire ecosystem
 * Workspace: straydogsyndi-do42630.slack.com
 */

import * as SlackBolt from '@slack/bolt';
import type { SlashCommand, SlackCommandMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt';

const { App, LogLevel } = SlackBolt;
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { Octokit } from '@octokit/rest';
import * as schedule from 'node-schedule';
import { ContentAggregator } from './ContentAggregator.js';
import { AdminMonitor } from './AdminMonitor.js';
import { DatabaseService } from './DatabaseService.js';

interface LearnerProfile {
  user_id: string;
  name: string;
  email?: string;
  track?: string;
  current_week: number;
  skills: string[];
  goals: string[];
  mentor_id?: string;
  timezone?: string;
  created_at: string;
  last_active: string;
}

interface SlackChannels {
  [key: string]: string;
}

export class SecondStorySlackBrain {
  private app: InstanceType<typeof App>;
  private claude: Anthropic;
  private github: Octokit;
  private supabase: any;
  private contentAggregator: ContentAggregator;
  private adminMonitor: AdminMonitor;
  private database: DatabaseService;
  private channels: SlackChannels;
  private cache: Map<string, any>;

  constructor() {
    // Initialize Slack app with signing secret for dispatch_failed fix
    this.app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      appToken: process.env.SLACK_APP_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: true,
      logLevel: LogLevel.INFO,
    });

    // Initialize API clients
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    this.github = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize service classes
    this.contentAggregator = new ContentAggregator(this.claude, this.app);
    this.adminMonitor = new AdminMonitor(this.app, this.supabase);
    this.database = new DatabaseService(this.supabase);

    // Channel configuration for StrayDog workspace
    this.channels = {
      general: process.env.SLACK_CHANNEL_GENERAL || 'C_GENERAL_ID',
      announcements: process.env.SLACK_CHANNEL_ANNOUNCEMENTS || 'C_ANNOUNCE_ID',
      'daily-standup': process.env.SLACK_CHANNEL_STANDUP || 'C_STANDUP_ID',
      'code-help': process.env.SLACK_CHANNEL_CODEHELP || 'C_CODEHELP_ID',
      'job-board': process.env.SLACK_CHANNEL_JOBS || 'C_JOBS_ID',
      resources: process.env.SLACK_CHANNEL_RESOURCES || 'C_RESOURCES_ID',
      celebrations: process.env.SLACK_CHANNEL_WINS || 'C_WINS_ID',
      'mentor-connect': process.env.SLACK_CHANNEL_MENTORS || 'C_MENTORS_ID',
      'pair-programming': process.env.SLACK_CHANNEL_PAIR || 'C_PAIR_ID',
      'admin-alerts': process.env.SLACK_CHANNEL_ADMIN || 'C_ADMIN_ID',
    };

    // Initialize cache
    this.cache = new Map();

    this.registerCommands();
    this.setupEventHandlers();
    this.initializeScheduledTasks();
  }

  private registerCommands(): void {
    // Help command
    this.app.command('/help', async ({ command, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) => {
      await ack();
      const helpText = this.generateComprehensiveHelp();
      await respond({ blocks: helpText });
    });

    // Progress tracking command
    this.app.command('/progress', async ({ command, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) => {
      await ack();
      try {
        const progress = await this.getDetailedProgress(command.user_id);
        await respond({ blocks: progress });
      } catch (error) {
        await respond({ text: 'Sorry, I encountered an error retrieving your progress. Please try again later.' });
      }
    });

    // Personalized challenge command
    this.app.command('/challenge', async ({ command, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) => {
      await ack();
      try {
        const challenge = await this.generatePersonalizedChallenge(command.user_id);
        await respond({ blocks: challenge });
      } catch (error) {
        await respond({ text: 'Sorry, I encountered an error generating your challenge. Please try again later.' });
      }
    });

    // Mentor help command
    this.app.command('/mentor', async ({ command, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) => {
      await ack();
      try {
        let mentorHelp;
        if (command.text) {
          mentorHelp = await this.getMentorHelp(command.text, command.user_id);
        } else {
          mentorHelp = await this.matchWithMentor(command.user_id);
        }
        await respond({ blocks: mentorHelp });
      } catch (error) {
        await respond({ text: 'Sorry, I encountered an error with mentor services. Please try again later.' });
      }
    });

    // Pair programming command
    this.app.command('/pair', async ({ command, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) => {
      await ack();
      try {
        const pairing = await this.findPairPartner(command.user_id, command.text);
        await respond({ blocks: pairing });
      } catch (error) {
        await respond({ text: 'Sorry, I encountered an error finding a pair partner. Please try again later.' });
      }
    });

    // Daily standup command
    this.app.command('/standup', async ({ command, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) => {
      await ack();
      try {
        const standup = await this.recordStandup(command.user_id, command.text);
        await respond({ blocks: standup });
      } catch (error) {
        await respond({ text: 'Sorry, I encountered an error recording your standup. Please try again later.' });
      }
    });

    // Job board command
    this.app.command('/jobs', async ({ command, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) => {
      await ack();
      try {
        const jobs = await this.getCuratedJobs(command.text);
        await respond({ blocks: jobs });
      } catch (error) {
        await respond({ text: 'Sorry, I encountered an error retrieving job listings. Please try again later.' });
      }
    });

    // Learning resources command
    this.app.command('/resources', async ({ command, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) => {
      await ack();
      try {
        const resources = await this.getLearningResources(command.text);
        await respond({ blocks: resources });
      } catch (error) {
        await respond({ text: 'Sorry, I encountered an error retrieving learning resources. Please try again later.' });
      }
    });

    // Admin command (restricted)
    this.app.command('/admin', async ({ command, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) => {
      await ack();
      try {
        if (await this.isAdmin(command.user_id)) {
          const adminData = await this.adminMonitor.generateAdminDashboard();
          await respond({ blocks: adminData });
        } else {
          await respond({ text: 'This command is restricted to administrators.' });
        }
      } catch (error) {
        await respond({ text: 'Sorry, I encountered an error accessing admin functions. Please try again later.' });
      }
    });
  }

  private setupEventHandlers(): void {
    // Handle @mentions with AI-powered responses
    this.app.event('app_mention', async ({ event, client }: any) => {
      try {
        const response = await this.getContextualClaudeResponse(
          event.text,
          event.user,
          event.channel
        );

        await client.chat.postMessage({
          channel: event.channel,
          thread_ts: event.thread_ts || event.ts,
          blocks: response,
        });
      } catch (error) {
        console.error('Error handling mention:', error);
      }
    });

    // Welcome new members with automated onboarding
    this.app.event('team_join', async ({ event, client }: any) => {
      try {
        const profile = await this.createLearnerProfile(event.user.id);
        const welcomeBlocks = await this.generateOnboardingMessage(profile);

        await client.chat.postMessage({
          channel: this.channels.general,
          blocks: welcomeBlocks,
        });

        await this.sendOnboardingDM(event.user.id, client);
      } catch (error) {
        console.error('Error welcoming new member:', error);
      }
    });

    // Track achievements through reactions
    this.app.event('reaction_added', async ({ event, client }: any) => {
      try {
        if (['tada', 'rocket', 'fire', 'star', '100'].includes(event.reaction)) {
          await this.recordAchievement(event, client);

          if (event.reaction === 'rocket') {
            await client.chat.postMessage({
              channel: this.channels.celebrations,
              text: `🚀 <@${event.user}> just achieved something awesome! Check it out!`,
            });
          }
        }
      } catch (error) {
        console.error('Error tracking achievement:', error);
      }
    });
  }

  private initializeScheduledTasks(): void {
    // Daily motivation (9 AM EST)
    schedule.scheduleJob('0 9 * * *', async () => {
      await this.shareMorningMotivation();
    });

    // Daily standup reminder (8:30 AM EST)
    schedule.scheduleJob('30 8 * * *', async () => {
      await this.dailyStandupReminder();
    });

    // Tech news sharing (8 AM, 12 PM, 5 PM EST)
    schedule.scheduleJob('0 8,12,17 * * *', async () => {
      await this.contentAggregator.shareContent('tech_news', this.channels.resources);
    });

    // Weekly challenge (Monday 10 AM EST)
    schedule.scheduleJob('0 10 * * 1', async () => {
      await this.weeklyChallengAnnouncement();
    });

    // Job board updates (Tuesday & Thursday 11 AM EST)
    schedule.scheduleJob('0 11 * * 2,4', async () => {
      await this.contentAggregator.shareContent('job_listings', this.channels['job-board']);
    });

    // System health check (every hour)
    schedule.scheduleJob('0 * * * *', async () => {
      await this.adminMonitor.performHealthCheck();
    });

    // Weekly admin report (Sunday 8 PM EST)
    schedule.scheduleJob('0 20 * * 0', async () => {
      await this.generateWeeklyAdminReport();
    });
  }

  private generateComprehensiveHelp(): any[] {
    return [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🤖 Second Story Assistant Commands' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Available Commands:*\n• `/help` - Show this help menu\n• `/progress` - View your learning progress\n• `/challenge` - Get a personalized coding challenge\n• `/mentor [topic]` - Get mentor help or match with a mentor\n• `/pair [skill]` - Find a pair programming partner\n• `/standup [update]` - Record your daily standup\n• `/jobs [keywords]` - Browse curated job opportunities\n• `/resources [topic]` - Find learning resources\n• `/admin` - Admin dashboard (admins only)',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*You can also:*\n• Mention me (@Second Story) for AI-powered help\n• Use reactions 🚀 🔥 ⭐ 💯 🎉 to celebrate achievements\n• Join daily standups in <#' + this.channels['daily-standup'] + '>',
        },
      },
    ];
  }

  private async getContextualClaudeResponse(text: string, userId: string, channel: string): Promise<any[]> {
    try {
      const profile = await this.getLearnerProfile(userId);
      const recentActivity = await this.getRecentActivity(userId);
      const channelContext = this.getChannelContext(channel);

      const prompt = `
You are the Second Story Slack Bot in the StrayDog Syndications workspace.
You're helping justice-impacted individuals become professional developers.

Channel Context: ${channelContext}
User Profile:
- Name: ${profile?.name || 'Unknown'}
- Track: ${profile?.track || 'Not set'}
- Week: ${profile?.current_week || 1}
- Skills: ${profile?.skills?.join(', ') || 'None listed'}
- Recent Activity: ${recentActivity}

User Message: ${text}

Provide a helpful, encouraging response appropriate for this channel.
If it's a technical question, include code examples.
If it's about challenges, be supportive and practical.
Keep responses concise but helpful.
`;

      const response = await this.claude.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if ('text' in content) {
        return this.formatClaudeResponseAsBlocks(content.text);
      }
      return this.formatClaudeResponseAsBlocks('Unable to process response');
    } catch (error) {
      console.error('Error getting Claude response:', error);
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: "I'm sorry, I'm having trouble processing your request right now. Please try again later or reach out to an admin for help.",
          },
        },
      ];
    }
  }

  private formatClaudeResponseAsBlocks(text: string): any[] {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: text.slice(0, 2900), // Slack block text limit
        },
      },
    ];
  }

  private getChannelContext(channelId: string): string {
    const channelName = Object.keys(this.channels).find(key => this.channels[key] === channelId);
    
    const contexts: { [key: string]: string } = {
      'general': 'Main community discussion',
      'code-help': 'Technical support and coding help',
      'job-board': 'Job opportunities and career advice',
      'resources': 'Learning materials and educational content',
      'celebrations': 'Achievements and success stories',
      'mentor-connect': 'Mentor matching and guidance',
      'pair-programming': 'Finding coding partners',
      'daily-standup': 'Daily progress check-ins',
    };

    return contexts[channelName || ''] || 'General conversation';
  }

  // Placeholder methods to be implemented
  private async getLearnerProfile(userId: string): Promise<LearnerProfile | null> {
    return this.database.getLearnerProfile(userId);
  }

  private async getDetailedProgress(userId: string): Promise<any[]> {
    // Implementation will be added
    return [{ type: 'section', text: { type: 'mrkdwn', text: 'Progress tracking coming soon!' } }];
  }

  private async generatePersonalizedChallenge(userId: string): Promise<any[]> {
    // Implementation will be added
    return [{ type: 'section', text: { type: 'mrkdwn', text: 'Personalized challenges coming soon!' } }];
  }

  private async getMentorHelp(topic: string, userId: string): Promise<any[]> {
    // Implementation will be added
    return [{ type: 'section', text: { type: 'mrkdwn', text: 'Mentor help coming soon!' } }];
  }

  private async matchWithMentor(userId: string): Promise<any[]> {
    // Implementation will be added
    return [{ type: 'section', text: { type: 'mrkdwn', text: 'Mentor matching coming soon!' } }];
  }

  private async findPairPartner(userId: string, skill?: string): Promise<any[]> {
    // Implementation will be added
    return [{ type: 'section', text: { type: 'mrkdwn', text: 'Pair programming matching coming soon!' } }];
  }

  private async recordStandup(userId: string, update: string): Promise<any[]> {
    // Implementation will be added
    return [{ type: 'section', text: { type: 'mrkdwn', text: 'Standup recorded! Thanks for the update.' } }];
  }

  private async getCuratedJobs(keywords?: string): Promise<any[]> {
    // Implementation will be added
    return [{ type: 'section', text: { type: 'mrkdwn', text: 'Job curation coming soon!' } }];
  }

  private async getLearningResources(topic?: string): Promise<any[]> {
    // Implementation will be added
    return [{ type: 'section', text: { type: 'mrkdwn', text: 'Learning resources coming soon!' } }];
  }

  private async isAdmin(userId: string): Promise<boolean> {
    // Check if user is admin
    return false; // Placeholder
  }

  private async getRecentActivity(userId: string): Promise<string> {
    // Get user's recent activity
    return 'No recent activity'; // Placeholder
  }

  private async createLearnerProfile(userId: string): Promise<LearnerProfile> {
    return this.database.createLearnerProfile(userId);
  }

  private async generateOnboardingMessage(profile: LearnerProfile): Promise<any[]> {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎉 Welcome to StrayDog Syndications, <@${profile.user_id}>! We're excited to have you join our community of learners.`,
        },
      },
    ];
  }

  private async sendOnboardingDM(userId: string, client: any): Promise<void> {
    // Send onboarding direct message
  }

  private async recordAchievement(event: any, client: any): Promise<void> {
    // Record achievement in database
  }

  private async shareMorningMotivation(): Promise<void> {
    // Share daily motivation
  }

  private async dailyStandupReminder(): Promise<void> {
    // Send standup reminder
  }

  private async weeklyChallengAnnouncement(): Promise<void> {
    // Announce weekly challenge
  }

  private async generateWeeklyAdminReport(): Promise<void> {
    // Generate admin report
  }

  public async start(): Promise<void> {
    await this.app.start();
    console.log('⚡️ Second Story Slack Bot is running!');
    
    // Send startup notification
    try {
      await this.app.client.chat.postMessage({
        channel: this.channels['admin-alerts'],
        text: '✅ Second Story Slack Brain Bot is online and monitoring all systems!',
      });
    } catch (error) {
      console.error('Error sending startup notification:', error);
    }
  }

  public async stop(): Promise<void> {
    await this.app.stop();
    console.log('Second Story Slack Bot stopped');
  }
}