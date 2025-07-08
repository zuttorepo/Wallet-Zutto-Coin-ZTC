// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// === PostgreSQL connection ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🚀 Faucet: tambah 5 ZTC
app.post('/faucet', async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ message: "Alamat kosong" });

  try {
    await pool.query(`
      INSERT INTO balances (address, balance)
      VALUES ($1, 5)
      ON CONFLICT (address)
      DO UPDATE SET balance = balances.balance + 5
    `, [address]);

    const result = await pool.query(`SELECT balance FROM balances WHERE address = $1`, [address]);
    res.json({ status: "faucet sent", balance: result.rows[0].balance });
  } catch (err) {
    console.error("Faucet error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get balance
app.get('/balance/:address', async (req, res) => {
  const { address } = req.params;
  try {
    const result = await pool.query(`SELECT balance FROM balances WHERE address = $1`, [address]);
    const balance = result.rows[0]?.balance || 0;
    res.json({ balance });
  } catch (err) {
    console.error("Get balance error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🚀 Send ZTC
app.post('/send', async (req, res) => {
  const { from, to, amount } = req.body;
  if (!from || !to || isNaN(amount)) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  try {
    const client = await pool.connect();
    await client.query('BEGIN');

    const sender = await client.query(`SELECT balance FROM balances WHERE address = $1 FOR UPDATE`, [from]);
    const senderBal = sender.rows[0]?.balance || 0;

    if (senderBal < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Saldo tidak cukup" });
    }

    await client.query(`
      INSERT INTO balances (address, balance)
      VALUES ($1, $2)
      ON CONFLICT (address)
      DO UPDATE SET balance = balances.balance - $2
    `, [from, amount]);

    await client.query(`
      INSERT INTO balances (address, balance)
      VALUES ($1, $2)
      ON CONFLICT (address)
      DO UPDATE SET balance = balances.balance + $2
    `, [to, amount]);

    await client.query('COMMIT');
    res.json({ status: "success", txid: "ZTC_TX_" + Date.now() });
  } catch (err) {
    console.error("Send error:", err);
    res.status(500).json({ message: "Transaksi gagal" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ZTC Node API running at http://localhost:${PORT}`);
});
