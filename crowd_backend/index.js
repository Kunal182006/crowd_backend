const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // ✅ This line enables CORS
app.use(express.json());

const dbUrl = process.env.SUPABASE_DB_URL;
console.log("DB URL:", dbUrl);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM crowd_history ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
