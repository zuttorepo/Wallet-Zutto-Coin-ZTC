// === Init elliptic ===
const ec = new elliptic.ec("secp256k1");

// === Generate ECDSA Keypair ===
function generateZTCKeyPair() {
  const key = ec.genKeyPair();
  const privateKey = key.getPrivate("hex");
  const publicKey = key.getPublic("hex");
  const address = "ZTC" + CryptoJS.SHA256(publicKey).toString().substring(0, 30).toUpperCase();
  return { address, privateKey };
}

// === QR Code ===
function showQRCode(text, elementId) {
  const container = document.getElementById(elementId);
  container.innerHTML = "";
  new QRCode(container, { text, width: 128, height: 128 });
}

// === LocalStorage ===
function saveLocalBalance(address, balance) {
  localStorage.setItem(`balance_${address}`, balance);
}
function loadLocalBalance(address) {
  return localStorage.getItem(`balance_${address}`) || 0;
}

// === Faucet ===
async function getFaucet() {
  const address = document.getElementById("address").innerText;
  if (!address) return alert("⚠️ Wallet belum dibuat!");

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
    const offline = loadLocalBalance(address);
    alert("🟡 Server offline. Gunakan balance lokal.");
    document.getElementById("balance").innerText = `Balance: ${offline}`;
  }
}

// === Manual Sync ===
async function manualSync() {
  const address = document.getElementById("address").innerText;
  try {
    const res = await fetch(`http://localhost:3000/balance/${address}`);
    const data = await res.json();
    document.getElementById("balance").innerText = `Balance: ${data.balance}`;
    saveLocalBalance(address, data.balance);
  } catch {
    const local = loadLocalBalance(address);
    document.getElementById("balance").innerText = `Balance: ${local}`;
  }
}

// === Send Transaction ===
async function sendZTC() {
  const from = document.getElementById("address").innerText;
  const privateKey = localStorage.getItem("ztc_privateKey");
  const to = document.getElementById("send-to").value;
  const amount = Number(document.getElementById("send-amount").value);

  if (!to || !amount) return alert("Tujuan dan jumlah wajib diisi!");
  if (!from || !privateKey) return alert("Wallet belum dibuat!");

  try {
    const res = await fetch("http://localhost:3000/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, amount, privateKey }),
    });

    const data = await res.json();
    if (data.status === "success") {
      alert(`🚀 TXID: ${data.txid}`);
      manualSync();
    } else {
      alert("❌ Gagal: " + data.message);
    }
  } catch {
    alert("🔴 Gagal koneksi ke server");
  }
}

// === Generate Wallet ===
document.getElementById("genWallet").addEventListener("click", () => {
  const { address, privateKey } = generateZTCKeyPair();
  document.getElementById("address").innerText = address;
  document.getElementById("wif").innerText = privateKey;
  showQRCode(address, "qrcode");
  document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(address)}`;
  localStorage.setItem("ztc_address", address);
  localStorage.setItem("ztc_privateKey", privateKey);
  manualSync();
});

// === Restore on Reload ===
window.addEventListener("DOMContentLoaded", () => {
  const savedAddr = localStorage.getItem("ztc_address");
  const savedPriv = localStorage.getItem("ztc_privateKey");
  if (savedAddr) {
    document.getElementById("address").innerText = savedAddr;
    document.getElementById("wif").innerText = savedPriv;
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(savedAddr)}`;
    showQRCode(savedAddr, "qrcode");
  }
});

// === Backup / Restore ===
function backupWallet() {
  const address = document.getElementById("address").innerText;
  const priv = document.getElementById("wif").innerText;
  const data = JSON.stringify({ address, privateKey: priv });
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ztc-wallet-backup.json";
  a.click();
}

function restoreWallet(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);
    document.getElementById("address").innerText = data.address;
    document.getElementById("wif").innerText = data.privateKey;
    localStorage.setItem("ztc_address", data.address);
    localStorage.setItem("ztc_privateKey", data.privateKey);
    showQRCode(data.address, "qrcode");
    manualSync();
  };
  reader.readAsText(file);
}
