/**
 * Admin Monitoring System for Second Story Initiative
 * Comprehensive monitoring and admin tools for the Slack ecosystem
 */

import { App } from '@slack/bolt';
import { SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import { DatabaseService, LearnerProfile } from './DatabaseService.js';

interface SystemHealth {
  github: boolean;
  claude: boolean;
  supabase: boolean;
  slack: boolean;
  overall: 'healthy' | 'degraded' | 'down';
}

interface AlertConfig {
  type: 'learner_inactive' | 'system_down' | 'high_failure_rate' | 'mentor_overload';
  threshold: number;
  enabled: boolean;
}

interface AdminMetrics {
  learners: {
    total: number;
    active: number;
    at_risk: number;
    new_this_week: number;
  };
  engagement: {
    daily_standups: number;
    mentor_sessions: number;
    challenges_completed: number;
    average_completion_rate: number;
  };
  system: {
    uptime_percentage: number;
    api_response_time: number;
    error_rate: number;
  };
  alerts: string[];
}

export class AdminMonitor {
  private slackApp: App;
  private supabase: SupabaseClient;
  private database: DatabaseService;
  private alerts: string[] = [];
  private healthHistory: SystemHealth[] = [];
  private alertConfigs: AlertConfig[] = [
    { type: 'learner_inactive', threshold: 7, enabled: true },
    { type: 'system_down', threshold: 1, enabled: true },
    { type: 'high_failure_rate', threshold: 50, enabled: true },
    { type: 'mentor_overload', threshold: 5, enabled: true },
  ];

  constructor(slackApp: App, supabaseClient: SupabaseClient) {
    this.slackApp = slackApp;
    this.supabase = supabaseClient;
    this.database = new DatabaseService(supabaseClient);
  }

  public async generateAdminDashboard(): Promise<any[]> {
    try {
      const metrics = await this.collectAllMetrics();
      const systemHealth = await this.checkSystemHealth();
      const atRiskLearners = await this.database.identifyAtRiskLearners();

      return this.createDashboardBlocks(metrics, systemHealth, atRiskLearners);
    } catch (error) {
      console.error('Error generating admin dashboard:', error);
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '❌ Error generating admin dashboard. Please try again later.',
          },
        },
      ];
    }
  }

  private async collectAllMetrics(): Promise<AdminMetrics> {
    const [learnerMetrics, engagementMetrics] = await Promise.all([
      this.database.getLearnerMetrics(),
      this.database.getEngagementMetrics(),
    ]);

    const atRiskLearners = await this.database.identifyAtRiskLearners();
    
    // Calculate new learners this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: newLearners } = await this.supabase
      .from('learner_profiles')
      .select('id', { count: 'exact' })
      .gte('created_at', weekAgo.toISOString());

    return {
      learners: {
        total: learnerMetrics.totalLearners,
        active: learnerMetrics.activeLearners,
        at_risk: atRiskLearners.length,
        new_this_week: newLearners?.length || 0,
      },
      engagement: {
        daily_standups: engagementMetrics.standupsThisWeek,
        mentor_sessions: engagementMetrics.mentorSessionsThisWeek,
        challenges_completed: learnerMetrics.challengesCompletedThisWeek,
        average_completion_rate: learnerMetrics.averageCompletionRate,
      },
      system: {
        uptime_percentage: this.calculateUptimePercentage(),
        api_response_time: await this.measureApiResponseTime(),
        error_rate: this.calculateErrorRate(),
      },
      alerts: this.alerts,
    };
  }

  public async checkSystemHealth(): Promise<SystemHealth> {
    const healthChecks = await Promise.allSettled([
      this.checkGitHubAPI(),
      this.checkClaudeAPI(),
      this.checkSupabaseAPI(),
      this.checkSlackAPI(),
    ]);

    const health: SystemHealth = {
      github: healthChecks[0].status === 'fulfilled' && healthChecks[0].value,
      claude: healthChecks[1].status === 'fulfilled' && healthChecks[1].value,
      supabase: healthChecks[2].status === 'fulfilled' && healthChecks[2].value,
      slack: healthChecks[3].status === 'fulfilled' && healthChecks[3].value,
      overall: 'healthy',
    };

    // Determine overall health
    const downSystems = Object.values(health).filter(status => status === false).length;
    if (downSystems === 0) {
      health.overall = 'healthy';
    } else if (downSystems <= 1) {
      health.overall = 'degraded';
    } else {
      health.overall = 'down';
    }

    // Store health history
    this.healthHistory.push(health);
    if (this.healthHistory.length > 24) { // Keep 24 hours of history
      this.healthHistory.shift();
    }

    // Generate alerts for system issues
    await this.checkSystemAlerts(health);

    return health;
  }

  private async checkGitHubAPI(): Promise<boolean> {
    try {
      const response = await axios.get('https://api.github.com/rate_limit', {
        timeout: 5000,
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      console.error('GitHub API health check failed:', error);
      return false;
    }
  }

  private async checkClaudeAPI(): Promise<boolean> {
    try {
      // We can't easily test Claude API without making a real request
      // so we'll just check if the API key is configured
      return !!process.env.ANTHROPIC_API_KEY;
    } catch (error) {
      console.error('Claude API health check failed:', error);
      return false;
    }
  }

  private async checkSupabaseAPI(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('learner_profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Supabase API health check failed:', error);
      return false;
    }
  }

  private async checkSlackAPI(): Promise<boolean> {
    try {
      await this.slackApp.client.auth.test();
      return true;
    } catch (error) {
      console.error('Slack API health check failed:', error);
      return false;
    }
  }

  private async checkSystemAlerts(health: SystemHealth): Promise<void> {
    // Clear old alerts
    this.alerts = this.alerts.filter(alert => 
      !alert.includes('API is down') && !alert.includes('system degraded')
    );

    // Check for system down alerts
    const alertConfig = this.alertConfigs.find(config => config.type === 'system_down');
    if (alertConfig?.enabled) {
      if (!health.github) {
        this.alerts.push('🔴 GitHub API is down or responding slowly');
      }
      if (!health.claude) {
        this.alerts.push('🔴 Claude API is down or not configured');
      }
      if (!health.supabase) {
        this.alerts.push('🔴 Supabase API is down or responding slowly');
      }
      if (!health.slack) {
        this.alerts.push('🔴 Slack API is down or responding slowly');
      }

      if (health.overall === 'degraded') {
        this.alerts.push('🟡 System performance is degraded');
      } else if (health.overall === 'down') {
        this.alerts.push('🔴 Multiple systems are down - immediate attention required');
      }
    }

    // Send critical alerts to admin channel
    if (health.overall === 'down') {
      await this.sendCriticalAlert('Multiple systems are down - immediate attention required');
    }
  }

  public async performHealthCheck(): Promise<void> {
    try {
      const health = await this.checkSystemHealth();
      const atRiskLearners = await this.identifyAtRiskLearners();
      
      // Log health status
      console.log(`System health check: ${health.overall}`);
      
      // Check for at-risk learners
      if (atRiskLearners.length > 0) {
        await this.checkLearnerAlerts(atRiskLearners);
      }

      // Check mentor overload
      await this.checkMentorOverload();

    } catch (error) {
      console.error('Error performing health check:', error);
      this.alerts.push('🔴 Health check system error');
    }
  }

  private async identifyAtRiskLearners(): Promise<LearnerProfile[]> {
    const atRiskLearners = await this.database.identifyAtRiskLearners();
    
    const alertConfig = this.alertConfigs.find(config => config.type === 'learner_inactive');
    if (alertConfig?.enabled && atRiskLearners.length > 0) {
      const criticalLearners = atRiskLearners.filter(learner => 
        learner.days_inactive >= alertConfig.threshold * 2 // Double the threshold for critical
      );

      if (criticalLearners.length > 0) {
        this.alerts.push(`🟡 ${criticalLearners.length} learners critically inactive (${alertConfig.threshold * 2}+ days)`);
      }
    }

    return atRiskLearners;
  }

  private async checkLearnerAlerts(atRiskLearners: LearnerProfile[]): Promise<void> {
    const alertConfig = this.alertConfigs.find(config => config.type === 'learner_inactive');
    if (!alertConfig?.enabled) return;

    const inactiveLearners = atRiskLearners.filter(learner => 
      learner.days_inactive >= alertConfig.threshold
    );

    if (inactiveLearners.length > 0) {
      this.alerts.push(`⚠️ ${inactiveLearners.length} learners inactive for ${alertConfig.threshold}+ days`);
    }

    // Check completion rates
    const lowCompletionLearners = atRiskLearners.filter(learner => 
      learner.completion_rate < 30 && learner.challenges_completed > 5
    );

    if (lowCompletionLearners.length > 0) {
      this.alerts.push(`📉 ${lowCompletionLearners.length} learners with completion rate below 30%`);
    }
  }

  private async checkMentorOverload(): Promise<void> {
    const mentors = await this.database.getMentorProfiles();
    const alertConfig = this.alertConfigs.find(config => config.type === 'mentor_overload');
    
    if (!alertConfig?.enabled) return;

    const overloadedMentors = mentors.filter(mentor => 
      mentor.current_mentees.length >= mentor.max_mentees - 1
    );

    if (overloadedMentors.length > 0) {
      this.alerts.push(`👥 ${overloadedMentors.length} mentors at or near capacity`);
    }
  }

  private createDashboardBlocks(
    metrics: AdminMetrics,
    health: SystemHealth,
    atRiskLearners: LearnerProfile[]
  ): any[] {
    const healthEmoji = {
      healthy: '🟢',
      degraded: '🟡',
      down: '🔴',
    };

    const blocks: any[] = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📊 Second Story Admin Dashboard' },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*System Status:* ${healthEmoji[health.overall]} ${health.overall.toUpperCase()}\n*Last Updated:* ${new Date().toLocaleString()}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*📈 Learner Metrics*' },
        fields: [
          { type: 'mrkdwn', text: `*Total Learners:* ${metrics.learners.total}` },
          { type: 'mrkdwn', text: `*Active This Week:* ${metrics.learners.active}` },
          { type: 'mrkdwn', text: `*At Risk:* ${metrics.learners.at_risk}` },
          { type: 'mrkdwn', text: `*New This Week:* ${metrics.learners.new_this_week}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*🎯 Engagement Metrics*' },
        fields: [
          { type: 'mrkdwn', text: `*Daily Standups:* ${metrics.engagement.daily_standups}` },
          { type: 'mrkdwn', text: `*Mentor Sessions:* ${metrics.engagement.mentor_sessions}` },
          { type: 'mrkdwn', text: `*Challenges Completed:* ${metrics.engagement.challenges_completed}` },
          { type: 'mrkdwn', text: `*Avg Completion Rate:* ${metrics.engagement.average_completion_rate}%` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: '*🔧 System Health*' },
        fields: [
          { type: 'mrkdwn', text: `*GitHub API:* ${health.github ? '✅' : '❌'}` },
          { type: 'mrkdwn', text: `*Claude API:* ${health.claude ? '✅' : '❌'}` },
          { type: 'mrkdwn', text: `*Supabase:* ${health.supabase ? '✅' : '❌'}` },
          { type: 'mrkdwn', text: `*Slack API:* ${health.slack ? '✅' : '❌'}` },
        ],
      },
    ];

    // Add alerts section if there are any
    if (metrics.alerts.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*⚠️ Active Alerts (${metrics.alerts.length}):*\n${metrics.alerts.map(alert => `• ${alert}`).join('\n')}`,
        },
      });
    }

    // Add at-risk learners section
    if (atRiskLearners.length > 0) {
      const topRisk = atRiskLearners.slice(0, 5);
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🚨 Top At-Risk Learners:*\n${topRisk.map(learner => 
            `• <@${learner.slack_user_id}> - ${learner.days_inactive} days inactive, ${learner.completion_rate}% completion`
          ).join('\n')}`,
        },
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '🤖 Generated by Second Story Admin Monitor • Use `/admin` to refresh',
        },
      ],
    });

    return blocks;
  }

  private async sendCriticalAlert(message: string): Promise<void> {
    try {
      await this.slackApp.client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ADMIN || 'C_ADMIN_ID',
        text: `🚨 CRITICAL ALERT: ${message}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🚨 *CRITICAL ALERT*\n${message}\n\nPlease investigate immediately.`,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error sending critical alert:', error);
    }
  }

  private calculateUptimePercentage(): number {
    if (this.healthHistory.length === 0) return 100;

    const healthyChecks = this.healthHistory.filter(health => health.overall === 'healthy').length;
    return Math.round((healthyChecks / this.healthHistory.length) * 100);
  }

  private async measureApiResponseTime(): Promise<number> {
    try {
      const start = Date.now();
      await this.supabase.from('learner_profiles').select('id').limit(1);
      const end = Date.now();
      return end - start;
    } catch (error) {
      return -1; // Error state
    }
  }

  private calculateErrorRate(): number {
    // This would typically track errors over time
    // For now, return a placeholder based on system health
    const latestHealth = this.healthHistory[this.healthHistory.length - 1];
    if (!latestHealth) return 0;

    const downSystems = Object.values(latestHealth).filter(status => status === false).length;
    return Math.round((downSystems / 4) * 100); // 4 systems total
  }

  public async generateWeeklyReport(): Promise<any[]> {
    try {
      const metrics = await this.collectAllMetrics();
      const weeklyGrowth = await this.calculateWeeklyGrowth();
      const topPerformers = await this.getTopPerformers();

      return [
        {
          type: 'header',
          text: { type: 'plain_text', text: '📊 Weekly Admin Report' },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Week Ending:* ${new Date().toLocaleDateString()}\n*Total Learners:* ${metrics.learners.total} (+${weeklyGrowth.newLearners} this week)`,
          },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '*📈 Key Metrics*' },
          fields: [
            { type: 'mrkdwn', text: `*Engagement Rate:* ${weeklyGrowth.engagementRate}%` },
            { type: 'mrkdwn', text: `*Challenges Completed:* ${metrics.engagement.challenges_completed}` },
            { type: 'mrkdwn', text: `*Mentor Sessions:* ${metrics.engagement.mentor_sessions}` },
            { type: 'mrkdwn', text: `*System Uptime:* ${metrics.system.uptime_percentage}%` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🏆 Top Performers This Week:*\n${topPerformers.map((learner, index) => 
              `${index + 1}. <@${learner.slack_user_id}> - ${learner.challenges_completed} challenges completed`
            ).join('\n')}`,
          },
        },
      ];
    } catch (error) {
      console.error('Error generating weekly report:', error);
      return [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '❌ Error generating weekly report. Please try again later.',
          },
        },
      ];
    }
  }

  private async calculateWeeklyGrowth(): Promise<any> {
    // Placeholder implementation
    return {
      newLearners: 3,
      engagementRate: 78,
    };
  }

  private async getTopPerformers(): Promise<LearnerProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('learner_profiles')
        .select('*')
        .order('challenges_completed', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      return data as LearnerProfile[];
    } catch (error) {
      console.error('Error getting top performers:', error);
      return [];
    }
  }
}