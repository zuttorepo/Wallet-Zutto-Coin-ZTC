// === Generate Address ZTC ===
function generateZTCAddress() {
  const rand = Math.random().toString(36).substring(2, 32).toUpperCase();
  return "ZTCF" + rand;
}

// === QR Code ===
function showQRCode(text, elementId) {
  const container = document.getElementById(elementId);
  container.innerHTML = "";
  new QRCode(container, {
    text: text,
    width: 128,
    height: 128,
  });
}

// === Local Balance Storage ===
function saveLocalBalance(address, balance) {
  if (address) localStorage.setItem(`balance_${address}`, balance);
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
    alert("🟡 Gagal klaim faucet. Gunakan data lokal.");
    document.getElementById("balance").innerText = `Balance: ${offline}`;
  }
}

// === Manual Sync ===
async function manualSync() {
  const address = document.getElementById("address").innerText;
  if (!address) return alert("⚠️ Wallet belum dibuat!");

  try {
    const res = await fetch(`http://localhost:3000/balance/${address}`);
    const data = await res.json();
    document.getElementById("balance").innerText = `Balance: ${data.balance}`;
    saveLocalBalance(address, data.balance);
    alert("✅ Sync dari server berhasil");
  } catch {
    const local = loadLocalBalance(address);
    document.getElementById("balance").innerText = `Balance: ${local}`;
    alert("🟡 Server offline. Tampilkan balance lokal.");
  }
}

// === Kirim ZTC ===
async function sendZTC() {
  const from = document.getElementById("address").innerText;
  const to = document.getElementById("send-to").value;
  const amount = Number(document.getElementById("send-amount").value);
  if (!from || !to || !amount) return alert("⚠️ Lengkapi form transaksi.");

  try {
    const res = await fetch("http://localhost:3000/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, privateKey: "dummy", to, amount }),
    });
    const data = await res.json();
    if (data.status === "success") {
      alert(`🚀 Transaksi sukses! TXID: ${data.txid}`);
      manualSync();
      const tbody = document.getElementById("tx-body");
      const row = document.createElement("tr");
      row.innerHTML = `<td>To: ${to}</td><td>${amount}</td><td>${new Date().toLocaleString()}</td>`;
      tbody.prepend(row);
    } else {
      alert("❌ Gagal: " + data.message);
    }
  } catch {
    alert("🔴 Server offline. Coba lagi nanti.");
  }
}
window.Transaction = { send: sendZTC };

// === Generate Wallet ===
document.getElementById("genWallet").addEventListener("click", () => {
  const addr = generateZTCAddress();
  document.getElementById("address").innerText = addr;
  document.getElementById("wif").innerText = "";
  document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(addr)}`;
  showQRCode(addr, "qrcode");

  localStorage.setItem("ztc_address", addr);
  localStorage.setItem("ztc_wif", "");
  manualSync();
});

// === Import Wallet ===
document.getElementById("importBtn").addEventListener("click", () => {
  const wif = prompt("Masukkan WIF:");
  if (!wif) return;
  const addr = generateZTCAddress();
  document.getElementById("address").innerText = addr;
  document.getElementById("wif").innerText = wif;
  document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(addr)}`;
  showQRCode(addr, "qrcode");

  localStorage.setItem("ztc_address", addr);
  localStorage.setItem("ztc_wif", wif);
  manualSync();
});

// === Backup ===
function backupWallet() {
  const address = document.getElementById("address").innerText;
  const wif = document.getElementById("wif").innerText;
  const data = { address, wif };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ztc-wallet-backup.json";
  a.click();
}

// === Restore ===
function restoreWallet(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);
    document.getElementById("address").innerText = data.address;
    document.getElementById("wif").innerText = data.wif || "";
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(data.address)}`;
    showQRCode(data.address, "qrcode");

    localStorage.setItem("ztc_address", data.address);
    localStorage.setItem("ztc_wif", data.wif);
    manualSync();
  };
  reader.readAsText(file);
}

// === QR Scanner ===
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
    },
    () => {}
  );
}

// === Restore Wallet saat reload ===
window.addEventListener("DOMContentLoaded", () => {
  const savedAddr = localStorage.getItem("ztc_address");
  const savedWif = localStorage.getItem("ztc_wif");

  if (savedAddr) {
    document.getElementById("address").innerText = savedAddr;
    document.getElementById("wif").innerText = savedWif || "";
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(savedAddr)}`;
    showQRCode(savedAddr, "qrcode");
  }
});
