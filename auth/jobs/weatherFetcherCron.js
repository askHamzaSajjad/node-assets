const cron = require("node-cron");
const axios = require("axios");
const WeatherForecast = require("../models/weatherForecastModel");
const Notification = require("../models/notificationModel");
const NotificationSetting = require("../models/notificationSettingModel");
const User = require("../models/userModel");
const { sendNotification } = require("../utils/notificationHandler");

const apiKey = process.env.WEATHER_API_KEY;

const CITIES = [
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

const SEVERE_KEYWORDS = ["storm", "gale", "heavy rain", "flood", "snow", "blizzard", "thunder"];

function isSevere(text) {
  return SEVERE_KEYWORDS.some(word => text.toLowerCase().includes(word));
}

async function fetchWeatherForCity({ city, lat, lon }) {
  const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=1`;

  try {
    const res = await axios.get(url);
    const forecast = res.data.forecast.forecastday[0];
    const condition = forecast.day.condition.text;
    const icon = forecast.day.condition.icon;
    const date = new Date(forecast.date);
    const severity = isSevere(condition) ? "Severe" : "Moderate";

    await WeatherForecast.findOneAndUpdate(
      { city, date },
      { city, lat, lon, date, condition, severity, icon, fetchedAt: new Date() },
      { upsert: true }
    );

    console.log(`🌦️ ${city}: ${condition} (${severity})`);
  } catch (err) {
    console.error(`❌ Failed to fetch weather for ${city}:`, err.message);
  }
}

async function notifyUsersAfterWeatherUpdate() {
  try {
    const settings = await NotificationSetting.find({
      "flags.label": "Weather warning",
      "flags.reminder": true,
    }).populate("user");

    for (const setting of settings) {
      const user = setting.user;
      if (!user?.deviceToken || user.deviceToken.length < 10) continue;

      const title = "🌦️ Weather Update";
      const body = `Latest weather forecasts have been updated. Stay alert for any warnings.`;
      const data = {
        type: "weather_update",
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
        notifyType: "weather",
        isSeen: [],
      });
    }
  } catch (err) {
    console.error("❌ Weather notification error:", err.message);
  }
}

// 🕑 Run every day at 7:00 AM
cron.schedule("0 0,3,6,9,12,15,18,21 * * *", async () => {
  console.log("⏰ Starting Weather Forecast Cron...");

  for (const city of CITIES) {
    await fetchWeatherForCity(city);
  }

  await notifyUsersAfterWeatherUpdate();
});
