/**
 * Second Story Deployment Verification Script
 * Comprehensive system check before going live
 */

const { WebClient } = require('@slack/web-api');
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

class DeploymentVerifier {
  constructor() {
    this.results = {
      environment: [],
      slack: [],
      database: [],
      ai: [],
      integrations: [],
      channels: [],
      overall: 'unknown'
    };
    
    this.errors = [];
    this.warnings = [];
  }

  async runFullVerification() {
    console.log('🔍 Second Story Deployment Verification');
    console.log('=====================================');
    console.log('');

    try {
      await this.checkEnvironmentVariables();
      await this.checkSlackIntegration();
      await this.checkDatabaseConnection();
      await this.checkAIServices();
      await this.checkExternalIntegrations();
      await this.checkSlackChannels();
      await this.generateReport();
    } catch (error) {
      console.error('💥 Verification failed:', error);
      this.results.overall = 'failed';
    }

    return this.results;
  }

  async checkEnvironmentVariables() {
    console.log('🔧 Checking Environment Variables...');
    
    const required = [
      'SLACK_BOT_TOKEN',
      'SLACK_APP_TOKEN',
      'SLACK_SIGNING_SECRET',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ANTHROPIC_API_KEY'
    ];

    const optional = [
      'GITHUB_TOKEN',
      'NEWS_API_KEY',
      'REDIS_URL',
      'N8N_WEBHOOK_URL'
    ];

    let requiredMissing = 0;
    let optionalMissing = 0;

    for (const env of required) {
      if (process.env[env]) {
        console.log(`✅ ${env}: configured`);
        this.results.environment.push({ name: env, status: 'ok' });
      } else {
        console.log(`❌ ${env}: MISSING (required)`);
        this.results.environment.push({ name: env, status: 'missing', required: true });
        this.errors.push(`Missing required environment variable: ${env}`);
        requiredMissing++;
      }
    }

    for (const env of optional) {
      if (process.env[env]) {
        console.log(`✅ ${env}: configured`);
        this.results.environment.push({ name: env, status: 'ok' });
      } else {
        console.log(`⚠️  ${env}: not configured (optional)`);
        this.results.environment.push({ name: env, status: 'missing', required: false });
        this.warnings.push(`Optional environment variable not set: ${env}`);
        optionalMissing++;
      }
    }

    console.log(`📊 Environment: ${required.length - requiredMissing}/${required.length} required, ${optional.length - optionalMissing}/${optional.length} optional`);
    console.log('');
  }

  async checkSlackIntegration() {
    console.log('🤖 Checking Slack Integration...');

    if (!process.env.SLACK_BOT_TOKEN) {
      console.log('❌ Cannot test Slack - no bot token');
      this.results.slack.push({ test: 'bot_token', status: 'missing' });
      return;
    }

    const web = new WebClient(process.env.SLACK_BOT_TOKEN);

    try {
      // Test bot authentication
      const authTest = await web.auth.test();
      console.log(`✅ Bot authenticated: ${authTest.user} in ${authTest.team}`);
      this.results.slack.push({ test: 'authentication', status: 'ok', details: authTest });

      // Test bot permissions
      const scopes = authTest.response_metadata?.scopes || [];
      const requiredScopes = [
        'channels:history', 'channels:read', 'chat:write', 'commands',
        'groups:history', 'groups:read', 'im:history', 'im:read', 'im:write',
        'reactions:read', 'users:read', 'users:read.email'
      ];

      let scopesMissing = 0;
      for (const scope of requiredScopes) {
        if (scopes.includes(scope)) {
          console.log(`✅ Scope: ${scope}`);
        } else {
          console.log(`❌ Missing scope: ${scope}`);
          scopesMissing++;
        }
      }

      this.results.slack.push({ 
        test: 'scopes', 
        status: scopesMissing === 0 ? 'ok' : 'partial',
        missing: scopesMissing 
      });

      // Test posting capability
      try {
        await web.chat.postMessage({
          channel: 'general',
          text: '🔍 Deployment verification test (ignore this message)',
          as_user: true
        });
        console.log('✅ Can post messages');
        this.results.slack.push({ test: 'posting', status: 'ok' });
      } catch (postError) {
        console.log(`⚠️  Cannot post to #general: ${postError.message}`);
        this.results.slack.push({ test: 'posting', status: 'warning', error: postError.message });
        this.warnings.push('Bot cannot post to #general channel');
      }

    } catch (error) {
      console.log(`❌ Slack integration failed: ${error.message}`);
      this.results.slack.push({ test: 'integration', status: 'failed', error: error.message });
      this.errors.push(`Slack integration error: ${error.message}`);
    }

    console.log('');
  }

