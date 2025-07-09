import * as secp from "https://esm.sh/@noble/secp256k1";
import { sha256 } from "https://esm.sh/@noble/hashes/sha256";

const API_BASE = "https://zuttocoin.ct.ws/api";

const toHex = (bytes) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

async function generateZTCWallet() {
  const entropy = crypto.getRandomValues(new Uint8Array(32));
  const privateKey = sha256(entropy);
  const privateKeyHex = toHex(privateKey);
  const publicKey = secp.getPublicKey(privateKey, false).slice(1);
  const addressHash = sha256(publicKey);
  const ztcAddress = "ZTCF" + toHex(addressHash.slice(-20)).toUpperCase();
  return { address: ztcAddress, privateKey: privateKeyHex };
}

function showQRCode(text, elementId) {
  const container = document.getElementById(elementId);
  container.innerHTML = "";
  new QRCode(container, { text, width: 128, height: 128 });
}

function saveLocalBalance(address, balance) {
  if (address) localStorage.setItem(`balance_${address}`, balance);
}

function loadLocalBalance(address) {
  return localStorage.getItem(`balance_${address}`) || 0;
}

async function fetchWithFallback(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error("Server error");
    return res;
  } catch (e) {
    console.warn("Fallback via CORS proxy");
    return fetch(`https://corsproxy.io/?${url}`, options);
  }
}

async function getFaucet() {
  const address = document.getElementById("address").innerText;
  if (!address) return alert("⚠️ Wallet belum dibuat!");

  try {
    const res = await fetchWithFallback(`${API_BASE}/faucet.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    const raw = await res.text();
    console.log("Faucet Raw:", raw);
    const data = JSON.parse(raw);
    document.getElementById("balance").innerText = `Balance: ${data.balance}`;
    saveLocalBalance(address, data.balance);
  } catch (err) {
    console.error("Faucet Error:", err);
    const offline = loadLocalBalance(address);
    alert("🟡 Gagal klaim faucet. Gunakan data lokal.");
    document.getElementById("balance").innerText = `Balance: ${offline}`;
  }
}

async function manualSync() {
  const address = document.getElementById("address").innerText;
  if (!address) return alert("⚠️ Wallet belum dibuat!");

  try {
    const res = await fetchWithFallback(`${API_BASE}/balance.php?address=${address}`);
    const raw = await res.text();
    console.log("Sync Raw:", raw);
    const data = JSON.parse(raw);
    document.getElementById("balance").innerText = `Balance: ${data.balance}`;
    saveLocalBalance(address, data.balance);
    alert("✅ Sync berhasil");
  } catch (err) {
    console.error("Sync error:", err);
    const local = loadLocalBalance(address);
    document.getElementById("balance").innerText = `Balance: ${local}`;
    alert("🟡 Server offline. Tampilkan balance lokal.");
  }
}

async function sendZTC() {
  const from = document.getElementById("address").innerText;
  const to = document.getElementById("send-to").value;
  const amount = Number(document.getElementById("send-amount").value);
  const privateKey = document.getElementById("wif").innerText;

  if (!from || !to || !amount || !privateKey) return alert("⚠️ Lengkapi form transaksi.");

  try {
    const res = await fetchWithFallback(`${API_BASE}/send.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, privateKey, to, amount }),
    });
    const raw = await res.text();
    console.log("Send Raw:", raw);
    const data = JSON.parse(raw);

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
  } catch (err) {
    console.error("Send error:", err);
    alert("🔴 Server offline. Coba lagi nanti.");
  }
}

window.Transaction = { send: sendZTC };

document.getElementById("genWallet").addEventListener("click", async () => {
  const { address, privateKey } = await generateZTCWallet();
  document.getElementById("address").innerText = address;
  document.getElementById("wif").innerText = privateKey;
  document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(address)}`;
  showQRCode(address, "qrcode");
  localStorage.setItem("ztc_address", address);
  localStorage.setItem("ztc_wif", privateKey);
  manualSync();
});

document.getElementById("importBtn").addEventListener("click", async () => {
  const wif = prompt("Masukkan Private Key (SHA256 hex):");
  if (!wif || wif.length !== 64) return alert("⚠️ Private key tidak valid");
  const privateKey = Uint8Array.from(wif.match(/.{1,2}/g).map(h => parseInt(h, 16)));
  const publicKey = secp.getPublicKey(privateKey, false).slice(1);
  const addressHash = sha256(publicKey);
  const ztcAddress = "ZTCF" + toHex(addressHash.slice(-20)).toUpperCase();
  document.getElementById("address").innerText = ztcAddress;
  document.getElementById("wif").innerText = wif;
  document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(ztcAddress)}`;
  showQRCode(ztcAddress, "qrcode");
  localStorage.setItem("ztc_address", ztcAddress);
  localStorage.setItem("ztc_wif", wif);
  manualSync();
});

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

window.backupWallet = backupWallet;
window.restoreWallet = restoreWallet;
window.startQRScan = startQRScan;
window.getFaucet = getFaucet;
