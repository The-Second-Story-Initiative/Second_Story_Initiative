# 🚀 Slack Bot Deployment Guide - StrayDog Syndications

## Current Status ✅
- ✅ Supabase database configured
- ✅ Slack app created (Client ID: 7829598903860.9273920071329)
- ✅ Environment partially configured
- 🔄 **NEXT: Get bot tokens and configure channels**

## 🎯 Quick 30-Minute Deployment

### Step 1: Get Your Bot Tokens (10 minutes)

Your Slack app is already created! Now get the missing tokens:

1. **Go to your Slack app**: https://api.slack.com/apps/A0981T239P
   - This is your existing "Second Story Brain" app

2. **Get Bot Token**:
   - Click "OAuth & Permissions" in the sidebar
   - Scroll to "Bot Token Scopes" and add these scopes:
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
     files:write
     ```
   - Click "Install to Workspace" → "Allow"
   - Copy the **Bot User OAuth Token** (starts with `xoxb-`)

3. **Enable Socket Mode & Get App Token**:
   - Click "Socket Mode" in sidebar
   - Toggle "Enable Socket Mode" to ON
   - Click "Generate Token and Scopes"
   - Token Name: "Production"
   - Add scope: `connections:write`
   - Click "Generate"
   - Copy the **App-Level Token** (starts with `xapp-`)

4. **Create Slash Commands**:
   - Click "Slash Commands" in sidebar
   - Create these commands (Request URL: `https://your-domain.com/api/slack/commands`):
     - `/help` - Show available commands
     - `/progress` - View learning progress
     - `/challenge` - Get personalized challenge
     - `/mentor` - Get mentor help
     - `/pair` - Find pair programming partner
     - `/standup` - Record daily standup
     - `/jobs` - Browse job opportunities
     - `/resources` - Find learning resources
     - `/admin` - Admin dashboard

### Step 2: Get Channel IDs (5 minutes)

In your StrayDog Syndications Slack workspace:

1. **Open Slack in browser**: https://straydogsyndi-do42630.slack.com
2. **For each channel**, right-click → "Copy link"
3. **Extract the ID** from the URL: `/archives/C1234567890` → `C1234567890`

**Required Channels** (create if they don't exist):
- `#general` → SLACK_CHANNEL_GENERAL
- `#announcements` → SLACK_CHANNEL_ANNOUNCEMENTS
- `#daily-standup` → SLACK_CHANNEL_STANDUP
- `#code-help` → SLACK_CHANNEL_CODEHELP
- `#job-board` → SLACK_CHANNEL_JOBS
- `#resources` → SLACK_CHANNEL_RESOURCES
- `#celebrations` → SLACK_CHANNEL_WINS
- `#mentor-connect` → SLACK_CHANNEL_MENTORS
- `#pair-programming` → SLACK_CHANNEL_PAIR
- `#admin-alerts` → SLACK_CHANNEL_ADMIN (private)

### Step 3: Update Environment (2 minutes)

Replace these values in your `.env` file:

```env
# Replace these with your actual tokens:
SLACK_BOT_TOKEN=xoxb-your-actual-bot-token-here
SLACK_APP_TOKEN=xapp-your-actual-app-token-here

# Replace with actual channel IDs:
SLACK_CHANNEL_GENERAL=C_YOUR_GENERAL_ID
SLACK_CHANNEL_ANNOUNCEMENTS=C_YOUR_ANNOUNCEMENTS_ID
SLACK_CHANNEL_STANDUP=C_YOUR_STANDUP_ID
SLACK_CHANNEL_CODEHELP=C_YOUR_CODEHELP_ID
SLACK_CHANNEL_JOBS=C_YOUR_JOBS_ID
SLACK_CHANNEL_RESOURCES=C_YOUR_RESOURCES_ID
SLACK_CHANNEL_WINS=C_YOUR_WINS_ID
SLACK_CHANNEL_MENTORS=C_YOUR_MENTORS_ID
SLACK_CHANNEL_PAIR=C_YOUR_PAIR_ID
SLACK_CHANNEL_ADMIN=C_YOUR_ADMIN_ID

# Add your Claude API key:
ANTHROPIC_API_KEY=sk-ant-your-actual-claude-key
```

### Step 4: Launch the Bot (5 minutes)

```bash
# Test the Slack bot
npm run slack:dev
```

**Expected output:**
```
⚡️ Bolt app is running on socket mode!
🧠 Second Story Brain is online and ready!
📊 Connected to Supabase database
🔗 Socket connection established
```

### Step 5: Test Everything (8 minutes)

1. **In Slack, test commands**:
   - `/help` - Should show command menu
   - `/progress` - Should show learning progress
   - `@Second Story Brain hello` - Should respond with AI

2. **Check automated features**:
   ```bash
   # Test morning motivation
   npm run test:task morning-motivation
   
   # Test standup reminder
   npm run test:task standup-reminder
   ```

## 🎉 Success Indicators

✅ **Bot responds to `/help` command**
✅ **Bot responds to @mentions with AI responses**
✅ **Admin dashboard accessible via `/admin`**
✅ **Automated messages appear in correct channels**
✅ **No errors in console logs**

## 🚨 Troubleshooting

**Bot not responding?**
- Check tokens are correct in `.env`
- Verify Socket Mode is enabled
- Ensure bot is installed to workspace

**Commands not working?**
- Verify slash commands are created in Slack app
- Check Request URLs point to your domain
- Ensure bot has proper OAuth scopes

**Database errors?**
- Run `npm run setup:database` again
- Check Supabase credentials in `.env`

## 🎯 What Happens Next

Once deployed, your bot will automatically:
- **8:30 AM daily**: Send standup reminders
- **9:00 AM daily**: Post morning motivation
- **Throughout day**: Answer questions with Claude AI
- **New members**: Automatic onboarding
- **Twice weekly**: Post curated job opportunities
- **24/7**: Monitor and log to #admin-alerts

**Your workload reduction starts immediately!** 🚀

---

**Need help?** Check the full documentation in `SLACK_SETUP.md` or run `/admin` for system status.