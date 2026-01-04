// index.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Root route
app.get('/', (req, res) => {
  res.send('Crowd backend is running!');
});

// Chart route (group by hour, sum count)
app.get('/chart', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE_TRUNC('hour', created_at) AS hour, SUM(COALESCE(count, 0)) AS total_count
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


// Debug route to verify DB and table contents
app.get('/debug-db', async (req, res) => {
  try {
    const dbInfo = await pool.query(`SELECT current_database() AS db`);
    const counts = await pool.query(`SELECT COUNT(*)::int AS entries_count FROM public.entries`);
    const range = await pool.query(`
      SELECT 
        MIN(created_at) AS min_created_at, 
        MAX(created_at) AS max_created_at
      FROM public.entries
    `);

    res.json({
      database: dbInfo.rows[0]?.db || null,
      entries_count: counts.rows[0]?.entries_count || 0,
      min_created_at: range.rows[0]?.min_created_at || null,
      max_created_at: range.rows[0]?.max_created_at || null
    });
  } catch (err) {
    console.error('Debug DB error:', err);
    res.status(500).json({ error: 'Failed to debug database' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
