import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(bodyParser.json());

// Supabase connection
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ Log new crowd entry
app.post("/log", async (req, res) => {
  const { count, person_id } = req.body;
  try {
    await pool.query(
      "INSERT INTO entries (count, person_id) VALUES ($1, $2)",
      [count, person_id || "unknown"]
    );
    res.status(200).json({ message: "Logged successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to log entry" });
  }
});

// ✅ Fetch crowd history
app.get("/history", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT count, created_at FROM entries ORDER BY created_at DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
