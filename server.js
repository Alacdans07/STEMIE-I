const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// --- Sensor ID Constants ---
const Lidar_readings = 101;
const Ultrasonic_readings = 102;

// --- Firebase Configuration ---
const FIREBASE_URL = 'https://alacdans-dde5a-default-rtdb.asia-southeast1.firebasedatabase.app/';
const FIREBASE_SECRET = 'AIzaSyBmnPqHuE35Cly5pcdoAKiF95GI4o3R5QU';

// --- Middleware ---
app.use(express.json());
app.use('/Image', express.static(path.join(__dirname, 'Image')));

// --- Serve HTML Page ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Fetch Sensor Readings ---
app.get('/api/readings', async (req, res) => {
    try {
        const url = `${FIREBASE_URL}/sensor_readings.json?auth=${FIREBASE_SECRET}`;
        const response = await axios.get(url);
        const { Lidar_readings, Ultrasonic_readings } = response.data || {};
        res.json({
            lidar: Lidar_readings || {},
            ultrasonic: Ultrasonic_readings || {}
        });
    } catch (err) {
        console.error('Firebase error:', err.response?.data || err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- Save Lidar Reading ---
app.post('/api/lidar', async (req, res) => {
    const { distance_cm } = req.body;
    if (typeof distance_cm !== 'number') {
        return res.status(400).json({ error: 'Invalid distance_cm' });
    }
    try {
        const payload = {
            value: distance_cm,
            unit: 'cm'
        };
        const url = `${FIREBASE_URL}/sensor_readings/Lidar_readings.json?auth=${FIREBASE_SECRET}`;
        await axios.put(url, payload);
        res.status(201).json({ message: 'Lidar reading saved' });
    } catch (error) {
        console.error('Error inserting Lidar reading:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

// --- Save Ultrasonic Reading ---
app.post('/api/ultrasonic', async (req, res) => {
    const { distance_cm } = req.body;
    if (typeof distance_cm !== 'number') {
        return res.status(400).json({ error: 'Invalid distance_cm' });
    }
    try {
        const payload = {
            value: distance_cm,
            unit: 'cm'
        };
        const url = `${FIREBASE_URL}/sensor_readings/Ultrasonic_readings.json?auth=${FIREBASE_SECRET}`;
        await axios.put(url, payload);
        res.status(201).json({ message: 'Ultrasonic reading saved' });
    } catch (error) {
        console.error('Error inserting Ultrasonic reading:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

// --- Start Server ---
const PORT = 3000;
const HOST = '192.168.1.12';

app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});
