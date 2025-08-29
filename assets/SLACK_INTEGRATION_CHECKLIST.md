# 🚀 Slack Integration Completion Checklist

## ✅ What's Already Done
- [x] Slack app created with App ID: `A0981T239P`
- [x] Client ID and Secret configured
- [x] Signing Secret configured
- [x] Complete Slack ecosystem code implemented

## 🔧 Next Steps to Complete Integration

### 1. Get Your Bot Token
1. In your Slack app dashboard, go to **"OAuth & Permissions"**
2. Scroll down to **"Bot Token Scopes"** and add these scopes:
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
3. Click **"Install App to Workspace"**
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
5. Update your `.env` file:
   ```
   SLACK_BOT_TOKEN=xoxb-your-actual-bot-token-here
   ```

### 2. Enable Socket Mode and Get App Token
1. Go to **"Socket Mode"** in your app settings
2. Enable Socket Mode
3. Click **"Generate an app-level token"**
4. Name it "socket_token" and give it `connections:write` scope
5. Copy the token (starts with `xapp-`)
6. Update your `.env` file:
   ```
   SLACK_APP_TOKEN=xapp-your-actual-app-token-here
   ```

### 3. Create Slash Commands
In your Slack app, go to **"Slash Commands"** and create these commands:

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

**Request URL for all commands:** `https://your-domain.com/api/slack/commands`

### 4. Set Up Event Subscriptions
1. Go to **"Event Subscriptions"** in your app
2. Enable Events
3. Set Request URL: `https://your-domain.com/api/slack/events`
4. Subscribe to these Bot Events:
   - `app_mention`
   - `team_join`
   - `reaction_added`

### 5. Get Channel IDs
For each channel in your workspace, right-click and select "Copy link". The channel ID is at the end of the URL.

Update these in your `.env` file:
```bash
SLACK_CHANNEL_GENERAL=C_YOUR_GENERAL_CHANNEL_ID
SLACK_CHANNEL_ANNOUNCEMENTS=C_YOUR_ANNOUNCEMENTS_ID
SLACK_CHANNEL_STANDUP=C_YOUR_STANDUP_ID
SLACK_CHANNEL_CODEHELP=C_YOUR_CODEHELP_ID
SLACK_CHANNEL_JOBS=C_YOUR_JOBS_ID
SLACK_CHANNEL_RESOURCES=C_YOUR_RESOURCES_ID
SLACK_CHANNEL_WINS=C_YOUR_WINS_ID
SLACK_CHANNEL_MENTORS=C_YOUR_MENTORS_ID
SLACK_CHANNEL_PAIR=C_YOUR_PAIR_ID
SLACK_CHANNEL_ADMIN=C_YOUR_ADMIN_ID
```

### 6. Install Required Dependencies
```bash
npm install
```

### 7. Set Up Database
```bash
npm run setup:database
```

### 8. Test the Integration
```bash
# Start the development server
npm run dev:full

# Or start just the Slack bot
npm run slack:dev
```

### 9. Test in Slack
1. Type `/help` in any channel
2. Try `@Second Story Assistant hello` (mention your bot)
3. Test other commands like `/progress` or `/challenge`

## 🔍 Troubleshooting

### Bot Not Responding
- Check that both `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` are correct
- Verify Socket Mode is enabled
- Check that the bot is installed in your workspace

### Commands Not Working
- Verify slash commands are created in your Slack app
- Check the Request URL is correct
- Ensure your app has the right OAuth scopes

### Database Errors
- Run `npm run test:database` to check connection
- Verify Supabase credentials are correct
- Check if database schema is applied

## 🎉 Success Indicators

You'll know everything is working when:
- [ ] `/help` command shows the full command list
- [ ] Bot responds to @mentions with AI-powered answers
- [ ] Admin dashboard accessible via `/admin`
- [ ] Progress tracking works via `/progress`
- [ ] Content sharing happens automatically (check logs)

## 📞 Need Help?

If you encounter any issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Test the database connection
4. Review the Slack app configuration

Your Slack ecosystem is almost ready! Complete these steps and you'll have a fully automated, AI-powered learning community. 🚀