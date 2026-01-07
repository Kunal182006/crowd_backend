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
    const result = await pool.query('SELECT * FROM entries ORDER BY created_at DESC LIMIT 100');
    console.log("Fetched rows:", result.rows); // ✅ Add this for debugging
    res.json(result.rows); // ✅ This must be an array
  } catch (error) {
    console.error("Error fetching history:", error); // ✅ Log full error
    res.status(500).json({ error: 'Internal server error' }); // ✅ This is what frontend sees
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
