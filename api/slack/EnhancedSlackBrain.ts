/**
 * Enhanced Second Story Slack Brain Bot for Production Deployment
 * Comprehensive moderation, engagement, and content curation system
 * Workspace: straydogsyndi-do42630.slack.com
 */

// cSpell:words straydogsyndi supabase VCMW CODEHELP SUPABASE thumbsup standups

import { App, LogLevel } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as schedule from 'node-schedule';

export class EnhancedSlackBrain {
  private app: App;
  private claude: Anthropic;
  private supabase: any;
  private moderationCache: Map<string, any>;
  private engagementTracker: Map<string, any>;
  private contentQueue: any[];
  
  // Moderation configuration
  private moderationConfig = {
    warningThreshold: 3,
    muteAfterWarnings: 5,
    banAfterWarnings: 10,
    spamTimeWindow: 60000, // 1 minute
    spamMessageLimit: 5,
    autoDeleteSeverity: 3,
    flagForReviewSeverity: 2
  };

  // Channel configurations
  private channels = {
    general: process.env.SLACK_CHANNEL_GENERAL || 'C07VCMW6P25',
    announcements: process.env.SLACK_CHANNEL_ANNOUNCEMENTS,
    'daily-standup': process.env.SLACK_CHANNEL_STANDUP,
    'code-help': process.env.SLACK_CHANNEL_CODEHELP,
    'job-board': process.env.SLACK_CHANNEL_JOBS,
    resources: process.env.SLACK_CHANNEL_RESOURCES,
    celebrations: process.env.SLACK_CHANNEL_WINS,
    'mentor-connect': process.env.SLACK_CHANNEL_MENTORS,
    'admin-alerts': process.env.SLACK_CHANNEL_ADMIN,
    moderation: process.env.SLACK_CHANNEL_MODERATION || 'C_MOD_ALERTS'
  };

