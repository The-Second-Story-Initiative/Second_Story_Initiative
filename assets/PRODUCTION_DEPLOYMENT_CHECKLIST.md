# 🚀 Second Story Slack AI Agent - Production Deployment Checklist

## 📋 Pre-Deployment Checklist

### ✅ Infrastructure Requirements
- [ ] **Node.js 18+** installed on production server
- [ ] **Docker** installed (optional but recommended)
- [ ] **PM2** installed for process management (`npm install -g pm2`)
- [ ] **SSL certificate** configured for webhook endpoints
- [ ] **Firewall** configured to allow necessary ports (3000, 443)
- [ ] **Backup strategy** in place for database and configuration

### ✅ Account Setup & API Keys
- [ ] **Slack Workspace Admin Access** to `straydogsyndi-do42630.slack.com`
- [ ] **Slack App Created** at [api.slack.com/apps](https://api.slack.com/apps)
- [ ] **Supabase Project** created and configured
- [ ] **Anthropic API Key** obtained from [console.anthropic.com](https://console.anthropic.com)
- [ ] **GitHub Personal Access Token** (optional, for repo integration)

### ✅ Environment Variables
Copy and configure all required environment variables:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret

# AI Service
ANTHROPIC_API_KEY=your-claude-api-key

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional Services
GITHUB_TOKEN=your-github-token
JWT_SECRET=your-generated-secret

# Channel IDs (replace with actual channel IDs)
SLACK_CHANNEL_GENERAL=C07VCMW6P25
SLACK_CHANNEL_ANNOUNCEMENTS=
SLACK_CHANNEL_STANDUP=
SLACK_CHANNEL_CODEHELP=
SLACK_CHANNEL_JOBS=
SLACK_CHANNEL_RESOURCES=
SLACK_CHANNEL_WINS=
SLACK_CHANNEL_MENTORS=
SLACK_CHANNEL_ADMIN=
SLACK_CHANNEL_MODERATION=

# Application Settings
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

---

## 🔧 Slack App Configuration

### 1. Basic Information
- **App Name:** Second Story AI Assistant
- **Description:** AI-powered assistant for the Second Story coding community
- **Background Color:** #2E7D32 (green)
- **Short Description:** Community support and learning assistant

### 2. OAuth & Permissions
Add these **Bot Token Scopes**:
```
app_mentions:read          # Respond to @mentions
channels:history          # Read channel messages
channels:join             # Auto-join channels
channels:manage           # Manage channel settings
channels:read             # List channels
chat:write                # Send messages
chat:write.customize      # Customize message appearance
chat:write.public         # Send messages to channels bot isn't in
commands                  # Handle slash commands
files:read                # Read uploaded files
files:write               # Upload files
groups:history            # Read private channel messages
groups:read               # List private channels
groups:write              # Send messages to private channels
im:history               # Read DM history
im:read                  # List DMs
im:write                 # Send DMs
links:read               # Access link previews
links:write              # Create link previews
mpim:history             # Read group DM history
mpim:read                # List group DMs
mpim:write               # Send group DMs
pins:read                # Read pinned messages
pins:write               # Pin messages
reactions:read           # Read message reactions
reactions:write          # Add reactions
team:read                # Read team info
usergroups:read          # Read user groups
users:read               # Read user profiles
users:read.email         # Read user email addresses
users:write              # Modify user profiles
```

### 3. Socket Mode
- [ ] **Enable Socket Mode**
- [ ] **Generate App-Level Token** with `connections:write` scope
- [ ] **Save App Token** as `SLACK_APP_TOKEN`

### 4. Slash Commands
Create these slash commands:

| Command | Request URL | Description | Usage Hint |
|---------|-------------|-------------|------------|
| `/help` | https://your-domain.com/slack/commands | Show available commands | Get help |
| `/progress` | https://your-domain.com/slack/commands | View learning progress | Check your stats |
| `/challenge` | https://your-domain.com/slack/commands | Get coding challenge | Get a challenge |
| `/mentor` | https://your-domain.com/slack/commands | Find mentor help | Find a mentor |
| `/pair` | https://your-domain.com/slack/commands | Find coding partner | Pair programming |
| `/standup` | https://your-domain.com/slack/commands | Record daily standup | Daily update |
| `/jobs` | https://your-domain.com/slack/commands | Browse opportunities | Find jobs |
| `/resources` | https://your-domain.com/slack/commands | Learning materials | Get resources |
| `/admin` | https://your-domain.com/slack/commands | Admin dashboard | Admin only |
| `/moderate` | https://your-domain.com/slack/commands | Moderation controls | Moderator only |
| `/report` | https://your-domain.com/slack/commands | Report an issue | Report problem |
| `/stats` | https://your-domain.com/slack/commands | Community statistics | View stats |

### 5. Event Subscriptions
- [ ] **Enable Events**
- [ ] **Request URL:** `https://your-domain.com/slack/events`
- [ ] **Subscribe to Bot Events:**
  - `app_mention`
  - `channel_created`
  - `member_joined_channel`
  - `member_left_channel`
  - `message.channels`
  - `message.groups`
  - `message.im`
  - `message.mpim`
  - `reaction_added`
  - `reaction_removed`
  - `team_join`
  - `user_change`

### 6. Interactive Components
- [ ] **Request URL:** `https://your-domain.com/slack/interactive`

### 7. App Home
- [ ] **Enable Home Tab**
- [ ] **Enable Messages Tab**

---

## 🗄️ Database Setup

### 1. Supabase Configuration
- [ ] Create new Supabase project
- [ ] Copy project URL and service role key
- [ ] Enable Row Level Security (RLS)
- [ ] Configure API settings

### 2. Run Database Migrations
Execute the enhanced schema:
```bash
# Apply the comprehensive database schema
psql -h db.your-project.supabase.co -U postgres -d postgres -f supabase/migrations/enhanced_production_schema.sql
```

### 3. Verify Database Setup
- [ ] All tables created successfully
- [ ] Indexes are in place
- [ ] Views are created
- [ ] RLS policies are active
- [ ] Sample data is inserted

---

## 🚀 Deployment Process

### 1. Automated Deployment (Recommended)
```bash
# Run the automated deployment script
node scripts/production-deploy.js
```

### 2. Manual Deployment
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Run database migrations
npm run db:migrate

# Start the application
npm run start:production
```

### 3. Docker Deployment (Alternative)
```bash
# Build Docker image
docker build -t second-story-bot .

# Run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### 4. PM2 Process Management
```bash
# Start with PM2
pm2 start npm --name "second-story-bot" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 startup script
pm2 startup
```

---

## 🧪 Post-Deployment Testing

### 1. Basic Functionality Tests
- [ ] Bot responds to `/help` command
- [ ] Bot responds to @mentions
- [ ] Welcome message sent to new members
- [ ] Database connections working

### 2. Command Testing
Test each slash command:
- [ ] `/help` - Shows help menu
- [ ] `/progress` - Shows user progress
- [ ] `/challenge` - Provides coding challenge
- [ ] `/mentor` - Connects with mentors
- [ ] `/pair` - Finds pair programming partners
- [ ] `/standup` - Records daily standup
- [ ] `/jobs` - Shows job opportunities
- [ ] `/resources` - Provides learning resources
- [ ] `/admin` - Admin dashboard (admin only)
- [ ] `/moderate` - Moderation panel (moderator only)
- [ ] `/report` - Report system
- [ ] `/stats` - Community statistics

### 3. AI Integration Tests
- [ ] Claude AI responses working
- [ ] Context-aware conversations
- [ ] Appropriate response tone
- [ ] Error handling for AI failures

### 4. Moderation System Tests
- [ ] Spam detection working
- [ ] Banned words filtering
- [ ] AI moderation active
- [ ] Warning system functional
- [ ] Report system working

### 5. Engagement Features Tests
- [ ] Welcome sequence for new users
- [ ] Engagement tracking
- [ ] Achievement system
- [ ] Daily standup reminders
- [ ] Content curation

---

## 📊 Monitoring & Maintenance

### 1. Health Monitoring
- [ ] Application health endpoint (`/health`)
- [ ] Database connection monitoring
- [ ] API rate limit monitoring
- [ ] Error rate tracking

### 2. Logging Configuration
- [ ] Application logs centralized
- [ ] Error logs separated
- [ ] Log rotation configured
- [ ] Monitoring alerts set up

### 3. Backup Strategy
- [ ] Database backup scheduled
- [ ] Configuration backup
- [ ] Log archival process
- [ ] Recovery procedure documented

### 4. Performance Monitoring
- [ ] Response time tracking
- [ ] Memory usage monitoring
- [ ] CPU utilization tracking
- [ ] Slack API rate limits

---

## 🔒 Security Checklist

### 1. Environment Security
- [ ] Environment variables secured
- [ ] No secrets in code repository
- [ ] Secure SSL/TLS configuration
- [ ] Firewall properly configured

### 2. Application Security
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Rate limiting configured

### 3. API Security
- [ ] Slack signature verification
- [ ] API key rotation strategy
- [ ] Access logs monitored
- [ ] Webhook security verified

---

## 🆘 Troubleshooting Guide

### Common Issues and Solutions

#### Bot Not Responding
1. Check if bot is online: `pm2 status`
2. Verify environment variables are set
3. Check Slack app tokens are valid
4. Review application logs

#### Database Connection Issues
1. Verify Supabase credentials
2. Check network connectivity
3. Confirm RLS policies are correct
4. Test database connection manually

#### AI Responses Not Working
1. Verify Anthropic API key
2. Check API rate limits
3. Review error logs for AI service
4. Test with simpler prompts

#### Slack Events Not Received
1. Verify webhook URL is accessible
2. Check SSL certificate validity
3. Review Slack app event subscriptions
4. Test webhook endpoint manually

---

## 📚 Additional Resources

### Documentation
- [Slack Bolt Framework](https://slack.dev/bolt-js/concepts)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [PM2 Process Manager](https://pm2.keymetrics.io/)

### Community Support
- Second Story Initiative GitHub Issues
- Slack App Development Community
- Supabase Community Discord

### Monitoring Tools
- [Uptime Robot](https://uptimerobot.com/) - Free uptime monitoring
- [Sentry](https://sentry.io/) - Error tracking
- [DataDog](https://www.datadoghq.com/) - Performance monitoring

---

## ✅ Final Verification

Once deployment is complete, verify these items:

- [ ] All environment variables are properly set
- [ ] Slack app is installed and configured
- [ ] Database schema is applied and working
- [ ] Bot responds to all commands
- [ ] AI integration is functional
- [ ] Moderation system is active
- [ ] Monitoring is in place
- [ ] Backup strategy is implemented
- [ ] Security measures are applied
- [ ] Documentation is updated

**🎉 Congratulations! Your Second Story Slack AI Agent is now live and ready to serve your community!**

---

*For additional support or questions, please refer to the project documentation or create an issue in the GitHub repository.*
