// index.js
const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// Connect to Supabase Postgres using environment variable
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});


// Middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Crowd Analytics Backend is running with Supabase!');
});

// History route: fetch recent entries
app.get('/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM public.entries ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Add new entry route (optional)
app.post('/entries', async (req, res) => {
  const { area_id, person_id, count } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO public.entries (area_id, person_id, count) VALUES ($1, $2, $3) RETURNING *',
      [area_id, person_id, count]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting entry:', err);
    res.status(500).json({ error: 'Failed to insert entry' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
console.log('DB URL:', process.env.SUPABASE_DB_URL);

