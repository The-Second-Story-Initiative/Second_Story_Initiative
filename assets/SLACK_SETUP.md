# 🚀 Second Story Slack Ecosystem Setup Guide

This guide will help you deploy the complete Second Story Slack ecosystem for the StrayDog Syndications workspace.

## 🎯 Overview

The Second Story Slack ecosystem includes:
- **AI-Powered Slack Bot** with Claude integration
- **Content Aggregation System** for tech news, jobs, and resources
- **Progress Tracking & Analytics** via Supabase
- **Admin Monitoring Dashboard** for system health
- **Automated Workflows** with scheduling

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] A Slack workspace (straydogsyndi-do42630.slack.com)
- [ ] Supabase account and project
- [ ] Anthropic API key (Claude)
- [ ] GitHub personal access token
- [ ] Admin access to your Slack workspace

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/SecondStoryInitiative/your-repo
cd Second_Story_Initiative

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and fill in your actual values:

```bash
# Open in your favorite editor
code .env
# or
nano .env
```

**Required Values:**
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN`
- `GITHUB_TOKEN`

### 3. Set Up Supabase Database

```bash
# Run the database setup script
npm run setup:database

# Or manually execute the SQL
# Copy api/slack/database/schema.sql to Supabase SQL Editor
```

### 4. Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name: "Second Story Assistant"
4. Workspace: Select your StrayDog workspace

#### Configure OAuth Scopes

Add these Bot Token Scopes:
```
app_mentions:read
channels:history
channels:read
chat:write
commands
groups:history
groups:read
im:history
im:read
im:write
reactions:read
team:read
users:read
users:read.email
```

#### Enable Socket Mode

1. Go to Socket Mode in your app settings
2. Enable Socket Mode
3. Generate an App-Level Token with `connections:write` scope
4. Copy the token (starts with `xapp-`)

#### Create Slash Commands

Add these commands in the "Slash Commands" section:

| Command | Description | Usage Hint |
|---------|-------------|------------|
| `/help` | Show available commands | Show help menu |
| `/progress` | View learning progress | Check your progress |
| `/challenge` | Get personalized challenge | Get a coding challenge |
| `/mentor` | Get mentor help | [topic] or leave empty to match |
| `/pair` | Find pair programming partner | [skill] Find coding partner |
| `/standup` | Record daily standup | [update] Record your progress |
| `/jobs` | Browse job opportunities | [keywords] Find relevant jobs |
| `/resources` | Find learning resources | [topic] Get learning materials |
| `/admin` | Admin dashboard | Admin only - system status |

#### Install to Workspace

1. Go to "Install App" in sidebar
2. Click "Install to Workspace"
3. Authorize the permissions
4. Copy the Bot User OAuth Token (starts with `xoxb-`)

### 5. Get Slack Channel IDs

To find channel IDs:
1. Open Slack in browser
2. Right-click on a channel
3. Select "Copy link"
4. The ID is the last part: `/archives/C1234567890` → `C1234567890`

Update your `.env` with the actual channel IDs.

### 6. Start the Services

```bash
# Development mode (API + Slack bot)
npm run dev:full

# Or start individually
npm run server:dev  # API server only
npm run slack:dev   # Slack bot only

# Production mode with Docker
docker-compose up -d
```

### 7. Test the Bot

In your Slack workspace:
1. Type `/help` in any channel
2. Mention the bot: `@Second Story Assistant hello`
3. Check admin dashboard: `/admin` (if you're an admin)

## 📚 Detailed Setup Instructions

### Supabase Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note the URL and keys

2. **Run Database Schema**
   ```bash
   # Automated setup (preferred)
   npm run setup:database
   
   # Manual setup
   # 1. Copy contents of api/slack/database/schema.sql
   # 2. Paste in Supabase SQL Editor
   # 3. Execute the commands
   ```

3. **Verify Setup**
   ```bash
   # Check if tables exist
   npm run test:database
   ```

### Slack App Configuration

#### Event Subscriptions

1. Enable Event Subscriptions
2. Request URL: `https://your-domain.com/api/slack/events`
3. Subscribe to Bot Events:
   - `app_mention`
   - `team_join`
   - `reaction_added`

#### Interactive Components

1. Enable Interactive Components
2. Request URL: `https://your-domain.com/api/slack/interactive`

#### Slash Commands Request URL

Set all slash commands to: `https://your-domain.com/api/slack/commands`

### Content Aggregation APIs

