#!/usr/bin/env node

/**
 * Second Story Brain - Slack Bot Setup Script
 * This script helps you get your Slack bot fully configured and running
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { WebClient } from '@slack/web-api';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SLACK_BOT_TOKEN',
  'SLACK_APP_TOKEN',
  'SLACK_SIGNING_SECRET',
  'ANTHROPIC_API_KEY'
];

const SLACK_CHANNELS = [
  { name: 'general', purpose: 'General discussion and community updates' },
  { name: 'announcements', purpose: 'Important announcements and news' },
  { name: 'daily-standup', purpose: 'Daily standup meetings and progress updates' },
  { name: 'code-help', purpose: 'Get help with coding questions and debugging' },
  { name: 'job-board', purpose: 'Job postings and career opportunities' },
  { name: 'resources', purpose: 'Shared learning resources and materials' },
  { name: 'celebrations', purpose: 'Celebrate achievements and milestones' },
  { name: 'mentor-connect', purpose: 'Connect with mentors and mentees' },
  { name: 'pair-programming', purpose: 'Find pair programming partners' },
  { name: 'admin-alerts', purpose: 'System alerts and admin notifications' }
];

class SlackBotSetup {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.channelIds = {};
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      progress: '🔄'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkEnvironment() {
    this.log('Checking environment configuration...', 'progress');
    
    const missing = [];
    const placeholders = [];
    
    for (const envVar of REQUIRED_ENV_VARS) {
      const value = process.env[envVar];
      
      if (!value) {
        missing.push(envVar);
      } else if (value.includes('your-') || value.includes('placeholder') || value === 'sk-xxx') {
        placeholders.push(envVar);
      }
    }
    
    if (missing.length > 0) {
      this.log(`Missing environment variables: ${missing.join(', ')}`, 'error');
      this.errors.push(`Missing: ${missing.join(', ')}`);
    }
    
    if (placeholders.length > 0) {
      this.log(`Placeholder values detected: ${placeholders.join(', ')}`, 'warning');
      this.warnings.push(`Update placeholders: ${placeholders.join(', ')}`);
    }
    
    if (missing.length === 0 && placeholders.length === 0) {
      this.log('Environment configuration looks good!', 'success');
      return true;
    }
    
    return false;
  }

  async testSupabase() {
    this.log('Testing Supabase connection...', 'progress');
    
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data, error } = await supabase
        .from('learner_profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        this.log(`Supabase error: ${error.message}`, 'error');
        this.errors.push(`Supabase: ${error.message}`);
        return false;
      }
      
      this.log('Supabase connection successful!', 'success');
      return true;
    } catch (error) {
      this.log(`Supabase connection failed: ${error.message}`, 'error');
      this.errors.push(`Supabase: ${error.message}`);
      return false;
    }
  }

  async testSlackConnection() {
    this.log('Testing Slack bot connection...', 'progress');
    
    try {
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
      
      const authTest = await slack.auth.test();
      
      if (!authTest.ok) {
        this.log('Slack authentication failed', 'error');
        this.errors.push('Slack auth failed');
        return false;
      }
      
      this.log(`Slack bot connected as: ${authTest.user} in ${authTest.team}`, 'success');
      return true;
    } catch (error) {
      this.log(`Slack connection failed: ${error.message}`, 'error');
      this.errors.push(`Slack: ${error.message}`);
      return false;
    }
  }

  async setupChannels() {
    this.log('Setting up Slack channels...', 'progress');
    
    try {
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
      
      // Get existing channels
      const channelsResponse = await slack.conversations.list({
        types: 'public_channel,private_channel'
      });
      
      const existingChannels = new Map();
      channelsResponse.channels.forEach(channel => {
        existingChannels.set(channel.name, channel.id);
      });
      
      for (const channelConfig of SLACK_CHANNELS) {
        const { name, purpose } = channelConfig;
        
        if (existingChannels.has(name)) {
          const channelId = existingChannels.get(name);
          this.channelIds[name.toUpperCase().replace('-', '_')] = channelId;
          this.log(`Found existing #${name} (${channelId})`, 'success');
          
          // Add bot to channel if not already there
          try {
            await slack.conversations.join({ channel: channelId });
          } catch (joinError) {
            // Bot might already be in channel, that's okay
          }
        } else {
          // Create new channel
          try {
            const createResponse = await slack.conversations.create({
              name: name,
              is_private: false
            });
            
            const channelId = createResponse.channel.id;
            this.channelIds[name.toUpperCase().replace('-', '_')] = channelId;
            
            // Set channel purpose
            await slack.conversations.setPurpose({
              channel: channelId,
              purpose: purpose
            });
            
            this.log(`Created #${name} (${channelId})`, 'success');
          } catch (createError) {
            this.log(`Failed to create #${name}: ${createError.message}`, 'warning');
          }
        }
      }
      
      return true;
    } catch (error) {
      this.log(`Channel setup failed: ${error.message}`, 'error');
      this.errors.push(`Channels: ${error.message}`);
      return false;
    }
  }

  generateEnvUpdate() {
    this.log('Generating environment variable updates...', 'progress');
    
    const envUpdates = [];
    
    // Add channel IDs
    for (const [key, value] of Object.entries(this.channelIds)) {
      envUpdates.push(`SLACK_CHANNEL_${key}=${value}`);
    }
    
    if (envUpdates.length > 0) {
      const envContent = '\n# Slack Channel IDs (Auto-generated)\n' + envUpdates.join('\n') + '\n';
      
      // Append to .env file
      fs.appendFileSync('.env', envContent);
      
      this.log('Updated .env file with channel IDs', 'success');
      
      console.log('\n📋 Channel IDs added to .env:');
      envUpdates.forEach(line => console.log(`   ${line}`));
    }
  }

  async testSlackCommands() {
    this.log('Testing Slack bot functionality...', 'progress');
    
    try {
      const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
      
      // Test posting to general channel
      const generalChannelId = this.channelIds.GENERAL;
      
      if (generalChannelId) {
        await slack.chat.postMessage({
          channel: generalChannelId,
          text: '🤖 Second Story Brain is now online! Type `/help` to see what I can do.',
          username: 'Second Story Brain'
        });
        
        this.log('Test message posted to #general', 'success');
      }
      
      return true;
    } catch (error) {
      this.log(`Slack test failed: ${error.message}`, 'warning');
      return false;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SECOND STORY BRAIN SETUP SUMMARY');
    console.log('='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log('✅ Setup completed successfully!');
      console.log('\n🎯 Your Slack bot is ready to:');
      console.log('   • Answer questions with AI');
      console.log('   • Manage daily standups');
      console.log('   • Share curated content');
      console.log('   • Onboard new members');
      console.log('   • Monitor system health');
      
      console.log('\n🚀 Next steps:');
      console.log('   1. Run: npm run slack:dev');
      console.log('   2. Test: Type /help in #general');
      console.log('   3. Enjoy your automated community!');
    } else {
      console.log('❌ Setup encountered issues:');
      this.errors.forEach(error => console.log(`   • ${error}`));
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        this.warnings.forEach(warning => console.log(`   • ${warning}`));
      }
      
      console.log('\n📋 Please fix these issues and run the setup again.');
    }
    
    console.log('\n📚 For detailed instructions, see:');
    console.log('   • QUICK_START.md - Fast setup guide');
    console.log('   • SLACK_DEPLOYMENT_GUIDE.md - Complete instructions');
    console.log('='.repeat(60));
  }

  async run() {
    console.log('🧠 Second Story Brain - Slack Bot Setup');
    console.log('=====================================\n');
    
    const envOk = await this.checkEnvironment();
    
    if (!envOk) {
      this.log('Please update your .env file with real tokens and run again.', 'error');
      this.printSummary();
      return;
    }
    
    const supabaseOk = await this.testSupabase();
    const slackOk = await this.testSlackConnection();
    
    if (supabaseOk && slackOk) {
      await this.setupChannels();
      this.generateEnvUpdate();
      await this.testSlackCommands();
    }
    
    this.printSummary();
  }
}

// Run the setup
const setup = new SlackBotSetup();
setup.run().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});