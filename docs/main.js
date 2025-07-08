// === Generate ZTC Address ===
function generateZTCAddress() {
  return "ZTC" + crypto.getRandomValues(new Uint32Array(1))[0].toString(16).toUpperCase();
}

// === Generate Key (ECDSA P-256) ===
async function generateWallet() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  const rawKey = await crypto.subtle.exportKey("raw", keyPair.privateKey);
  const hexKey = [...new Uint8Array(rawKey)].map(b => b.toString(16).padStart(2, '0')).join('');
  const jwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const base64JWK = btoa(JSON.stringify(jwk));

  const address = generateZTCAddress();

  document.getElementById("address").innerText = address;
  document.getElementById("wif").innerText = hexKey;
  document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(address)}`;
  showQRCode(address, "qrcode");

  localStorage.setItem("ztc_address", address);
  localStorage.setItem("ztc_wif", base64JWK);
  manualSync();
}

// === Show QR ===
function showQRCode(text, elementId) {
  const container = document.getElementById(elementId);
  container.innerHTML = "";
  new QRCode(container, { text, width: 128, height: 128 });
}

// === Load & Save Local Balance ===
function loadLocalBalance(address) {
  return localStorage.getItem(`balance_${address}`) || 0;
}

function saveLocalBalance(address, balance) {
  if (address) localStorage.setItem(`balance_${address}`, balance);
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
    const local = loadLocalBalance(address);
    alert("🟡 Server offline. Menampilkan data lokal.");
    document.getElementById("balance").innerText = `Balance: ${local}`;
  }
}

// === Sync Manual ===
async function manualSync() {
  const address = document.getElementById("address").innerText;
  if (!address) return;
  try {
    const res = await fetch(`http://localhost:3000/balance/${address}`);
    const data = await res.json();
    document.getElementById("balance").innerText = `Balance: ${data.balance}`;
    saveLocalBalance(address, data.balance);
    alert("✅ Sync berhasil dari server.");
  } catch {
    const local = loadLocalBalance(address);
    document.getElementById("balance").innerText = `Balance: ${local}`;
    alert("🟡 Server offline. Tampilkan balance lokal.");
  }
}

// === Send ZTC ===
async function sendZTC() {
  const to = document.getElementById("send-to").value;
  const amount = Number(document.getElementById("send-amount").value);
  const from = document.getElementById("address").innerText;
  if (!to || !amount || !from) return alert("⚠️ Lengkapi form terlebih dahulu.");

  try {
    const res = await fetch("http://localhost:3000/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, amount }),
    });
    const data = await res.json();
    if (data.status === "success") {
      alert(`🚀 Sukses! TXID: ${data.txid}`);
      manualSync();

      const tbody = document.getElementById("tx-body");
      const row = document.createElement("tr");
      row.innerHTML = `<td>To: ${to}</td><td>${amount}</td><td>${new Date().toLocaleString()}</td>`;
      tbody.prepend(row);
    } else {
      alert("❌ Gagal: " + data.message);
    }
  } catch {
    alert("🔴 Gagal kirim. Server offline.");
  }
}
window.Transaction = { send: sendZTC };

// === Import Wallet ===
document.getElementById("importBtn").addEventListener("click", async () => {
  const base64 = prompt("Masukkan WIF (Base64):");
  if (!base64) return;
  const jwk = JSON.parse(atob(base64));
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const hexKey = [...new Uint8Array(rawKey)].map(b => b.toString(16).padStart(2, '0')).join('');

  const addr = generateZTCAddress();
  document.getElementById("address").innerText = addr;
  document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(addr)}`;
  showQRCode(addr, "qrcode");
  localStorage.setItem("ztc_address", addr);
  localStorage.setItem("ztc_wif", base64);
  document.getElementById("wif").innerText = hexKey;
  manualSync();
});

// === Restore Wallet ===
function restoreWallet(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function (e) {
    const data = JSON.parse(e.target.result);
    const { address, wif: base64 } = data;
    const jwk = JSON.parse(atob(base64));
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const hexKey = [...new Uint8Array(rawKey)].map(b => b.toString(16).padStart(2, '0')).join('');
    document.getElementById("address").innerText = address;
    document.getElementById("wif").innerText = hexKey;
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(address)}`;
    showQRCode(address, "qrcode");
    localStorage.setItem("ztc_address", address);
    localStorage.setItem("ztc_wif", base64);
    manualSync();
  };
  reader.readAsText(file);
}

// === Backup Wallet ===
function backupWallet() {
  const address = localStorage.getItem("ztc_address");
  const wif = localStorage.getItem("ztc_wif");
  const data = { address, wif };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ztc-wallet-backup.json";
  a.click();
}

// === QR Scanner ===
function startQRScan() {
  const preview = document.getElementById("camera-preview");
  preview.style.display = "block";
  const scanner = new Html5Qrcode("reader");
  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      document.getElementById("send-to").value = decodedText;
      scanner.stop().then(() => {
        preview.style.display = "none";
      });
    }
  );
}

// === Restore Wallet on Load ===
window.addEventListener("DOMContentLoaded", async () => {
  const savedAddr = localStorage.getItem("ztc_address");
  const savedWif = localStorage.getItem("ztc_wif");
  if (savedAddr && savedWif) {
    const jwk = JSON.parse(atob(savedWif));
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const hexKey = [...new Uint8Array(rawKey)].map(b => b.toString(16).padStart(2, '0')).join('');
    document.getElementById("address").innerText = savedAddr;
    document.getElementById("wif").innerText = hexKey;
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(savedAddr)}`;
    showQRCode(savedAddr, "qrcode");
    manualSync();
 });

// === Generate Wallet Button ===
document.getElementById("genWallet").addEventListener("click", generateWallet);
