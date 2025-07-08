// === Load ENV ===
require('dotenv').config();

// === Import Library ===
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// === Init Express App ===
const app = express();
app.use(cors());
app.use(express.json());

// === Connect to PostgreSQL ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // penting untuk Railway
});

pool.connect()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch(err => console.error('❌ DB Connection Error:', err));

// === Ensure Wallet Table Exists ===
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallets (
      address TEXT PRIMARY KEY,
      balance NUMERIC DEFAULT 0
    );
  `);
}
ensureTable();

// === GET Balance ===
app.get('/balance/:address', async (req, res) => {
  const { address } = req.params;
  try {
    const result = await pool.query(
      'SELECT balance FROM wallets WHERE address = $1',
      [address]
    );
    if (result.rows.length > 0) {
      res.json({ balance: result.rows[0].balance });
    } else {
      res.json({ balance: 0 });
    }
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// === Faucet (Add Balance) ===
app.post('/faucet', async (req, res) => {
  const { address } = req.body;
  const amount = 100; // Test faucet amount
  try {
    await pool.query(`
      INSERT INTO wallets (address, balance)
      VALUES ($1, $2)
      ON CONFLICT (address)
      DO UPDATE SET balance = wallets.balance + $2
    `, [address, amount]);

    const result = await pool.query('SELECT balance FROM wallets WHERE address = $1', [address]);
    res.json({ balance: result.rows[0].balance });
  } catch (err) {
    res.status(500).json({ error: 'Faucet failed' });
  }
});

// === Send ZTC ===
app.post('/send', async (req, res) => {
  const { from, to, amount } = req.body;
  try {
    const fromResult = await pool.query('SELECT balance FROM wallets WHERE address = $1', [from]);
    const fromBalance = fromResult.rows[0]?.balance || 0;

    if (fromBalance < amount) {
      return res.json({ status: 'failed', message: 'Insufficient balance' });
    }

    await pool.query('BEGIN');
    await pool.query('UPDATE wallets SET balance = balance - $1 WHERE address = $2', [amount, from]);
    await pool.query(`
      INSERT INTO wallets (address, balance)
      VALUES ($1, $2)
      ON CONFLICT (address)
      DO UPDATE SET balance = wallets.balance + $2
    `, [to, amount]);
    await pool.query('COMMIT');

    res.json({ status: 'success', txid: Date.now().toString() });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ status: 'failed', message: 'Send failed' });
  }
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Zuttocoin Node.js server running on http://localhost:${PORT}`);
});
