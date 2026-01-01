const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

// ------------------- PostgreSQL Setup -------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ------------------- Stats -------------------
app.get('/stats', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM entries ORDER BY created_at DESC LIMIT 10');

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ------------------- History -------------------
app.get('/history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT count, created_at FROM entries
      ORDER BY created_at DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ------------------- Create Area -------------------
// Create Area
app.post('/areas', async (req, res) => {
  const { name } = req.body;
  try {
    await pool.query(
      `INSERT INTO areas (name, latitude, longitude, radius, max_capacity)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, req.body.latitude, req.body.longitude, req.body.radius, req.body.max_capacity]
    );
    res.status(200).json({ message: `Area '${name}' created successfully` });
  } catch (err) {
    console.error('Create area error:', err);
    res.status(500).json({ error: 'Failed to create area' });
  }
});

// Log Entry
app.post('/entries', async (req, res) => {
  const { area_id, count, person_id } = req.body;
  try {
    await pool.query(
      `INSERT INTO entries (area_id, count, person_id) VALUES ($1, $2, $3)`,
      [area_id, count, person_id || null]
    );
    res.status(200).json({ message: `Entry logged for person ${person_id || 'unknown'} in area ${area_id}` });
  } catch (err) {
    console.error('Log entry error:', err);
    res.status(500).json({ error: 'Failed to log entry' });
  }
});

// ------------------- Area Stats -------------------
app.get('/areas/:id/stats', async (req, res) => {
  const areaId = req.params.id;
  try {
    const result = await pool.query(`
      SELECT SUM(count) AS total
      FROM entries
      WHERE area_id = $1
    `, [areaId]);

    const total = parseInt(result.rows[0].total || 0);
    const capResult = await pool.query(`
      SELECT max_capacity FROM areas WHERE id = $1
    `, [areaId]);

    const max = parseInt(capResult.rows[0]?.max_capacity || 0);
    const status = total > max ? 'alert' : 'safe';

    res.json({ area_id: areaId, count: total, status });
  } catch (err) {
    console.error('Area stats error:', err);
    res.status(500).json({ error: 'Failed to fetch area stats' });
  }
});

// ------------------- Alerts -------------------
app.get('/alerts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.name, SUM(e.count) AS total, a.max_capacity
      FROM entries e
      JOIN areas a ON e.area_id = a.id
      GROUP BY a.id
      HAVING SUM(e.count) > a.max_capacity
    `);

    const alerts = result.rows.map(row => ({
      message: `Crowd limit exceeded in ${row.name}`
    }));

    res.json(alerts);
  } catch (err) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// ------------------- Start Server -------------------
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
