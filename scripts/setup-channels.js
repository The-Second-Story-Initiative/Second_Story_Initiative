/**
 * Channel Setup Script for Second Story Slack Ecosystem
 * Automatically creates and configures all required Slack channels
 */

const { WebClient } = require('@slack/web-api');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const web = new WebClient(process.env.SLACK_BOT_TOKEN);

const channels = [
  {
    name: 'general',
    purpose: 'Main community hub for all learners and mentors',
    topic: 'Welcome to Second Story Initiative! 🚀 Ask questions, share wins, get help.',
    is_private: false,
    auto_add_bot: true
  },
  {
    name: 'announcements',
    purpose: 'Important updates and news from the Second Story team',
    topic: '📢 Official announcements and program updates',
    is_private: false,
    auto_add_bot: true
  },
  {
    name: 'daily-standup',
    purpose: 'Daily check-ins and progress updates from learners',
    topic: '🌅 Share your daily progress: What did you accomplish? What are you working on today?',
    is_private: false,
    auto_add_bot: true
  },
  {
    name: 'code-help',
    purpose: 'Get technical assistance and help with coding challenges',
    topic: '💻 Stuck on code? Ask here! Share code snippets, errors, and get help from mentors and peers.',
    is_private: false,
    auto_add_bot: true
  },
  {
    name: 'job-board',
    purpose: 'Curated job opportunities and career advice',
    topic: '💼 Job opportunities, career advice, and networking. Updated twice weekly with curated positions.',
    is_private: false,
    auto_add_bot: true
  },
  {
    name: 'resources',
    purpose: 'Learning materials, tutorials, and educational content',
    topic: '📚 Curated learning resources, tutorials, articles, and educational content. Updated daily.',
    is_private: false,
    auto_add_bot: true
  },
  {
    name: 'celebrations',
    purpose: 'Celebrate wins, achievements, and milestones',
    topic: '🎉 Share your wins! Completed challenges, job offers, skill milestones - celebrate here!',
    is_private: false,
    auto_add_bot: true
  },
  {
    name: 'mentor-connect',
    purpose: 'Connect with mentors and schedule mentoring sessions',
    topic: '👥 Connect with mentors, schedule sessions, and get guidance on your learning journey.',
    is_private: false,
    auto_add_bot: true
  },
  {
    name: 'pair-programming',
    purpose: 'Find coding partners and coordinate pair programming sessions',
    topic: '👨‍💻👩‍💻 Find coding partners, schedule pair programming sessions, and collaborate on projects.',
    is_private: false,
    auto_add_bot: true
  },
  {
    name: 'admin-alerts',
    purpose: 'System monitoring and administrative notifications',
    topic: '🔧 System health monitoring and admin notifications (restricted to admins)',
    is_private: true,
    auto_add_bot: true
  }
];

async function setupChannels() {
  console.log('🚀 Starting Second Story Slack channel setup...');
  console.log(`📍 Workspace: ${process.env.SLACK_WORKSPACE || 'straydogsyndi-do42630'}.slack.com`);
  console.log('');

  const results = {
    created: [],
    existing: [],
    errors: [],
    channelIds: {}
  };

  for (const channel of channels) {
    try {
      console.log(`Creating #${channel.name}...`);
      
      // Try to create the channel
      const result = await web.conversations.create({
        name: channel.name,
        is_private: channel.is_private || false
      });

      console.log(`✅ Created #${channel.name} (${result.channel.id})`);
      results.created.push(channel.name);
      results.channelIds[channel.name] = result.channel.id;

      // Set purpose if provided
      if (channel.purpose) {
        await web.conversations.setPurpose({
          channel: result.channel.id,
          purpose: channel.purpose
        });
      }

      // Set topic if provided
      if (channel.topic) {
        await web.conversations.setTopic({
          channel: result.channel.id,
          topic: channel.topic
        });
      }

      // Add bot to channel if needed
      if (channel.auto_add_bot) {
        try {
          await web.conversations.join({
            channel: result.channel.id
          });
          console.log(`   🤖 Bot added to #${channel.name}`);
        } catch (joinError) {
          if (joinError.data?.error !== 'already_in_channel') {
            console.log(`   ⚠️  Could not add bot to #${channel.name}: ${joinError.message}`);
          }
        }
      }

    } catch (error) {
      if (error.data?.error === 'name_taken') {
        console.log(`ℹ️  #${channel.name} already exists`);
        results.existing.push(channel.name);

        // Get existing channel info
        try {
          const channelInfo = await web.conversations.list();
          const existingChannel = channelInfo.channels.find(ch => ch.name === channel.name);
          if (existingChannel) {
            results.channelIds[channel.name] = existingChannel.id;
          }
        } catch (listError) {
          console.log(`   ⚠️  Could not get info for existing #${channel.name}`);
        }
      } else {
        console.error(`❌ Error creating #${channel.name}:`, error.message);
        results.errors.push({ channel: channel.name, error: error.message });
      }
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('');
  console.log('📊 Setup Summary:');
  console.log(`✅ Created: ${results.created.length} channels`);
  console.log(`ℹ️  Existing: ${results.existing.length} channels`);
  console.log(`❌ Errors: ${results.errors.length} channels`);
  console.log('');

  if (results.errors.length > 0) {
    console.log('❌ Errors encountered:');
    results.errors.forEach(err => {
      console.log(`   #${err.channel}: ${err.error}`);
    });
    console.log('');
  }

  // Generate environment variables for channel IDs
  console.log('🔧 Environment Variables for .env file:');
  console.log('# Add these channel IDs to your .env file:');
  Object.entries(results.channelIds).forEach(([name, id]) => {
    const envName = `SLACK_CHANNEL_${name.toUpperCase().replace(/-/g, '_')}`;
    console.log(`${envName}=${id}`);
  });
  console.log('');

  // Save channel IDs to a file for reference
  const fs = require('fs');
  const channelConfig = {
    timestamp: new Date().toISOString(),
    workspace: process.env.SLACK_WORKSPACE || 'straydogsyndi-do42630',
    channels: results.channelIds,
    setup_results: results
  };

  fs.writeFileSync('./channel-config.json', JSON.stringify(channelConfig, null, 2));
  console.log('💾 Channel configuration saved to channel-config.json');

  console.log('');
  console.log('🎉 Channel setup complete!');
  console.log('Next steps:');
  console.log('1. Copy the environment variables above to your .env file');
  console.log('2. Restart your Slack bot to pick up the new channel IDs');
  console.log('3. Test the bot in each channel with /help');
  console.log('');

  return results;
}

// Error handling and validation
async function validateSetup() {
  if (!process.env.SLACK_BOT_TOKEN) {
    console.error('❌ SLACK_BOT_TOKEN not found in environment variables');
    console.log('Please add your bot token to the .env file and try again');
    process.exit(1);
  }

  try {
    // Test bot token validity
    const authTest = await web.auth.test();
    console.log(`✅ Bot token valid for workspace: ${authTest.team}`);
    console.log(`🤖 Bot user: ${authTest.user} (${authTest.user_id})`);
    console.log('');
  } catch (error) {
    console.error('❌ Bot token validation failed:', error.message);
    console.log('Please check your SLACK_BOT_TOKEN and try again');
    process.exit(1);
  }
}

// Run the setup
async function main() {
  try {
    await validateSetup();
    await setupChannels();
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { setupChannels, validateSetup };