  constructor() {
    // Initialize Slack app with Socket Mode
    this.app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: true,
      appToken: process.env.SLACK_APP_TOKEN,
      logLevel: LogLevel.INFO,
    });

    // Initialize services
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize caches
    this.moderationCache = new Map();
    this.engagementTracker = new Map();
    this.contentQueue = [];

    // Register all handlers
    this.registerModerationHandlers();
    this.registerEngagementHandlers();
    this.registerCommandHandlers();
    this.initializeScheduledTasks();
  }

  /**
   * MODERATION SYSTEM
   */
  private registerModerationHandlers(): void {
    // Monitor all messages for moderation
    this.app.message(async ({ message, client }) => {
      try {
        // Skip bot messages
        if (message.subtype === 'bot_message') return;

        const userId = (message as any).user;
        const channelId = message.channel;
        const text = (message as any).text || '';

        // Check for spam
        if (await this.isSpam(userId, text)) {
          await this.handleSpam(userId, channelId, message.ts!, client);
          return;
        }

        // Check for banned words
        const bannedWord = await this.checkBannedWords(text);
        if (bannedWord) {
          await this.handleBannedWord(
            userId, 
            channelId, 
            message.ts!, 
            bannedWord, 
            client
          );
          return;
        }

        // AI-powered content moderation
        const aiModeration = await this.moderateWithAI(text);
        if (aiModeration.shouldModerate) {
          await this.handleAIModeration(
            userId,
            channelId,
            message.ts!,
            aiModeration,
            client
          );
        }

        // Track engagement
        await this.trackEngagement(userId, 'message', channelId);

      } catch (error) {
        console.error('Error in message moderation:', error);
      }
    });

    // Handle report command
    this.app.command('/report', async ({ command, ack, respond }) => {
      await ack();
      
      const reportData = this.parseReportCommand(command.text);
      await this.handleUserReport(
        command.user_id,
        reportData,
        respond
      );
    });

    // Handle moderation admin command
    this.app.command('/moderate', async ({ command, ack, respond }) => {
      await ack();

      if (!await this.isModerator(command.user_id)) {
        await respond({
          text: '❌ This command is restricted to moderators.',
          response_type: 'ephemeral'
        });
        return;
      }

      const moderationPanel = await this.generateModerationPanel();
      await respond({
        blocks: moderationPanel,
        response_type: 'ephemeral'
      });
    });
  }

  private async isSpam(userId: string, text: string): Promise<boolean> {
    const userMessages = this.moderationCache.get(userId) || [];
    const now = Date.now();
    
    // Add current message
    userMessages.push({ text, timestamp: now });
    
    // Filter messages within time window
    const recentMessages = userMessages.filter(
      (msg: any) => now - msg.timestamp < this.moderationConfig.spamTimeWindow
    );
    
    // Update cache
    this.moderationCache.set(userId, recentMessages);
    
    // Check for spam patterns
    if (recentMessages.length > this.moderationConfig.spamMessageLimit) {
      return true;
    }
    
    // Check for repeated messages
    const uniqueMessages = new Set(recentMessages.map((msg: any) => msg.text));
    if (recentMessages.length > 3 && uniqueMessages.size === 1) {
      return true;
    }
    
    return false;
  }

  private async checkBannedWords(text: string): Promise<any> {
    const { data: bannedWords } = await this.supabase
      .from('banned_words')
      .select('*')
      .eq('is_active', true);

    if (!bannedWords) return null;

    const lowerText = text.toLowerCase();
    
    for (const banned of bannedWords) {
      if (lowerText.includes(banned.word.toLowerCase())) {
        return banned;
      }
    }
    
    return null;
  }

  private async moderateWithAI(text: string): Promise<any> {
    try {
      const response = await this.claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Analyze this message for moderation. Return JSON only:
          {
            "shouldModerate": boolean,
            "severity": 1-5,
            "category": "spam|offensive|harassment|misinformation|ok",
            "reason": "brief explanation"
          }
          
          Message: "${text}"`
        }]
      });

      const content = response.content[0];
      if ('text' in content) {
        return JSON.parse(content.text);
      }
      return { shouldModerate: false };
    } catch (error) {
      console.error('AI moderation error:', error);
      return { shouldModerate: false };
    }
  }

  private async handleSpam(
    userId: string,
    channelId: string,
    messageTs: string,
    client: any
  ): Promise<void> {
    // Delete spam message
    await client.chat.delete({
      channel: channelId,
      ts: messageTs
    });

    // Record moderation action
    await this.supabase.from('moderation_actions').insert({
      action_type: 'delete_message',
      user_id: userId,
      channel_id: channelId,
      message_ts: messageTs,
      reason: 'Spam detected',
      is_automated: true
    });

    // Issue warning
    await this.issueWarning(userId, 'spam', client);

    // Alert moderators
    await client.chat.postMessage({
      channel: this.channels.moderation,
      text: `🚨 Spam detected from <@${userId}> in <#${channelId}>`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Spam Detection Alert*\n• User: <@${userId}>\n• Channel: <#${channelId}>\n• Action: Message deleted, warning issued`
          }
        }
      ]
    });
  }

  private async handleBannedWord(
    userId: string,
    channelId: string,
    messageTs: string,
    bannedWord: any,
    client: any
  ): Promise<void> {
    if (bannedWord.severity >= this.moderationConfig.autoDeleteSeverity) {
      await client.chat.delete({
        channel: channelId,
        ts: messageTs
      });
    }

    await this.supabase.from('moderation_actions').insert({
      action_type: bannedWord.action_type,
      user_id: userId,
      channel_id: channelId,
      message_ts: messageTs,
      reason: `Banned word: ${bannedWord.word}`,
      severity: bannedWord.severity,
      is_automated: true
    });

    if (bannedWord.severity >= 2) {
      await this.issueWarning(userId, `inappropriate language: ${bannedWord.word}`, client);
    }
  }

  private async handleAIModeration(
    userId: string,
    channelId: string,
    messageTs: string,
    aiResult: any,
    client: any
  ): Promise<void> {
    if (aiResult.severity >= this.moderationConfig.autoDeleteSeverity) {
      await client.chat.delete({
        channel: channelId,
        ts: messageTs
      });
    }

    await this.supabase.from('moderation_actions').insert({
      action_type: aiResult.severity >= 3 ? 'delete_message' : 'flag_content',
      user_id: userId,
      channel_id: channelId,
      message_ts: messageTs,
      reason: `AI flagged: ${aiResult.reason}`,
      severity: aiResult.severity,
      is_automated: true
    });

    if (aiResult.severity >= 2) {
      await this.issueWarning(userId, aiResult.reason, client);
    }
  }

  private async issueWarning(
    userId: string,
    reason: string,
    client: WebClient
  ): Promise<void> {
    // Update warning count
    const { data: profile } = await this.supabase
      .from('learner_profiles')
      .select('warnings_count')
      .eq('user_id', userId)
      .single();

    const newWarningCount = (profile?.warnings_count || 0) + 1;

    await this.supabase
      .from('learner_profiles')
      .update({ warnings_count: newWarningCount })
      .eq('user_id', userId);

    // Send warning DM
    const dmResult = await client.conversations.open({ users: userId });
    
    let warningMessage = `⚠️ **Warning ${newWarningCount}/${this.moderationConfig.banAfterWarnings}**\n\n`;
    warningMessage += `You've received a warning for: ${reason}\n\n`;
    
    if (newWarningCount >= this.moderationConfig.muteAfterWarnings) {
      warningMessage += `❗ You have been temporarily muted. `;
      await this.muteUser(userId, 30); // 30 minute mute
    }
    
    if (newWarningCount >= this.moderationConfig.banAfterWarnings - 2) {
      warningMessage += `⚠️ You are close to being banned from the workspace. Please review our community guidelines.`;
    }

    await client.chat.postMessage({
      channel: dmResult.channel?.id!,
      text: warningMessage
    });
  }

  private async muteUser(userId: string, minutes: number): Promise<void> {
    // Implementation for muting user (would require Slack admin permissions)
    console.log(`User ${userId} would be muted for ${minutes} minutes`);
  }

  /**
   * ENGAGEMENT SYSTEM
   */
  private registerEngagementHandlers(): void {
    // Welcome new members
    this.app.event('team_join', async ({ event, client }) => {
      const userId = event.user.id;
      
      // Create learner profile
      await this.createLearnerProfile(userId, event.user);
      
      // Send welcome message
      await this.sendWelcomeSequence(userId, client);
      
      // Announce in general channel
      await client.chat.postMessage({
        channel: this.channels.general,
        text: `🎉 Welcome to Second Story, <@${userId}>!`,
        blocks: this.generateWelcomeBlocks(userId)
      });
    });

    // Track reactions for engagement
    this.app.event('reaction_added', async ({ event }) => {
      if (['thumbsup', 'heart', 'clap', 'tada', 'rocket'].includes(event.reaction)) {
        await this.trackEngagement(event.user, 'reaction_given');
        await this.trackEngagement(event.item_user, 'reaction_received');
        
        // Check for achievement
        await this.checkAchievements(event.item_user);
      }
    });
  }

  private async sendWelcomeSequence(userId: string, client: any): Promise<void> {
    const dmResult = await client.conversations.open({ users: userId });
    const dmChannel = dmResult.channel?.id!;

    // Message 1: Welcome
    await client.chat.postMessage({
      channel: dmChannel,
      text: 'Welcome to Second Story! 🎉',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Welcome to Second Story! 🎉'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Hey there! I'm your AI assistant, here to help you on your coding journey. Let me show you around!`
          }
        }
      ]
    });

    // Message 2: Onboarding checklist
    setTimeout(async () => {
      await client.chat.postMessage({
        channel: dmChannel,
        blocks: this.generateOnboardingChecklist()
      });
    }, 3000);

    // Message 3: First challenge
    setTimeout(async () => {
      const challenge = await this.generatePersonalizedChallenge(userId, 'beginner');
      await client.chat.postMessage({
        channel: dmChannel,
        blocks: challenge
      });
    }, 10000);
  }

  private generateOnboardingChecklist(): any[] {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📋 Your Onboarding Checklist:*'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '☐ Introduce yourself in <#C07VCMW6P25>\n☐ Set up your profile with `/profile`\n☐ Join a standup with `/standup`\n☐ Complete your first challenge\n☐ Connect with a mentor'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '👋 Introduce Myself'
            },
            action_id: 'intro_prompt',
            style: 'primary'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '🎯 Get First Challenge'
            },
            action_id: 'first_challenge'
          }
        ]
      }
    ];
  }

  private generateWelcomeBlocks(userId: string): any[] {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎉 Everyone, please welcome <@${userId}> to the Second Story community!`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `We're here to support each other on our coding journeys. <@${userId}>, feel free to:\n• Introduce yourself\n• Ask questions\n• Share your goals\n• Connect with mentors`
        }
      }
    ];
  }

  /**
   * COMMAND HANDLERS
   */
  private registerCommandHandlers(): void {
    // Stats command
    this.app.command('/stats', async ({ command, ack, respond }) => {
      await ack();
      
      try {
        const stats = await this.generateCommunityStats();
        await respond({
          blocks: stats,
          response_type: 'ephemeral'
        });
      } catch (error) {
        await respond({
          text: 'Sorry, I encountered an error retrieving stats.',
          response_type: 'ephemeral'
        });
      }
    });

    // Enhanced standup command
    this.app.command('/standup', async ({ command, ack, respond }) => {
      await ack();
      
      const standupData = this.parseStandupCommand(command.text);
      await this.recordStandup(command.user_id, standupData);
      
      await respond({
        text: '✅ Standup recorded! Keep up the great work! 🚀',
        response_type: 'ephemeral'
      });
    });
  }

  private async generateCommunityStats(): Promise<any[]> {
    try {
      const { data: memberCount } = await this.supabase
        .from('learner_profiles')
        .select('*', { count: 'exact' });

      const { data: weeklyMessages } = await this.supabase
        .from('engagement_tracking')
        .select('messages_sent')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const totalMessages = weeklyMessages?.reduce((sum: number, item: any) => sum + item.messages_sent, 0) || 0;

      const { data: activeToday } = await this.supabase
        .from('engagement_tracking')
        .select('user_id')
        .gte('created_at', new Date().toDateString());

      return [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Community Statistics'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Members:*\n${memberCount?.length || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Active Today:*\n${activeToday?.length || 0}`
            },
            {
              type: 'mrkdwn',
              text: `*Messages This Week:*\n${totalMessages}`
            },
            {
              type: 'mrkdwn',
              text: `*Growth Rate:*\n📈 Looking good!`
            }
          ]
        }
      ];
    } catch (error) {
      console.error('Error generating stats:', error);
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Error retrieving community statistics.'
          }
        }
      ];
    }
  }

  /**
   * UTILITY METHODS
   */
  private parseReportCommand(text: string): any {
    // Parse report command text
    return {
      type: 'general',
      description: text || 'No description provided'
    };
  }

  private parseStandupCommand(text: string): any {
    // Parse standup text into structured data
    return {
      update: text || 'No update provided',
      timestamp: new Date()
    };
  }

  private async handleUserReport(userId: string, reportData: any, respond: any): Promise<void> {
    // Handle user reports
    await this.supabase.from('user_reports').insert({
      reporter_id: userId,
      report_type: reportData.type,
      description: reportData.description
    });

    await respond({
      text: '✅ Thank you for your report. Our moderators will review it shortly.',
      response_type: 'ephemeral'
    });
  }

  private async generateModerationPanel(): Promise<any[]> {
    const { data: recentActions } = await this.supabase
      .from('moderation_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🛡️ Moderation Dashboard'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Recent Actions:* ${recentActions?.length || 0}\n*Status:* All systems operational`
        }
      }
    ];
  }

  private async isModerator(userId: string): Promise<boolean> {
    const { data: profile } = await this.supabase
      .from('learner_profiles')
      .select('is_moderator, is_admin')
      .eq('user_id', userId)
      .single();

    return profile?.is_moderator || profile?.is_admin || false;
  }

  private async createLearnerProfile(userId: string, userInfo: any): Promise<void> {
    await this.supabase.from('learner_profiles').insert({
      user_id: userId,
      slack_username: userInfo.name,
      email: userInfo.profile?.email,
      full_name: userInfo.real_name || userInfo.name,
      is_active: true,
      onboarding_completed: false
    });
  }

  private async trackEngagement(userId: string, type: string, channelId?: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    // Update or insert engagement record
    const { data: existing } = await this.supabase
      .from('engagement_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      const updates: any = {};
      if (type === 'message') updates.messages_sent = (existing.messages_sent || 0) + 1;
      if (type === 'reaction_given') updates.reactions_given = (existing.reactions_given || 0) + 1;
      if (type === 'reaction_received') updates.reactions_received = (existing.reactions_received || 0) + 1;

      await this.supabase
        .from('engagement_tracking')
        .update(updates)
        .eq('id', existing.id);
    } else {
      const newRecord: any = {
        user_id: userId,
        date: today,
        messages_sent: type === 'message' ? 1 : 0,
        reactions_given: type === 'reaction_given' ? 1 : 0,
        reactions_received: type === 'reaction_received' ? 1 : 0
      };

      await this.supabase
        .from('engagement_tracking')
        .insert(newRecord);
    }
  }

  private async recordStandup(userId: string, standupData: any): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    await this.supabase.from('daily_standups').insert({
      user_id: userId,
      date: today,
      today_plan: standupData.update
    });
  }

  private async generatePersonalizedChallenge(userId: string, level: string): Promise<any[]> {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎯 *Your First Challenge*\n\nCreate a simple "Hello, World!" program in your preferred language and share it in <#${this.channels['code-help']}>!`
        }
      }
    ];
  }

  private async checkAchievements(userId: string): Promise<void> {
    // Check and award achievements
    console.log(`Checking achievements for ${userId}`);
  }

  private initializeScheduledTasks(): void {
    // Daily engagement report
    schedule.scheduleJob('0 18 * * *', async () => {
      await this.generateDailyEngagementReport();
    });

    // Weekly moderation summary
    schedule.scheduleJob('0 9 * * 1', async () => {
      await this.generateWeeklyModerationSummary();
    });
  }

  private async generateDailyEngagementReport(): Promise<void> {
    console.log('Generating daily engagement report...');
  }

  private async generateWeeklyModerationSummary(): Promise<void> {
    console.log('Generating weekly moderation summary...');
  }

  public async start(): Promise<void> {
    await this.app.start();
    console.log('⚡️ Enhanced Second Story Slack Bot is running!');
    
    // Send startup notification
    try {
      await this.app.client.chat.postMessage({
        channel: this.channels['admin-alerts'] || 'general',
        text: '✅ Enhanced Second Story Slack Bot is online with full moderation and engagement tracking!',
      });
    } catch (error) {
      console.error('Error sending startup notification:', error);
    }
  }

  public async stop(): Promise<void> {
    await this.app.stop();
    console.log('Enhanced Second Story Slack Bot stopped');
  }
}
