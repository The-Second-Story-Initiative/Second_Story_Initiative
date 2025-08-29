# 🔧 Create Slash Commands in Your Slack App

## 🎯 Quick Setup - Add All Commands in 5 Minutes

### 📍 Go to Your Slack App
**Click here:** https://api.slack.com/apps/A0981T239P/slash-commands

---

## ⚡ Commands to Create

### 1. `/help` - Show Available Commands
- **Command**: `/help`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `Show available commands and help menu`
- **Usage Hint**: `[optional: command name for specific help]`

### 2. `/progress` - View Learning Progress
- **Command**: `/progress`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `View your learning progress and statistics`
- **Usage Hint**: `[optional: timeframe like 'week' or 'month']`

### 3. `/challenge` - Get Coding Challenge
- **Command**: `/challenge`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `Get a personalized coding challenge`
- **Usage Hint**: `[optional: difficulty level or topic]`

### 4. `/mentor` - Get Mentor Help
- **Command**: `/mentor`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `Connect with a mentor or get mentoring help`
- **Usage Hint**: `[topic] or leave empty for general mentoring`

### 5. `/pair` - Find Pair Programming Partner
- **Command**: `/pair`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `Find a pair programming partner`
- **Usage Hint**: `[optional: technology or project type]`

### 6. `/standup` - Daily Standup
- **Command**: `/standup`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `Record your daily standup or start team standup`
- **Usage Hint**: `[yesterday] [today] [blockers] or 'start' for team standup`

### 7. `/jobs` - Browse Job Opportunities
- **Command**: `/jobs`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `Browse job opportunities and career resources`
- **Usage Hint**: `[optional: search term or location]`

### 8. `/resources` - Learning Resources
- **Command**: `/resources`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `Find learning resources and materials`
- **Usage Hint**: `[optional: topic or technology]`

### 9. `/admin` - Admin Dashboard
- **Command**: `/admin`
- **Request URL**: `https://your-domain.com/api/slack/commands`
- **Short Description**: `Access admin dashboard and system status`
- **Usage Hint**: `[optional: 'status', 'metrics', or 'alerts']`

---

## 🚀 For Local Testing (Development)

### Using ngrok for Local Development
If you're testing locally, use ngrok to create a public URL:

```bash
# Install ngrok if you haven't
npm install -g ngrok

# Start your local server
npm run slack:dev

# In another terminal, expose port 3001
ngrok http 3001
```

**Use the ngrok URL for Request URL:**
`https://abc123.ngrok.io/api/slack/commands`

---

## 🔧 Step-by-Step Creation Process

### For Each Command:
1. **Click "Create New Command"**
2. **Fill in the details** (copy from above)
3. **Set Request URL** to your domain + `/api/slack/commands`
4. **Click "Save"**

### ⚠️ Important Notes:
- **All commands use the same Request URL**: `/api/slack/commands`
- **The bot code handles routing** based on the command name
- **Escape to workspace** should be **enabled** for all commands
- **Usage hints** help users understand command syntax

---

## 🎯 Production Request URLs

### If deploying to Vercel:
`https://your-app.vercel.app/api/slack/commands`

### If deploying to Railway:
`https://your-app.railway.app/api/slack/commands`

### If deploying to Heroku:
`https://your-app.herokuapp.com/api/slack/commands`

### If using custom domain:
`https://your-domain.com/api/slack/commands`

---

## ✅ Verification

After creating all commands, you should see:
- **9 slash commands** in your Slack app
- **All pointing to the same endpoint**
- **Each with appropriate descriptions**

### Test Commands:
1. Go to any channel in your Slack workspace
2. Type `/` and you should see all your commands
3. Try `/help` first to verify everything works

---

## 🚨 Troubleshooting

### Commands not appearing?
- **Reinstall the app** to your workspace
- **Check OAuth scopes** include `commands`
- **Verify Request URL** is accessible

### Commands returning errors?
- **Check your server logs** for error details
- **Verify environment variables** are set correctly
- **Test the endpoint** directly with curl or Postman

### Testing endpoint manually:
```bash
curl -X POST https://your-domain.com/api/slack/commands \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "command=/help&text=&user_id=U123&channel_id=C123"
```

---

## 🎉 You're All Set!

Once all commands are created:
1. **Test each command** in Slack
2. **Verify responses** are working
3. **Check logs** for any errors
4. **Enjoy your automated Slack workspace!**

Your community members can now use all these powerful commands to get help, track progress, find mentors, and much more! 🚀