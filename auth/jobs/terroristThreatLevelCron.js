const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");
const TerroristThreatLevel = require("../models/terroristThreatLevelModel");
const NotificationSettings = require("../models/notificationSettingModel");
const {sendNotification}=require("../utils/notificationHandler")

const GOV_UK_URL = "https://www.gov.uk/terrorism-national-emergency";
const VALID_LEVELS = ["LOW", "MODERATE", "SUBSTANTIAL", "SEVERE", "CRITICAL"];

// ✅ Embedded fallback JSON
const FALLBACK_JSON = {
  level: "SUBSTANTIAL",
  source: "Embedded fallback - gov.uk unreachable"
};

async function fetchTerroristThreatLevel() {
  let finalLevel = "UNKNOWN";
  let finalSource = GOV_UK_URL;

  try {
    // 🔍 Try scraping from GOV.UK
    const response = await axios.get(GOV_UK_URL);
    const $ = cheerio.load(response.data);
    const text = $("main p").toArray().map(p => $(p).text().trim()).join(" ").toLowerCase();

    const match = text.match(
      /threat\s+(to\s+the\s+uk)?\s+(from\s+terrorism)?\s+is\s+(low|moderate|substantial|severe|critical)/i
    );

    if (match && match[3]) {
      finalLevel = match[3].toUpperCase();
      console.log(`[✅ GOV.UK] Found: ${finalLevel}`);
    } else {
      throw new Error("No threat level found on page");
    }
  } catch (err) {
    console.warn(`[⚠️ GOV.UK] Scrape failed: ${err.message}`);

    const fallbackLevel = FALLBACK_JSON.level.toUpperCase();
    if (VALID_LEVELS.includes(fallbackLevel) || fallbackLevel === "UNKNOWN") {
      finalLevel = fallbackLevel;
      finalSource = FALLBACK_JSON.source;
      console.log(`[♻️ Fallback] Using fallback level: ${finalLevel}`);
    } else {
      console.error(`[❌ Fallback] Invalid fallback data`);
    }
  }

  try {
    // 💾 Upsert (only one document per level)
    await TerroristThreatLevel.findOneAndUpdate(
      { level: finalLevel },
      {
        source: finalSource,
        fetchedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log(`[📦 Saved] Threat level updated/stored: ${finalLevel}`);
  } catch (dbErr) {
    console.error(`[❌ DB] Save failed: ${dbErr.message}`);
  }
    // 🔔 Notify only users who enabled "Terrorist Threat"
  try {
    const notificationSettings = await NotificationSettings.find({
      flags: { $elemMatch: { label: "Terrorist Threat", reminder: true } },
    }).populate("user", "deviceToken isNotification");

    console.log("===============notification Settings===============", notificationSettings.length)
    let count = 0;

    for (const setting of notificationSettings) {
      const user = setting.user;
      if (!user || !user.isNotification || !user.deviceToken) continue;

      await sendNotification({
        token: user.deviceToken,
        title: "Terrorist Threat Level Update",
        body: `Current UK threat level: ${finalLevel}`,
        data: {
          notificationType: "threat_level",
          level: finalLevel,
          fetchedAt: new Date().toISOString(),
          receiver: user._id.toString(),
        },
        sender: null,
        receiver: user._id,
      });

      count++;
    }

    console.log(`[📲 Notifications] Sent to ${count} users`);
  } catch (notifyErr) {
    console.error(`[❌ Notifications] Error: ${notifyErr.message}`);
  }

}

// // ⏱️ Schedule: every day at 9:00 AM
cron.schedule("0 9 * * *", fetchTerroristThreatLevel);

// module.exports = fetchTerroristThreatLevel;



// // Run every day at 9:00 AM
// cron.schedule("* * * * *", fetchTerroristThreatLevel);

module.exports = fetchTerroristThreatLevel;
