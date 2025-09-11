# 🚀 Second Story Slack AI Agent - Windows Setup Guide

## ⚠️ Prerequisites Installation Required

Your system needs Node.js and npm to run the Slack AI agent. Here's how to get everything set up:

## 📥 Step 1: Install Node.js

### Option A: Download from Official Website (Recommended)
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS version** (currently 18.x or newer)
3. Run the installer with default settings
4. Restart your PowerShell/Terminal

### Option B: Using Windows Package Manager (winget)
```powershell
winget install OpenJS.NodeJS
```

### Option C: Using Chocolatey (if you have it)
```powershell
choco install nodejs
```

## ✅ Step 2: Verify Installation

After installing Node.js, restart your PowerShell and run:
```powershell
node --version
npm --version
```

You should see version numbers like:
```
v18.19.0
9.2.0
```

## 🚀 Step 3: Install Project Dependencies

Once Node.js is installed, run these commands in your project directory:

```powershell
# Install all dependencies
npm install

# Verify everything is working
npm run test
```

## 🤖 Step 4: Quick Start Your Slack Bot

Once dependencies are installed, you can start the bot with:

### For Development/Testing:
```powershell
npm run quick-start
```

### For Full Production Deployment:
```powershell
npm run deploy:production
```

## 🔧 Troubleshooting

### If npm commands still don't work:
1. **Restart your computer** after installing Node.js
2. **Check your PATH**: Node.js should be in your system PATH
3. **Try running as Administrator** if you get permission errors

### If you get permission errors:
```powershell
# Set execution policy (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### If installation fails:
1. Make sure you have at least **4GB of free disk space**
2. Disable antivirus temporarily during installation
3. Try installing with **Administrator privileges**

## 🎯 What Happens Next

Once Node.js is installed and you run `npm install`:

1. ✅ All dependencies will be downloaded
2. ✅ Tailwind CSS errors will be resolved
3. ✅ Project will be ready for development
4. ✅ You can start the Slack bot immediately

## 🚀 Expected Timeline

- **Node.js Installation**: 5-10 minutes
- **Dependencies Installation**: 2-5 minutes
- **Bot Configuration**: 10-15 minutes
- **Total Setup Time**: 20-30 minutes

## 📞 Next Steps After Installation

1. **Install Node.js** using one of the methods above
2. **Restart PowerShell**
3. **Run `npm install`** in your project directory
4. **Follow the deployment guide** in `IMPLEMENTATION_SUMMARY.md`

---

## 🎉 Why This Setup is Worth It

Once you complete this setup, you'll have:
- ✅ **Autonomous 24/7 moderation** for your Slack workspace
- ✅ **AI-powered member engagement** and onboarding
- ✅ **Automated content curation** and job posting
- ✅ **Real-time analytics** and community health monitoring
- ✅ **Zero ongoing maintenance** required

The 20-30 minutes of setup will save you **hours of manual work every week**!

---

*Need help? Check the troubleshooting section above or consult the Node.js documentation.*
