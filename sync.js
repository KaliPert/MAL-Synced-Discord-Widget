require('dotenv').config();
const axios = require('axios');

const POLL_INTERVAL_MS = 15 * 60 * 1000;
const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';
const DISCORD_API_BASE_URL = 'https://discord.com/api/v9';

const config = {
  malUsername: process.env.MAL_USERNAME?.trim(),
  discordBotToken: process.env.DISCORD_BOT_TOKEN?.trim(),
  applicationId: process.env.APPLICATION_ID?.trim(),
  discordUserId: (process.env.DISCORD_USER_ID || '').replace(/\D/g, '')
};

function validateConfig() {
  const missing = [];

  if (!config.malUsername) missing.push('MAL_USERNAME');
  if (!config.discordBotToken) missing.push('DISCORD_BOT_TOKEN');
  if (!config.applicationId) missing.push('APPLICATION_ID');
  if (!config.discordUserId) missing.push('DISCORD_USER_ID');

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

const USER_AGENT = 'mal-discord-widget-sync/1.0.0 (https://github.com/7Games/mal-discord-widget)';

function formatJoinDate(joinedAt) {
  if (!joinedAt) {
    return 'Joined: Unknown';
  }

  return `Joined: ${new Date(joinedAt).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}`;
}

function formatDaysWatched(daysWatched) {
  const parsed = Number.parseFloat(daysWatched);
  const value = Number.isNaN(parsed) ? 0 : parsed;
  return `Days watched: ${value.toFixed(1)}`;
}

function toInteger(value) {
  return Number.parseInt(value ?? 0, 10) || 0;
}

function buildWidgetPayload(stats) {
  return {
    username: stats.username,
    data: {
      dynamic: [
        { type: 1, name: 'joindate', value: stats.joinDate },
        { type: 1, name: 'dayswatched', value: stats.daysWatched },
        { type: 1, name: 'watching', value: stats.watching },
        { type: 2, name: 'plantowatch', value: stats.planToWatch },
        { type: 2, name: 'completed', value: stats.completed },
        { type: 2, name: 'dropped', value: stats.dropped },
        { type: 2, name: 'onhold', value: stats.onHold },
        { type: 2, name: 'totalwatched', value: stats.totalWatched }
      ]
    }
  };
}

async function fetchMALProfileData() {
  console.log(`Fetching public MAL stats for ${config.malUsername}...`);

  const headers = {
    'User-Agent': USER_AGENT
  };

  try {
    const statsResponse = await axios.get(
      `${JIKAN_API_BASE_URL}/users/${encodeURIComponent(config.malUsername)}/statistics`,
      { headers }
    );

    // Wait 1 second to avoid Jikan rate limit (3 requests per second limit)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const profileResponse = await axios.get(
      `${JIKAN_API_BASE_URL}/users/${encodeURIComponent(config.malUsername)}`,
      { headers }
    );

    const animeStats = statsResponse.data?.data?.anime ?? {};
    const userData = profileResponse.data?.data ?? {};

    return {
      username: userData.username || config.malUsername,
      joinDate: formatJoinDate(userData.joined),
      daysWatched: formatDaysWatched(animeStats.days_watched),
      watching: String(animeStats.watching ?? 0),
      planToWatch: toInteger(animeStats.plan_to_watch),
      completed: toInteger(animeStats.completed),
      dropped: toInteger(animeStats.dropped),
      onHold: toInteger(animeStats.on_hold),
      totalWatched: toInteger(animeStats.total_entries)
    };
  } catch (error) {
    throw new Error(`Unable to fetch MAL profile data: ${error.message}`);
  }
}

async function pushDataToDiscordWidget(stats) {
  console.log('Sending widget payload to Discord...');

  try {
    await axios.patch(
      `${DISCORD_API_BASE_URL}/applications/${config.applicationId}/users/${config.discordUserId}/identities/0/profile`,
      buildWidgetPayload(stats),
      {
        headers: {
          Authorization: `Bot ${config.discordBotToken}`,
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT
        }
      }
    );

    console.log('Sync complete.');
  } catch (error) {
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    throw new Error(`Discord update failed: ${errorDetails}`);
  }
}

let syncInProgress = false;

async function runSynchronizationPipeline() {
  if (syncInProgress) {
    console.warn('A sync cycle is already running. Skipping this interval.');
    return;
  }

  syncInProgress = true;
  console.log(`\n[${new Date().toLocaleTimeString()}] Starting sync cycle...`);

  try {
    const malStats = await fetchMALProfileData();
    await pushDataToDiscordWidget(malStats);
  } catch (error) {
    console.error(error.message);
  } finally {
    syncInProgress = false;
  }
}

validateConfig();
void runSynchronizationPipeline();
setInterval(() => {
  void runSynchronizationPipeline();
}, POLL_INTERVAL_MS);