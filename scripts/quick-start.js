#!/usr/bin/env node

/**
 * Quick Start Script for Second Story Slack AI Agent
 * Simplified setup for development and testing
 */

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function quickStart() {
  console.log('🚀 Second Story Slack Bot - Quick Start Setup\n');

  try {
    // Check if .env exists
    if (!fs.existsSync('.env')) {
      console.log('📝 Creating environment configuration...\n');
      
      const botToken = await question('Enter your Slack Bot Token (xoxb-...): ');
      const appToken = await question('Enter your Slack App Token (xapp-...): ');
      const signingSecret = await question('Enter your Slack Signing Secret: ');
      const anthropicKey = await question('Enter your Anthropic API Key: ');
      const supabaseUrl = await question('Enter your Supabase URL: ');
      const supabaseKey = await question('Enter your Supabase Service Role Key: ');

      const envContent = `# Second Story Slack Bot Configuration
SLACK_BOT_TOKEN=${botToken}
SLACK_APP_TOKEN=${appToken}
SLACK_SIGNING_SECRET=${signingSecret}
ANTHROPIC_API_KEY=${anthropicKey}
SUPABASE_URL=${supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${supabaseKey}

# Default channel (update with your actual channel ID)
SLACK_CHANNEL_GENERAL=C07VCMW6P25

# Application settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
`;

      fs.writeFileSync('.env', envContent);
      console.log('✅ Environment file created\n');
    }

    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Start the bot
    console.log('\n🚀 Starting the bot...');
    console.log('Press Ctrl+C to stop the bot\n');
    
    execSync('npm run server:dev', { stdio: 'inherit' });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  quickStart();
}
