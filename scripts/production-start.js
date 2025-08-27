/**
 * Production Startup Script for Second Story Slack Ecosystem
 * Handles initialization, health checks, and graceful startup
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { WebClient } = require('@slack/web-api');
require('dotenv').config();

class ProductionManager {
  constructor() {
    this.processes = new Map();
    this.isShuttingDown = false;
    this.startupLog = [];
    this.healthChecks = new Map();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    console.log(logEntry);
    this.startupLog.push(logEntry);

    // Also log to file
    fs.appendFileSync('./logs/production.log', logEntry + '\n');
  }

  async preStartupChecks() {
    this.log('🔍 Running pre-startup checks...');

    // Check environment
    const required = [
      'SLACK_BOT_TOKEN',
      'SLACK_APP_TOKEN', 
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ANTHROPIC_API_KEY'
    ];

    for (const env of required) {
      if (!process.env[env]) {
        throw new Error(`Missing required environment variable: ${env}`);
      }
    }

    this.log('✅ Environment variables validated');

    // Test Slack connection
    try {
      const web = new WebClient(process.env.SLACK_BOT_TOKEN);
      const authTest = await web.auth.test();
      this.log(`✅ Slack connection validated: ${authTest.team}`);
    } catch (error) {
      throw new Error(`Slack connection failed: ${error.message}`);
    }

    // Ensure log directory exists
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs', { recursive: true });
      this.log('📁 Created logs directory');
    }

    this.log('✅ Pre-startup checks passed');
  }

  async startSlackBot() {
    this.log('🤖 Starting Slack Bot...');

    return new Promise((resolve, reject) => {
      const bot = spawn('node', ['dist/api/slack/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });

      this.processes.set('slack-bot', bot);

      bot.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.log(`[SLACK-BOT] ${output}`);
        }
      });

      bot.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) {
          this.log(`[SLACK-BOT ERROR] ${error}`, 'error');
        }
      });

      bot.on('close', (code) => {
        this.log(`Slack bot exited with code ${code}`, code === 0 ? 'info' : 'error');
        this.processes.delete('slack-bot');
        
        if (!this.isShuttingDown && code !== 0) {
          this.log('🔄 Restarting Slack bot in 5 seconds...', 'warn');
          setTimeout(() => this.startSlackBot(), 5000);
        }
      });

      // Wait for successful startup
      setTimeout(() => {
        if (this.processes.has('slack-bot')) {
          this.log('✅ Slack bot started successfully');
          resolve();
        } else {
          reject(new Error('Slack bot failed to start'));
        }
      }, 5000);
    });
  }

  async startAPIServer() {
    this.log('🌐 Starting API Server...');

    return new Promise((resolve, reject) => {
      const server = spawn('node', ['dist/api/server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });

      this.processes.set('api-server', server);

      server.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.log(`[API-SERVER] ${output}`);
        }
      });

      server.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) {
          this.log(`[API-SERVER ERROR] ${error}`, 'error');
        }
      });

      server.on('close', (code) => {
        this.log(`API server exited with code ${code}`, code === 0 ? 'info' : 'error');
        this.processes.delete('api-server');
        
        if (!this.isShuttingDown && code !== 0) {
          this.log('🔄 Restarting API server in 5 seconds...', 'warn');
          setTimeout(() => this.startAPIServer(), 5000);
        }
      });

      // Wait for successful startup
      setTimeout(() => {
        if (this.processes.has('api-server')) {
          this.log('✅ API server started successfully');
          resolve();
        } else {
          reject(new Error('API server failed to start'));
        }
      }, 3000);
    });
  }

  async startHealthMonitor() {
    this.log('💗 Starting health monitor...');

    const healthCheck = setInterval(async () => {
      if (this.isShuttingDown) {
        clearInterval(healthCheck);
        return;
      }

      // Check if processes are still running
      const slackBotRunning = this.processes.has('slack-bot');
      const apiServerRunning = this.processes.has('api-server');

      this.healthChecks.set('slack-bot', slackBotRunning);
      this.healthChecks.set('api-server', apiServerRunning);

      // Log health status every 5 minutes
      if (Date.now() % (5 * 60 * 1000) < 30000) {
        this.log(`💗 Health check: Slack Bot=${slackBotRunning}, API=${apiServerRunning}`);
      }

      // Try to restart failed services
      if (!slackBotRunning && !this.isShuttingDown) {
        this.log('🚨 Slack bot is down, attempting restart...', 'warn');
        try {
          await this.startSlackBot();
        } catch (error) {
          this.log(`❌ Failed to restart Slack bot: ${error.message}`, 'error');
        }
      }

      if (!apiServerRunning && !this.isShuttingDown) {
        this.log('🚨 API server is down, attempting restart...', 'warn');
        try {
          await this.startAPIServer();
        } catch (error) {
          this.log(`❌ Failed to restart API server: ${error.message}`, 'error');
        }
      }

    }, 30000); // Check every 30 seconds

    this.log('✅ Health monitor started');
  }

  async notifySlackStartup() {
    this.log('📢 Notifying Slack of successful startup...');

    try {
      const web = new WebClient(process.env.SLACK_BOT_TOKEN);
      
      const startupMessage = {
        channel: process.env.SLACK_CHANNEL_ADMIN || 'admin-alerts',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚀 Second Story System Online'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Production deployment successful!*\n\n` +
                    `• Slack Bot: ✅ Online\n` +
                    `• API Server: ✅ Online\n` +
                    `• Health Monitor: ✅ Active\n` +
                    `• Startup Time: ${new Date().toLocaleString()}\n\n` +
                    `All systems are operational and ready to serve the community! 🎉`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `🤖 Use \`/help\` to see available commands • Monitor system health with \`/admin\``
              }
            ]
          }
        ]
      };

      await web.chat.postMessage(startupMessage);
      this.log('✅ Startup notification sent to Slack');

    } catch (error) {
      this.log(`⚠️  Could not send startup notification: ${error.message}`, 'warn');
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      this.log(`📴 Received ${signal}. Initiating graceful shutdown...`);
      this.isShuttingDown = true;

      // Notify Slack of shutdown
      try {
        const web = new WebClient(process.env.SLACK_BOT_TOKEN);
        await web.chat.postMessage({
          channel: process.env.SLACK_CHANNEL_ADMIN || 'admin-alerts',
          text: '🔄 Second Story system is shutting down for maintenance...'
        });
      } catch (error) {
        this.log(`Could not send shutdown notification: ${error.message}`, 'warn');
      }

      // Stop all processes
      for (const [name, process] of this.processes) {
        this.log(`Stopping ${name}...`);
        process.kill('SIGTERM');
      }

      // Wait for processes to exit
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Force kill if necessary
      for (const [name, process] of this.processes) {
        if (!process.killed) {
          this.log(`Force killing ${name}...`, 'warn');
          process.kill('SIGKILL');
        }
      }

      this.log('✅ Graceful shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    process.on('uncaughtException', (error) => {
      this.log(`💥 Uncaught Exception: ${error.message}`, 'error');
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.log(`💥 Unhandled Rejection: ${reason}`, 'error');
      shutdown('unhandledRejection');
    });
  }

  async start() {
    try {
      this.log('🚀 Starting Second Story Production System...');
      this.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      this.log(`📍 Workspace: ${process.env.SLACK_WORKSPACE || 'straydogsyndi-do42630'}.slack.com`);

      // Setup graceful shutdown first
      this.setupGracefulShutdown();

      // Run pre-startup checks
      await this.preStartupChecks();

      // Start services in sequence
      await this.startAPIServer();
      await this.startSlackBot();

      // Start monitoring
      await this.startHealthMonitor();

      // Notify Slack
      await this.notifySlackStartup();

      this.log('🎉 Second Story system fully operational!');
      this.log('');
      this.log('📊 System Status:');
      this.log('   • Slack Bot: Running');
      this.log('   • API Server: Running');
      this.log('   • Health Monitor: Active');
      this.log('   • Auto-restart: Enabled');
      this.log('');
      this.log('📝 Available Commands:');
      this.log('   • /help - Show command menu');
      this.log('   • /admin - System dashboard');
      this.log('   • /progress - Learner progress');
      this.log('');
      this.log('💡 Logs are being written to ./logs/production.log');
      this.log('🔍 Monitor the #admin-alerts channel for system notifications');

      // Keep the process alive
      this.keepAlive();

    } catch (error) {
      this.log(`💥 Startup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  keepAlive() {
    // Log system status every hour
    setInterval(() => {
      if (!this.isShuttingDown) {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        this.log(`⏰ System uptime: ${hours}h ${minutes}m`);
        
        // Memory usage check
        const memUsage = process.memoryUsage();
        const memMB = Math.round(memUsage.rss / 1024 / 1024);
        this.log(`💾 Memory usage: ${memMB}MB`);
      }
    }, 3600000); // Every hour
  }
}

// Create status endpoint file for health checks
function createStatusEndpoint() {
  const statusFile = path.join(__dirname, '../status.json');
  const status = {
    status: 'starting',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: 0
  };

  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));

  // Update status periodically
  setInterval(() => {
    status.timestamp = new Date().toISOString();
    status.uptime = Math.floor(process.uptime());
    status.status = 'running';
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
  }, 30000);
}

// Start the production system
async function main() {
  createStatusEndpoint();
  
  const manager = new ProductionManager();
  await manager.start();
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Production startup failed:', error);
    process.exit(1);
  });
}

module.exports = { ProductionManager };