// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("railway")
    ? { rejectUnauthorized: false }
    : false,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS balances (
    address VARCHAR(100) PRIMARY KEY,
    balance NUMERIC DEFAULT 0
  );
`);

// === GET BALANCE ===
app.get("/balance/:address", async (req, res) => {
  const { address } = req.params;
  try {
    const result = await pool.query("SELECT balance FROM balances WHERE address = $1", [address]);
    const balance = result.rows[0]?.balance || 0;
    res.json({ balance });
  } catch (err) {
    console.error("GET Balance Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// === POST FAUCET ===
app.post("/faucet", async (req, res) => {
  const { address } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO balances (address, balance)
       VALUES ($1, 100)
       ON CONFLICT (address) DO UPDATE SET balance = balances.balance + 100
       RETURNING balance`,
      [address]
    );
    res.json({ balance: result.rows[0].balance });
  } catch (err) {
    console.error("Faucet Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// === POST SEND ===
app.post("/send", async (req, res) => {
  const { from, to, amount } = req.body;
  if (!from || !to || !amount || isNaN(amount)) {
    return res.status(400).json({ status: "error", message: "Invalid request" });
  }

  try {
    await pool.query("BEGIN");

    // Check sender balance
    const fromRes = await pool.query("SELECT balance FROM balances WHERE address = $1 FOR UPDATE", [from]);
    const fromBalance = parseFloat(fromRes.rows[0]?.balance || 0);

    if (fromBalance < amount) {
      await pool.query("ROLLBACK");
      return res.json({ status: "error", message: "Insufficient balance" });
    }

    await pool.query("UPDATE balances SET balance = balance - $1 WHERE address = $2", [amount, from]);
    await pool.query(
      `INSERT INTO balances (address, balance)
       VALUES ($1, $2)
       ON CONFLICT (address) DO UPDATE SET balance = balances.balance + $2`,
      [to, amount]
    );

    await pool.query("COMMIT");
    res.json({ status: "success", txid: Date.now().toString() });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Send Error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Zuttocoin server running at http://localhost:${PORT}`);
});
