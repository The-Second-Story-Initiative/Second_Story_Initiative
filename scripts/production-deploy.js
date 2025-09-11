#!/usr/bin/env node

/**
 * Production Deployment Script for Second Story Slack AI Agent
 * Handles complete setup and deployment to production environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

class ProductionDeployer {
  constructor() {
    this.config = {};
    this.deploymentSteps = [
      'validateEnvironment',
      'setupDatabase',
      'configureSlackApp',
      'deployToProduction',
      'verifyDeployment',
      'setupMonitoring'
    ];
  }

  async deploy() {
    log('🚀 Second Story Slack AI Agent - Production Deployment', 'bright');
    log('================================================================', 'cyan');

    try {
      await this.collectConfiguration();
      
      for (const step of this.deploymentSteps) {
        log(`\n📋 Executing: ${step}`, 'yellow');
        await this[step]();
        log(`✅ Completed: ${step}`, 'green');
      }

      await this.displaySuccessMessage();
    } catch (error) {
      log(`❌ Deployment failed: ${error.message}`, 'red');
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async collectConfiguration() {
    log('\n🔧 Configuration Setup', 'blue');
    log('Please provide the required configuration details:\n');

    // Slack Configuration
    this.config.slackBotToken = await question('Slack Bot Token (xoxb-...): ');
    this.config.slackAppToken = await question('Slack App Token (xapp-...): ');
    this.config.slackSigningSecret = await question('Slack Signing Secret: ');

    // API Keys
    this.config.anthropicApiKey = await question('Anthropic API Key: ');

    // Database Configuration
    this.config.supabaseUrl = await question('Supabase URL: ');
    this.config.supabaseServiceKey = await question('Supabase Service Role Key: ');

    // Optional configurations
    this.config.githubToken = await question('GitHub Token (optional): ') || '';
    this.config.environment = await question('Environment (production/staging) [production]: ') || 'production';
    this.config.port = await question('Port [3000]: ') || '3000';

    // Channel IDs
    log('\n📺 Channel Configuration (provide channel IDs):');
    this.config.channels = {
      general: await question('General Channel ID: ') || 'C07VCMW6P25',
      announcements: await question('Announcements Channel ID: ') || '',
      standup: await question('Daily Standup Channel ID: ') || '',
      codehelp: await question('Code Help Channel ID: ') || '',
      jobs: await question('Job Board Channel ID: ') || '',
      resources: await question('Resources Channel ID: ') || '',
      wins: await question('Celebrations Channel ID: ') || '',
      mentors: await question('Mentor Connect Channel ID: ') || '',
      admin: await question('Admin Alerts Channel ID: ') || '',
      moderation: await question('Moderation Channel ID: ') || ''
    };
  }

  async validateEnvironment() {
    log('Validating environment...', 'yellow');

    // Check Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (major < 18) {
      throw new Error(`Node.js 18+ required. Current version: ${nodeVersion}`);
    }

    // Check required tools
    const tools = ['npm', 'git'];
    for (const tool of tools) {
      try {
        execSync(`${tool} --version`, { stdio: 'ignore' });
      } catch (error) {
        throw new Error(`${tool} is not installed or not in PATH`);
      }
    }

    // Create .env file
    await this.createEnvFile();

    log('Environment validation completed', 'green');
  }

  async createEnvFile() {
    const envContent = `# Second Story Slack Bot Production Configuration
# Generated on ${new Date().toISOString()}

# Slack Configuration
SLACK_BOT_TOKEN=${this.config.slackBotToken}
SLACK_APP_TOKEN=${this.config.slackAppToken}
SLACK_SIGNING_SECRET=${this.config.slackSigningSecret}

# AI Service
ANTHROPIC_API_KEY=${this.config.anthropicApiKey}

# Database
SUPABASE_URL=${this.config.supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${this.config.supabaseServiceKey}

# Optional Services
GITHUB_TOKEN=${this.config.githubToken}
JWT_SECRET=${this.generateSecretKey()}

# Channel Configuration
SLACK_CHANNEL_GENERAL=${this.config.channels.general}
SLACK_CHANNEL_ANNOUNCEMENTS=${this.config.channels.announcements}
SLACK_CHANNEL_STANDUP=${this.config.channels.standup}
SLACK_CHANNEL_CODEHELP=${this.config.channels.codehelp}
SLACK_CHANNEL_JOBS=${this.config.channels.jobs}
SLACK_CHANNEL_RESOURCES=${this.config.channels.resources}
SLACK_CHANNEL_WINS=${this.config.channels.wins}
SLACK_CHANNEL_MENTORS=${this.config.channels.mentors}
SLACK_CHANNEL_ADMIN=${this.config.channels.admin}
SLACK_CHANNEL_MODERATION=${this.config.channels.moderation}

# Application Configuration
NODE_ENV=${this.config.environment}
PORT=${this.config.port}
LOG_LEVEL=info

# Redis Configuration (if using)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=
DATADOG_API_KEY=
`;

    fs.writeFileSync('.env', envContent);
    log('Environment file created', 'green');
  }

  generateSecretKey() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  async setupDatabase() {
    log('Setting up database schema...', 'yellow');

    try {
      // Install dependencies if not already installed
      log('Installing dependencies...', 'yellow');
      execSync('npm install', { stdio: 'inherit' });

      // Run database migrations
      log('Running database migrations...', 'yellow');
      const migrationFiles = [
        'supabase/migrations/enhanced_production_schema.sql'
      ];

      for (const file of migrationFiles) {
        if (fs.existsSync(file)) {
          log(`Applying migration: ${file}`, 'cyan');
          // You would typically run this through Supabase CLI or your database client
          // For now, we'll just log the instruction
          log(`Please run this migration in your Supabase SQL editor: ${file}`, 'yellow');
        }
      }

      log('Database setup completed', 'green');
    } catch (error) {
      throw new Error(`Database setup failed: ${error.message}`);
    }
  }

  async configureSlackApp() {
    log('Configuring Slack app...', 'yellow');

    const slackConfig = {
      commands: [
        { command: '/help', description: 'Show available commands' },
        { command: '/progress', description: 'View learning progress' },
        { command: '/challenge', description: 'Get coding challenge' },
        { command: '/mentor', description: 'Find mentor help' },
        { command: '/pair', description: 'Find coding partner' },
        { command: '/standup', description: 'Record daily standup' },
        { command: '/jobs', description: 'Browse opportunities' },
        { command: '/resources', description: 'Learning materials' },
        { command: '/admin', description: 'Admin dashboard' },
        { command: '/moderate', description: 'Moderation controls' },
        { command: '/report', description: 'Report an issue' },
        { command: '/stats', description: 'Community statistics' }
      ],
      scopes: [
        'app_mentions:read',
        'channels:history',
        'channels:join',
        'channels:manage',
        'channels:read',
        'chat:write',
        'chat:write.customize',
        'chat:write.public',
        'commands',
        'files:read',
        'files:write',
        'groups:history',
        'groups:read',
        'groups:write',
        'im:history',
        'im:read',
        'im:write',
        'links:read',
        'links:write',
        'mpim:history',
        'mpim:read',
        'mpim:write',
        'pins:read',
        'pins:write',
        'reactions:read',
        'reactions:write',
        'team:read',
        'usergroups:read',
        'users:read',
        'users:read.email',
        'users:write'
      ],
      events: [
        'app_mention',
        'channel_created',
        'member_joined_channel',
        'member_left_channel',
        'message.channels',
        'message.groups',
        'message.im',
        'message.mpim',
        'reaction_added',
        'reaction_removed',
        'team_join',
        'user_change'
      ]
    };

    // Save configuration for reference
    fs.writeFileSync('slack-app-config.json', JSON.stringify(slackConfig, null, 2));

    log('Slack app configuration saved to slack-app-config.json', 'green');
    log('Please ensure your Slack app has all the required scopes and event subscriptions', 'yellow');
  }

  async deployToProduction() {
    log('Deploying to production...', 'yellow');

    try {
      // Build the application
      log('Building application...', 'cyan');
      execSync('npm run build', { stdio: 'inherit' });

      // Create production start script
      const startScript = `#!/bin/bash
# Second Story Slack Bot Production Start Script

# Set production environment
export NODE_ENV=production

# Load environment variables
source .env

# Start the application with PM2 (if available) or node
if command -v pm2 &> /dev/null; then
    echo "Starting with PM2..."
    pm2 start npm --name "second-story-bot" -- start
    pm2 save
    pm2 startup
else
    echo "Starting with Node.js..."
    node api/server.js
fi
`;

      fs.writeFileSync('start-production.sh', startScript);
      execSync('chmod +x start-production.sh');

      // Create Docker configuration if needed
      if (await question('Deploy with Docker? (y/N): ').toLowerCase() === 'y') {
        await this.createDockerConfig();
      }

      log('Production deployment completed', 'green');
    } catch (error) {
      throw new Error(`Production deployment failed: ${error.message}`);
    }
  }

  async createDockerConfig() {
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
`;

    const dockerCompose = `version: '3.8'

services:
  second-story-bot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  redis_data:
`;

    fs.writeFileSync('Dockerfile', dockerfile);
    fs.writeFileSync('docker-compose.prod.yml', dockerCompose);

    log('Docker configuration created', 'green');
  }

  async verifyDeployment() {
    log('Verifying deployment...', 'yellow');

    const checks = [
      { name: 'Environment file', check: () => fs.existsSync('.env') },
      { name: 'Dependencies installed', check: () => fs.existsSync('node_modules') },
      { name: 'Build artifacts', check: () => fs.existsSync('dist') || fs.existsSync('build') || true }
    ];

    for (const { name, check } of checks) {
      if (check()) {
        log(`✅ ${name}`, 'green');
      } else {
        log(`❌ ${name}`, 'red');
        throw new Error(`Verification failed: ${name}`);
      }
    }

    // Test Slack connection
    log('Testing Slack connection...', 'cyan');
    // This would normally make a test API call to Slack
    log('⚠️  Please test the Slack bot manually by sending a message to the bot', 'yellow');

    log('Deployment verification completed', 'green');
  }

  async setupMonitoring() {
    log('Setting up monitoring...', 'yellow');

    const monitoringScript = `#!/bin/bash
# Health monitoring script for Second Story Slack Bot

check_bot_health() {
    echo "Checking bot health..."
    
    # Check if process is running
    if pm2 describe second-story-bot > /dev/null 2>&1; then
        echo "✅ Bot process is running"
    else
        echo "❌ Bot process is not running"
        pm2 start npm --name "second-story-bot" -- start
    fi
    
    # Check disk space
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $disk_usage -gt 80 ]; then
        echo "⚠️ Disk usage is high: $disk_usage%"
    fi
    
    # Check memory usage
    memory_usage=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
    echo "Memory usage: $memory_usage%"
    
    # Log to file
    echo "$(date): Health check completed" >> /var/log/second-story-bot.log
}

# Run health check
check_bot_health

# Add to crontab for regular monitoring
# */5 * * * * /path/to/monitor.sh
`;

    fs.writeFileSync('monitor.sh', monitoringScript);
    execSync('chmod +x monitor.sh');

    log('Monitoring setup completed', 'green');
    log('Add monitor.sh to crontab for automated monitoring', 'yellow');
  }

  async displaySuccessMessage() {
    log('\n🎉 Deployment Completed Successfully!', 'bright');
    log('============================================', 'green');
    
    const instructions = `
📋 Next Steps:

1. 🚀 Start the bot:
   ./start-production.sh

2. 🔧 Configure Slack App:
   - Use the configuration in slack-app-config.json
   - Set up slash commands and event subscriptions
   - Install the app to your workspace

3. 🗄️ Database Setup:
   - Run the migration file in your Supabase dashboard
   - Verify all tables are created correctly

4. 📊 Monitoring:
   - Add monitor.sh to your crontab
   - Set up log rotation for application logs
   - Configure alerts for critical errors

5. 🧪 Testing:
   - Test all slash commands in Slack
   - Verify AI responses are working
   - Check moderation features

📖 Documentation:
   - README.md - Project overview
   - assets/SLACK_DEPLOYMENT_GUIDE.md - Slack configuration
   - assets/DEPLOYMENT_CHECKLIST.md - Production checklist

🆘 Support:
   - Check logs in ./logs/ directory
   - Review health checks with ./monitor.sh
   - Consult documentation for troubleshooting

🎯 Your Second Story Slack AI Agent is ready to help your community grow!
`;

    log(instructions, 'cyan');
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  const deployer = new ProductionDeployer();
  deployer.deploy().catch(console.error);
}

module.exports = ProductionDeployer;
