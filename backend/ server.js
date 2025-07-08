require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Contoh query
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ DB Connection Error:", err);
  } else {
    console.log("✅ PostgreSQL Connected:", res.rows[0]);
  }
});