  async checkDatabaseConnection() {
    console.log('🗄️  Checking Database Connection...');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ Cannot test database - missing Supabase credentials');
      this.results.database.push({ test: 'credentials', status: 'missing' });
      return;
    }

    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Test basic connection
      const { data, error } = await supabase
        .from('learner_profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.log(`❌ Database connection failed: ${error.message}`);
        this.results.database.push({ test: 'connection', status: 'failed', error: error.message });
        this.errors.push(`Database connection error: ${error.message}`);
      } else {
        console.log('✅ Database connected successfully');
        this.results.database.push({ test: 'connection', status: 'ok' });
      }

      // Check if required tables exist
      const requiredTables = [
        'learner_profiles', 'progress_entries', 'challenges', 'mentor_profiles',
        'standups', 'achievements', 'job_postings', 'learning_resources'
      ];

      let tablesExist = 0;
      for (const table of requiredTables) {
        try {
          const { error: tableError } = await supabase
            .from(table)
            .select('count')
            .limit(1);

          if (!tableError) {
            console.log(`✅ Table exists: ${table}`);
            tablesExist++;
          } else {
            console.log(`❌ Table missing: ${table}`);
          }
        } catch (tableError) {
          console.log(`❌ Cannot check table: ${table}`);
        }
      }

      this.results.database.push({
        test: 'schema',
        status: tablesExist === requiredTables.length ? 'ok' : 'partial',
        existing: tablesExist,
        required: requiredTables.length
      });

