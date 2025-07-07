// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// === FILE DATA PERSISTEN ===
const DATA_FILE = "data.json";

// === LOAD DATA AWAL ===
let data = {
  supply: 2000000,
  wallets: {}
};

if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE);
    data = JSON.parse(raw);
    console.log("✅ Data loaded from data.json");
  } catch (err) {
    console.error("⚠️ Gagal membaca data.json:", err.message);
  }
}

// === MIDDLEWARE ===
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // HTML, JS, dll

// === HELPER SIMPAN ===
function saveData() {
  fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), (err) => {
    if (err) console.error("❌ Gagal menyimpan data:", err.message);
  });
}

// === INISIALISASI WALLET ===
function getOrInitWallet(address) {
  if (!data.wallets[address]) {
    data.wallets[address] = {
      balance: 1000,
      history: []
    };
    saveData();
  }
  return data.wallets[address];
}

// === API GET WALLET ===
app.get("/wallet/:address", (req, res) => {
  const address = req.params.address;
  const wallet = getOrInitWallet(address);
  res.json({
    balance: wallet.balance,
    history: wallet.history
  });
});

// === API KIRIM TRANSAKSI ===
app.post("/wallet/:address/send", (req, res) => {
  const from = req.params.address;
  const { to, amount } = req.body;

  const amt = parseFloat(amount);
  if (!to || isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: "❌ Format tidak valid" });
  }

  const sender = getOrInitWallet(from);
  const receiver = getOrInitWallet(to);

  if (sender.balance < amt) {
    return res.status(400).json({ error: "❌ Saldo tidak cukup" });
  }

  sender.balance -= amt;
  receiver.balance += amt;

  const time = new Date().toLocaleString();
  sender.history.unshift({ desc: `Send to ${to}`, amount: -amt, time });
  receiver.history.unshift({ desc: `Received from ${from}`, amount: amt, time });

  saveData();
  res.json({ balance: sender.balance, history: sender.history });
});

// === API FAUCET ===
app.post("/faucet", (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "❌ Address diperlukan" });

  const wallet = getOrInitWallet(address);
  wallet.balance += 100;
  wallet.history.unshift({
    desc: "Faucet reward",
    amount: 100,
    time: new Date().toLocaleString()
  });

  saveData();
  res.json({ message: "✅ Faucet sent", balance: wallet.balance });
});

// === API SUPPLY ===
app.get("/supply", (req, res) => {
  res.json({ supply: data.supply });
});

// === JALANKAN SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Zuttocoin Node API aktif di http://localhost:${PORT}`);
});
