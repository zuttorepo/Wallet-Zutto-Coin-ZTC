// === INIT ECDSA ===
const EC = elliptic.ec;
const ec = new EC('secp256k1');

// === Generate Wallet ===
function generateWallet() {
  const key = ec.genKeyPair();
  const privateKey = key.getPrivate("hex");
  const publicKey = key.getPublic("hex");

  const address = "ZTCF" + sha256(publicKey).substring(0, 32).toUpperCase(); // Simple hash addr

  return { address, privateKey, publicKey };
}

// === SHA256
function sha256(msg) {
  return CryptoJS.SHA256(msg).toString();
}

// === QR Code ===
function showQRCode(text, elementId) {
  const qrcodeContainer = document.getElementById(elementId);
  qrcodeContainer.innerHTML = "";
  new QRCode(qrcodeContainer, {
    text: text,
    width: 128,
    height: 128,
  });
}

// === LocalStorage ===
function saveToLocal(address, priv) {
  localStorage.setItem("ztc_address", address);
  localStorage.setItem("ztc_private", priv);
}
function loadLocalBalance(addr) {
  return localStorage.getItem("balance_" + addr) || 0;
}
function saveLocalBalance(addr, bal) {
  localStorage.setItem("balance_" + addr, bal);
}

// === Faucet ===
async function getFaucet() {
  const address = document.getElementById("address").innerText;
  try {
    const res = await fetch("http://localhost:3000/faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const data = await res.json();
    document.getElementById("balance").innerText = `Balance: ${data.balance}`;
    saveLocalBalance(address, data.balance);
  } catch {
    const fallback = loadLocalBalance(address);
    alert("🟡 Server offline, tampilkan balance lokal.");
    document.getElementById("balance").innerText = `Balance: ${fallback}`;
  }
}

// === Manual Sync ===
async function manualSync() {
  const address = document.getElementById("address").innerText;
  try {
    const res = await fetch("http://localhost:3000/balance/" + address);
    const data = await res.json();
    document.getElementById("balance").innerText = `Balance: ${data.balance}`;
    saveLocalBalance(address, data.balance);
    alert("✅ Sync berhasil");
  } catch {
    const fallback = loadLocalBalance(address);
    document.getElementById("balance").innerText = `Balance: ${fallback}`;
    alert("🟡 Sync gagal, gunakan data lokal");
  }
}

// === Kirim
async function sendZTC() {
  const to = document.getElementById("send-to").value;
  const amount = Number(document.getElementById("send-amount").value);
  const from = document.getElementById("address").innerText;
  const privateKey = localStorage.getItem("ztc_private");

  if (!to || !amount) return alert("Isi lengkap");
  try {
    const res = await fetch("http://localhost:3000/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, amount, privateKey }),
    });
    const data = await res.json();
    if (data.status === "success") {
      alert("🚀 TX Success: " + data.txid);
      manualSync();
      const tbody = document.getElementById("tx-body");
      const row = document.createElement("tr");
      row.innerHTML = `<td>To: ${to}</td><td>${amount}</td><td>${new Date().toLocaleString()}</td>`;
      tbody.prepend(row);
    } else {
      alert("❌ TX Gagal: " + data.message);
    }
  } catch {
    alert("🔴 Server offline");
  }
}
window.Transaction = { send: sendZTC };

// === Generate Wallet
document.getElementById("genWallet").addEventListener("click", () => {
  const wallet = generateWallet();
  document.getElementById("address").innerText = wallet.address;
  document.getElementById("wif").innerText = wallet.privateKey;
  showQRCode(wallet.address, "qrcode");
  document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(wallet.address)}`;
  saveToLocal(wallet.address, wallet.privateKey);
  manualSync();
});

// === Import
document.getElementById("importBtn").addEventListener("click", () => {
  const priv = prompt("Masukkan Private Key:");
  if (!priv) return;

  try {
    const key = ec.keyFromPrivate(priv);
    const pub = key.getPublic("hex");
    const addr = "ZTCF" + sha256(pub).substring(0, 32).toUpperCase();

    document.getElementById("address").innerText = addr;
    document.getElementById("wif").innerText = priv;
    showQRCode(addr, "qrcode");
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(addr)}`;
    saveToLocal(addr, priv);
    manualSync();
  } catch {
    alert("❌ Private Key salah");
  }
});

// === Restore on Load
window.addEventListener("DOMContentLoaded", () => {
  const addr = localStorage.getItem("ztc_address");
  const priv = localStorage.getItem("ztc_private");
  if (addr && priv) {
    document.getElementById("address").innerText = addr;
    document.getElementById("wif").innerText = priv;
    showQRCode(addr, "qrcode");
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(addr)}`;
  }
});

// === Backup
function backupWallet() {
  const address = document.getElementById("address").innerText;
  const privateKey = document.getElementById("wif").innerText;
  const blob = new Blob([JSON.stringify({ address, privateKey })], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ztc-wallet-backup.json";
  a.click();
}

// === Restore from file
function restoreWallet(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);
    document.getElementById("address").innerText = data.address;
    document.getElementById("wif").innerText = data.privateKey;
    showQRCode(data.address, "qrcode");
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(data.address)}`;
    saveToLocal(data.address, data.privateKey);
    manualSync();
  };
  reader.readAsText(file);
}

// === Scanner QR
function startQRScan() {
  const preview = document.getElementById("camera-preview");
  preview.style.display = "block";
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      document.getElementById("send-to").value = decodedText;
      html5QrCode.stop();
      preview.style.display = "none";
    }
  );
}
