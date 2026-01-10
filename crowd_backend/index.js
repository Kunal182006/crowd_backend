import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(bodyParser.json());

// Supabase connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ Log new crowd entry
app.post("/log", async (req, res) => {
  const { count, person_id, area_id } = req.body;
  try {
    await pool.query(
      "INSERT INTO entries (count, person_id, area_id) VALUES ($1, $2, $3)",
      [count, person_id, area_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error logging entry:", err);
    res.status(500).json({ error: "Failed to log entry" });
  }
});

// ✅ Fetch crowd history
app.get("/history", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT count, created_at, person_id FROM entries ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