#### News API (Optional)
1. Get key from [newsapi.org](https://newsapi.org)
2. Add to `NEWS_API_KEY` in `.env`

#### n8n Workflows (Optional)
1. Set up n8n instance (included in Docker Compose)
2. Access at `http://localhost:5678`
3. Import workflow templates from `workflows/` directory

## 🔧 Advanced Configuration

### Environment-Specific Settings

#### Development
```env
NODE_ENV=development
SLACK_WORKSPACE=straydogsyndi-do42630
FRONTEND_URL=http://localhost:5173
```

#### Production
```env
NODE_ENV=production
SLACK_WORKSPACE=straydogsyndi-do42630
FRONTEND_URL=https://your-domain.com
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/private.key
```

### Custom Channel Configuration

You can customize which channels the bot uses by updating the channel IDs in your `.env`:

```env
SLACK_CHANNEL_GENERAL=C01234567890      # Main community
SLACK_CHANNEL_ANNOUNCEMENTS=C01234567891 # Important updates
SLACK_CHANNEL_STANDUP=C01234567892       # Daily check-ins
SLACK_CHANNEL_CODEHELP=C01234567893      # Technical support
SLACK_CHANNEL_JOBS=C01234567894          # Job opportunities
SLACK_CHANNEL_RESOURCES=C01234567895     # Learning materials
SLACK_CHANNEL_WINS=C01234567896          # Celebrations
SLACK_CHANNEL_MENTORS=C01234567897       # Mentor matching
SLACK_CHANNEL_PAIR=C01234567898          # Pair programming
SLACK_CHANNEL_ADMIN=C01234567899         # Admin alerts (private)
```

### Scheduling Configuration

The bot includes automated tasks:

- **Daily 8:30 AM**: Standup reminders
- **Daily 9:00 AM**: Morning motivation
- **Daily 8 AM, 12 PM, 5 PM**: Tech news sharing
- **Monday 10 AM**: Weekly challenges
- **Tuesday/Thursday 11 AM**: Job board updates
- **Every hour**: System health checks
- **Sunday 8 PM**: Weekly admin reports

Modify schedules in `api/slack/SlackBrain.ts`.

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# Production deployment
docker-compose up -d

# With custom environment
docker-compose --env-file .env.production up -d

# View logs
docker-compose logs -f slack-bot
```

### Option 2: PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start ecosystem.config.js

# Monitor
pm2 monit
```

### Option 3: Vercel + Railway

- Deploy API to Vercel
- Deploy Slack bot to Railway
- Use managed Redis (Upstash)

### Option 4: Manual Server Setup

```bash
# On your server
git clone your-repo
cd Second_Story_Initiative
npm install
npm run build

# Set up systemd service
sudo cp deployment/slack-bot.service /etc/systemd/system/
sudo systemctl enable slack-bot
sudo systemctl start slack-bot
```

## 🛠️ Troubleshooting

### Common Issues

#### Bot Not Responding
1. Check Slack app tokens in `.env`
2. Verify Socket Mode is enabled
3. Check bot permissions/scopes
4. Review logs: `docker-compose logs slack-bot`

#### Database Connection Errors
1. Verify Supabase URL and keys
2. Check database schema is applied
3. Test connection: `npm run test:database`

#### Content Aggregation Not Working
1. Check News API key
2. Verify internet connectivity
3. Review API rate limits

#### Commands Not Working
1. Verify slash commands are created in Slack app
2. Check request URLs are correct
3. Ensure proper permissions

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
LOG_LEVEL=debug
SLACK_LOG_LEVEL=debug
```

### Health Checks

Monitor system health:

```bash
# API health
curl http://localhost:3001/api/health

# Slack integration health
curl http://localhost:3001/api/slack/health

# Database health
npm run test:database
```

## 📊 Monitoring & Analytics

### Built-in Admin Dashboard

Access via `/admin` command in Slack or API endpoint:
- System health status
- Learner engagement metrics
- At-risk learner identification
- Error rate monitoring

### External Monitoring (Optional)

#### Sentry Error Tracking
```env
SENTRY_DSN=your_sentry_dsn
```

#### Uptime Monitoring
Set up external monitoring for:
- `https://your-domain.com/api/health`
- `https://your-domain.com/api/slack/health`

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use different keys for dev/prod
   - Rotate tokens regularly

2. **Slack App Security**
   - Enable request verification
   - Use least-privilege permissions
   - Monitor app usage

3. **Database Security**
   - Use Row Level Security (RLS)
   - Limit service role usage
   - Regular backups

4. **API Security**
   - Rate limiting enabled
   - CORS configured
   - Input validation

## 📈 Scaling Considerations

### High Traffic Optimization
- Enable Redis caching
- Use database connection pooling
- Implement request queuing

### Multi-Workspace Support
- Environment variable per workspace
- Separate database schemas
- Workspace-specific configurations

## 🤝 Support & Contributing

### Getting Help
1. Check this documentation
2. Review troubleshooting section
3. Check GitHub issues
4. Contact the development team

### Contributing
1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## 📝 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🎉 Success!

If everything is set up correctly, you should see:
- ✅ Bot responding to `/help` command
- ✅ AI responses to @mentions
- ✅ Automated content sharing
- ✅ Admin dashboard accessible
- ✅ Progress tracking working

Welcome to the Second Story Slack ecosystem! 🚀