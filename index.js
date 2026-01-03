// index.js
const express = require('express');
const { Pool } = require('pg');

const app = express();

// Configure PostgreSQL pool from env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
});

// Basic middleware
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('✅ Backend is up');
});

// Stats: return latest entries
app.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, area_id, count, person_id, created_at
       FROM public.entries
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
app.get('/chart', async (req, res) => {
  const { area_id, person_id } = req.query;
  const conditions = [];
  const values = [];

  if (area_id) {
    conditions.push(`area_id = $${values.length + 1}`);
    values.push(area_id);
  }

  if (person_id) {
    conditions.push(`person_id = $${values.length + 1}`);
    values.push(person_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `
      SELECT DATE_TRUNC('hour', created_at) AS hour, SUM(count) AS total_count
      FROM public.entries
      ${whereClause}
      GROUP BY hour
      ORDER BY hour ASC
      `,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Chart error:', err);
    res.status(500).json({ error: 'Failed to generate chart data' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('❌ Route not found');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await pool.end();
    process.exit(0);
  } catch {
    process.exit(1);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
