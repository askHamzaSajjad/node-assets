const cron = require('node-cron');
const axios = require('axios');
const xml2js = require('xml2js');
const News = require('../models/newsModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const NotificationSetting = require('../models/notificationSettingModel');
const isCrimeRelated = require('../utils/newsCategoryMap');
const { sendNotification } = require('../utils/notificationHandler');

const RSS_FEED = 'https://feeds.bbci.co.uk/news/uk/rss.xml';

async function fetchAndStoreBBCNews() {
  try {
    const res = await axios.get(RSS_FEED);
    const xml = res.data;

    const parser = new xml2js.Parser({ explicitArray: false });
    const parsed = await parser.parseStringPromise(xml);

    const items = parsed.rss.channel.item
      .filter(isCrimeRelated)
      .slice(0, 20);

    let savedCount = 0;

    for (const item of items) {
      const { title, description, link, pubDate, category, location} = item;
      const thumbnail = item['media:thumbnail']?.$.url || null;

      const exists = await News.findOne({ link });
      if (!exists) {
        await News.create({
          title,
          description,
          pubDate: new Date(pubDate),
          link,
          category,
          thumbnail,
          location
        });
        savedCount++;
      }
    }

    console.log(`✅ Fetched and saved ${savedCount} new crime-related BBC news stories.`);

    // 🔔 Send summary notification if any were saved
    if (savedCount > 0) await notifyUsersAfterNewsUpdate(savedCount);

  } catch (err) {
    console.error('❌ Failed to fetch BBC crime news:', err.message);
  }
}

async function notifyUsersAfterNewsUpdate(savedCount) {
  try {
    const settings = await NotificationSetting.find({
      "flags.label": "News",
      "flags.reminder": true
    }).populate("user");

    for (const setting of settings) {
      const user = setting.user;
      if (!user?.deviceToken || user.deviceToken.length < 10) continue;

      const title = "📰 BBC Crime News Update";
      const body = `${savedCount} new crime-related stories were added. Check the news section now.`;
      const data = {
        type: "news_update",
        count: savedCount,
        timestamp: new Date().toISOString(),
      };

      await sendNotification({
        token: user.deviceToken,
        title,
        body,
        data,
        sender: null,
        receiver: user._id,
      });

      await Notification.create({
        sender: null,
        receiver: user._id,
        title,
        body,
        data,
        notifyType: "news",
        isSeen: [],
      });
    }
  } catch (err) {
    console.error("❌ News notification error:", err.message);
  }
}

// Schedule every 3 hours (8x per day)
cron.schedule('0 0,3,6,9,12,15,18,21 * * *', fetchAndStoreBBCNews);

// Uncomment below for testing
// cron.schedule('* * * * *', fetchAndStoreBBCNews);