      if (tablesExist < requiredTables.length) {
        this.warnings.push(`Only ${tablesExist}/${requiredTables.length} required tables exist`);
      }

    } catch (error) {
      console.log(`❌ Database check failed: ${error.message}`);
      this.results.database.push({ test: 'database', status: 'failed', error: error.message });
      this.errors.push(`Database error: ${error.message}`);
    }

    console.log('');
  }

  async checkAIServices() {
    console.log('🧠 Checking AI Services...');

    // Check Claude API
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const claude = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });

        const response = await claude.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test' }]
        });

        console.log('✅ Claude API working');
        this.results.ai.push({ service: 'claude', status: 'ok' });
      } catch (claudeError) {
        console.log(`❌ Claude API failed: ${claudeError.message}`);
        this.results.ai.push({ service: 'claude', status: 'failed', error: claudeError.message });
        this.errors.push(`Claude API error: ${claudeError.message}`);
      }
    } else {
      console.log('⚠️  Claude API key not configured');
      this.results.ai.push({ service: 'claude', status: 'missing' });
      this.warnings.push('Claude API key not configured');
    }

    console.log('');
  }

  async checkExternalIntegrations() {
    console.log('🔗 Checking External Integrations...');

    // Check GitHub API
    if (process.env.GITHUB_TOKEN) {
      try {
        const octokit = new Octokit({
          auth: process.env.GITHUB_TOKEN
        });

        const { data } = await octokit.rest.users.getAuthenticated();
        console.log(`✅ GitHub API working (user: ${data.login})`);
        this.results.integrations.push({ service: 'github', status: 'ok', user: data.login });
      } catch (githubError) {
        console.log(`❌ GitHub API failed: ${githubError.message}`);
        this.results.integrations.push({ service: 'github', status: 'failed', error: githubError.message });
        this.warnings.push(`GitHub API error: ${githubError.message}`);
      }
    } else {
      console.log('⚠️  GitHub token not configured');
      this.results.integrations.push({ service: 'github', status: 'missing' });
      this.warnings.push('GitHub token not configured');
    }

    // Check News API
    if (process.env.NEWS_API_KEY) {
      try {
        const response = await axios.get('https://newsapi.org/v2/top-headlines', {
          params: {
            country: 'us',
            category: 'technology',
            pageSize: 1,
            apiKey: process.env.NEWS_API_KEY
          },
          timeout: 5000
        });

        console.log('✅ News API working');
        this.results.integrations.push({ service: 'news_api', status: 'ok' });
      } catch (newsError) {
        console.log(`⚠️  News API failed: ${newsError.message}`);
        this.results.integrations.push({ service: 'news_api', status: 'warning', error: newsError.message });
        this.warnings.push(`News API error: ${newsError.message}`);
      }
    } else {
      console.log('⚠️  News API key not configured');
      this.results.integrations.push({ service: 'news_api', status: 'missing' });
      this.warnings.push('News API key not configured');
    }

    console.log('');
  }

  async checkSlackChannels() {
    console.log('📋 Checking Slack Channels...');

    if (!process.env.SLACK_BOT_TOKEN) {
      console.log('❌ Cannot check channels - no bot token');
      return;
    }

    const web = new WebClient(process.env.SLACK_BOT_TOKEN);
    const requiredChannels = [
      'general', 'announcements', 'daily-standup', 'code-help',
      'job-board', 'resources', 'celebrations', 'mentor-connect',
      'pair-programming', 'admin-alerts'
    ];

    try {
      const { channels } = await web.conversations.list();
      const channelNames = channels.map(ch => ch.name);

      let channelsExist = 0;
      for (const channelName of requiredChannels) {
        if (channelNames.includes(channelName)) {
          console.log(`✅ Channel exists: #${channelName}`);
          channelsExist++;
          this.results.channels.push({ name: channelName, status: 'exists' });
        } else {
          console.log(`❌ Channel missing: #${channelName}`);
          this.results.channels.push({ name: channelName, status: 'missing' });
        }
      }

      if (channelsExist < requiredChannels.length) {
        this.warnings.push(`Only ${channelsExist}/${requiredChannels.length} required channels exist`);
        console.log(`⚠️  Run 'node scripts/setup-channels.js' to create missing channels`);
      }

    } catch (error) {
      console.log(`❌ Cannot check channels: ${error.message}`);
      this.errors.push(`Channel check error: ${error.message}`);
    }

    console.log('');
  }

  async generateReport() {
    console.log('📊 Deployment Verification Report');
    console.log('=================================');
    console.log('');

    // Calculate overall status
    const criticalErrors = this.errors.length;
    const warnings = this.warnings.length;

    if (criticalErrors === 0) {
      if (warnings === 0) {
        this.results.overall = 'ready';
        console.log('🎉 DEPLOYMENT READY! All systems go!');
      } else {
        this.results.overall = 'ready_with_warnings';
        console.log('✅ DEPLOYMENT READY (with warnings)');
      }
    } else {
      this.results.overall = 'not_ready';
      console.log('❌ NOT READY FOR DEPLOYMENT');
    }

    console.log('');
    console.log(`Critical Errors: ${criticalErrors}`);
    console.log(`Warnings: ${warnings}`);
    console.log('');

    if (this.errors.length > 0) {
      console.log('🚨 Critical Errors (must fix):');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings (recommended to fix):');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
      console.log('');
    }

    // Next steps
    console.log('📋 Next Steps:');
    if (this.results.overall === 'ready') {
      console.log('✅ Your system is ready for deployment!');
      console.log('   1. Start your Slack bot: npm run slack:dev');
      console.log('   2. Test all commands in Slack');
      console.log('   3. Monitor #admin-alerts channel');
      console.log('   4. Deploy to production when satisfied');
    } else if (this.results.overall === 'ready_with_warnings') {
      console.log('✅ Your system is ready for deployment with some warnings');
      console.log('   1. Review warnings above (optional features)');
      console.log('   2. Start your Slack bot: npm run slack:dev');
      console.log('   3. Test core functionality');
      console.log('   4. Deploy to production');
    } else {
      console.log('❌ Fix critical errors before deployment:');
      console.log('   1. Address all critical errors listed above');
      console.log('   2. Run this verification script again');
      console.log('   3. Deploy when all critical issues are resolved');
    }

    console.log('');

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      overall_status: this.results.overall,
      summary: {
        critical_errors: this.errors.length,
        warnings: this.warnings.length,
        ready_for_deployment: this.results.overall.includes('ready')
      },
      details: this.results,
      errors: this.errors,
      warnings: this.warnings
    };

    fs.writeFileSync('./deployment-verification-report.json', JSON.stringify(report, null, 2));
    console.log('💾 Detailed report saved to deployment-verification-report.json');
    console.log('');

    return this.results;
  }
}

// Run verification if this file is executed directly
async function main() {
  const verifier = new DeploymentVerifier();
  await verifier.runFullVerification();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DeploymentVerifier };