const cron = require('node-cron');
const axios = require('axios');
const ThreatModel = require('../models/threatModel');
const User = require('../models/userModel');
const NotificationSetting = require('../models/notificationSettingModel');
const Notification = require('../models/notificationModel');
const categoryMap = require('../utils/threatCategoryMap');
const { computeThreatLevel } = require('../utils/threatUtils');
const { sendNotification } = require('../utils/notificationHandler');

const LEVEL_MAP = {
  1: "VERY_LOW",
  2: "LOW",
  3: "MODERATE",
  4: "HIGH",
  5: "CRITICAL"
};

const MONITOR_LOCATIONS = [
  { city: 'London', lat: '51.509865', lng: '-0.118092' },
  { city: 'Birmingham', lat: '52.486244', lng: '-1.890401' },
  { city: 'Manchester', lat: '53.483959', lng: '-2.244644' },
  { city: 'Glasgow', lat: '55.864237', lng: '-4.251806' },
  { city: 'Leeds', lat: '53.800755', lng: '-1.549077' },
  { city: 'Liverpool', lat: '53.408371', lng: '-2.991573' },
  { city: 'Sheffield', lat: '53.381129', lng: '-1.470085' },
  { city: 'Bristol', lat: '51.454514', lng: '-2.587910' },
  { city: 'Edinburgh', lat: '55.953251', lng: '-3.188267' },
  { city: 'Leicester', lat: '52.636878', lng: '-1.139759' },
  { city: 'Coventry', lat: '52.406822', lng: '-1.519693' },
  { city: 'Nottingham', lat: '52.954783', lng: '-1.158109' },
  { city: 'Hull', lat: '53.767623', lng: '-0.327419' },
  { city: 'Newcastle upon Tyne', lat: '54.978252', lng: '-1.617439' },
  { city: 'Stoke-on-Trent', lat: '53.002666', lng: '-2.179404' },
  { city: 'Southampton', lat: '50.909698', lng: '-1.404351' },
  { city: 'Reading', lat: '51.454264', lng: '-0.978130' },
  { city: 'Cardiff', lat: '51.481583', lng: '-3.179090' },
  { city: 'Belfast', lat: '54.597285', lng: '-5.930120' },
  { city: 'Brighton', lat: '50.822530', lng: '-0.137163' },
  { city: 'Plymouth', lat: '50.375456', lng: '-4.142656' },
  { city: 'Derby', lat: '52.922530', lng: '-1.474620' },
  { city: 'Portsmouth', lat: '50.819767', lng: '-1.087977' },
  { city: 'Wolverhampton', lat: '52.586973', lng: '-2.128820' },
  { city: 'Swansea', lat: '51.621441', lng: '-3.943646' }
];

async function fetchAndCacheThreats({ lat, lng, city }) {
  try {
    const apiUrl = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}`;
    const response = await axios.get(apiUrl);
    const crimeData = response.data;

    const summary = {};

    for (const item of crimeData) {
      const internalCat = categoryMap[item.category];
      if (!internalCat) continue;
      summary[internalCat] = (summary[internalCat] || 0) + 1;
    }

    for (const [category, count] of Object.entries(summary)) {
      const threatLevelNum = computeThreatLevel(count);
      const threatLevelStr = LEVEL_MAP[threatLevelNum] || "UNKNOWN";

      await ThreatModel.findOneAndUpdate(
        { category, city },
        {
          city,
          lat,
          lng,
          count,
          threat_level: threatLevelStr,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Threat data saved for ${city} [${category}]`);
    }
  } catch (err) {
    console.error(`❌ Error updating threat data for ${city}:`, err.message);
  }
}

async function notifyUsersAfterCron() {
  try {
    const settings = await NotificationSetting.find({
      "flags.label": "Crime Reference",
      "flags.reminder": true
    }).populate("user");

    for (const setting of settings) {
      const user = setting.user;
      if (!user?.deviceToken || user.deviceToken.length < 10) continue;

      const title = "🛡️ Threat Level Update";
      const body = "Today's city crime-based threat levels have been updated. Check the app for details.";
      const data = {
        type: "threat_summary",
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
        notifyType: "general",
        isSeen: [],
      });
    }
  } catch (err) {
    console.error("❌ Summary Notification error:", err.message);
  }
}

// 🕑 Schedule to run daily at 9:10 AM
cron.schedule('0 0,3,6,9,12,15,18,21 * * *', async () => {
  console.log('⏰ Running Threat Level Cron...');

  for (const loc of MONITOR_LOCATIONS) {
    await fetchAndCacheThreats(loc);
  }

  await notifyUsersAfterCron();
});
