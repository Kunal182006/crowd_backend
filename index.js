// index.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render provides this automatically
  ssl: { rejectUnauthorized: false }
});

// Root route
app.get('/', (req, res) => {
  res.send('Crowd backend is running!');
});

// Chart route
app.get('/chart', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE_TRUNC('hour', created_at) AS hour, SUM(count) AS total_count
      FROM public.entries
      GROUP BY hour
      ORDER BY hour ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Chart error:', err);
    res.status(500).json({ error: 'Failed to generate chart data' });
  }
});

// History route (optional, if you want to see raw entries)
app.get('/history', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM public.entries ORDER BY created_at ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
