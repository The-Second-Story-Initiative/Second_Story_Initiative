/**
 * Main entry point for the Second Story Slack Bot
 * Starts the entire ecosystem and handles graceful shutdown
 */

import dotenv from 'dotenv';
import { SecondStorySlackBrain } from './SlackBrain.js';

// Load environment variables
dotenv.config();

async function startSlackBot(): Promise<void> {
  try {
    console.log('🚀 Starting Second Story Slack Bot...');
    console.log(`📍 Workspace: ${process.env.SLACK_WORKSPACE || 'straydogsyndi-do42630'}.slack.com`);

    // Validate required environment variables
    const requiredEnvVars = [
      'SLACK_BOT_TOKEN',
      'SLACK_APP_TOKEN',
      'ANTHROPIC_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(envVar => console.error(`   - ${envVar}`));
      console.error('\nPlease check your .env file and add the missing variables.');
      process.exit(1);
    }

    // Create and start the bot
    const slackBrain = new SecondStorySlackBrain();
    
    // Set up graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
      try {
        await slackBrain.stop();
        console.log('✅ Second Story Slack Bot stopped successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });

    // Start the bot
    await slackBrain.start();
    
    console.log('✅ Second Story Slack Bot is now running!');
    console.log('📝 Available commands:');
    console.log('   /help - Show help menu');
    console.log('   /progress - View learning progress');
    console.log('   /challenge - Get personalized challenge');
    console.log('   /mentor - Get mentor help or match');
    console.log('   /pair - Find pair programming partner');
    console.log('   /standup - Record daily standup');
    console.log('   /jobs - Browse job opportunities');
    console.log('   /resources - Find learning resources');
    console.log('   /admin - Admin dashboard (admins only)');
    console.log('');
    console.log('🤖 The bot is also listening for @mentions for AI-powered help!');

  } catch (error) {
    console.error('💥 Failed to start Second Story Slack Bot:', error);
    process.exit(1);
  }
}

// Start the bot if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startSlackBot();
}

export { startSlackBot };