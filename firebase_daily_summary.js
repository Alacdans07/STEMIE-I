// firebase_daily_summary.js
const axios = require('axios');

// --- Firebase Config ---
const FIREBASE_URL = 'https://alacdans-dde5a-default-rtdb.asia-southeast1.firebasedatabase.app/';
const FIREBASE_AUTH = 'AIzaSyBmnPqHuE35Cly5pcdoAKiF95GI4o3R5QU';

// --- Date Setup (use yesterday's date if running just after midnight) ---
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const path = `/history_dashboard/${year}-${month}/${day}`;

// --- Helper: Get all 5-min readings for the day ---
async function getDayReadings() {
  const url = `${FIREBASE_URL}${path}.json?auth=${FIREBASE_AUTH}`;
  const res = await axios.get(url);
  return res.data || {};
}

// --- Helper: Write daily summary ---
async function writeDailySummary(summary) {
  const url = `${FIREBASE_URL}${path}/daily_summary.json?auth=${FIREBASE_AUTH}`;
  await axios.put(url, summary);
}

// --- Helper: Delete all 5-min readings except summary ---
async function deleteAllReadingsExceptSummary(keys) {
  for (const key of keys) {
    if (key !== 'daily_summary') {
      const url = `${FIREBASE_URL}${path}/${key}.json?auth=${FIREBASE_AUTH}`;
      await axios.delete(url);
    }
  }
}

async function main() {
  const readings = await getDayReadings();
  const entries = Object.entries(readings).filter(([k, v]) => k !== 'daily_summary' && v.lidar_avg !== undefined && v.ultrasonic_avg !== undefined);

  if (entries.length === 0) {
    console.log('No readings found for today.');
    return;
  }

  // Compute averages
  let lidarSum = 0, ultrasonicSum = 0;
  for (const [_, entry] of entries) {
    lidarSum += Number(entry.lidar_avg);
    ultrasonicSum += Number(entry.ultrasonic_avg);
  }
  const lidarAvg = lidarSum / entries.length;
  const ultrasonicAvg = ultrasonicSum / entries.length;

  // Prepare summary object
  const summary = {
    timestamp: Date.now(),
    lidar_daily_avg: lidarAvg,
    ultrasonic_daily_avg: ultrasonicAvg,
    count: entries.length
  };

  // Write summary and delete old readings
  await writeDailySummary(summary);
  await deleteAllReadingsExceptSummary(Object.keys(readings));
  console.log('Daily summary written and old readings deleted.');
}

main().catch(err => {
  console.error('Error:', err);
});