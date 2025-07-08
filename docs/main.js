// main.js (versi lengkap dengan ECDSA + Web Crypto)

// === Generate Wallet with Web Crypto API ===
async function generateZTCWallet() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["sign", "verify"]
  );

  const rawPubKey = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
  const pubHex = Array.from(new Uint8Array(rawPubKey)).map(b => b.toString(16).padStart(2, '0')).join('');

  const hash = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(pubHex)).toString();
  const address = "ZTC" + hash.substring(0, 36).toUpperCase();

  const privJWK = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const wif = btoa(JSON.stringify(privJWK));

  return { address, wif };
}

// === QR Code ===
function showQRCode(text, elementId) {
  const qrcodeContainer = document.getElementById(elementId);
  qrcodeContainer.innerHTML = "";
  new QRCode(qrcodeContainer, { text, width: 128, height: 128 });
}

// === Local Balance ===
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
      body: JSON.stringify({ address })
    });
    const data = await res.json();
    document.getElementById("balance").innerText = `Balance: ${data.balance}`;
    saveLocalBalance(address, data.balance);
  } catch {
    alert("🟡 Server offline. Menampilkan data lokal.");
    const bal = loadLocalBalance(address);
    document.getElementById("balance").innerText = `Balance: ${bal}`;
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
    alert("🟡 Server offline. Menampilkan data lokal.");
    const bal = loadLocalBalance(address);
    document.getElementById("balance").innerText = `Balance: ${bal}`;
  }
}

// === Kirim ZTC ===
async function sendZTC() {
  const to = document.getElementById("send-to").value;
  const amount = Number(document.getElementById("send-amount").value);
  const from = document.getElementById("address").innerText;
  const privateKey = document.getElementById("wif").innerText;

  if (!to || !amount || !from || !privateKey) return alert("⚠️ Lengkapi semua data!");

  try {
    const res = await fetch("http://localhost:3000/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, amount })
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
    alert("🔴 Gagal kirim. Server offline.");
  }
}

// === Generate Wallet ===
document.getElementById("wif").innerText = privateKeyHex; // ⬅️ HEX tampilkan ke user
  const wallet = await generateZTCWallet();
  document.getElementById("address").innerText = wallet.address;
  document.getElementById("wif").innerText = wallet.wif;
  document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(wallet.address)}`;
  showQRCode(wallet.address, "qrcode");
localStorage.setItem("ztc_address", address);
localStorage.setItem("ztc_wif", base64PrivateJWK); // ⬅️ Simpan BASE64 ke localStorage
  manualSync();
});

// === Import Wallet ===
document.getElementById("importBtn").addEventListener("click", () => {
  const wif = prompt("Masukkan WIF:");
  if (!wif) return;
  try {
    const jwk = JSON.parse(atob(wif));
    const hash = CryptoJS.SHA256(wif).toString();
    const address = "ZTC" + hash.substring(0, 36).toUpperCase();

    document.getElementById("address").innerText = address;
    document.getElementById("wif").innerText = wif;
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(address)}`;
    showQRCode(address, "qrcode");
    localStorage.setItem("ztc_address", address);
    localStorage.setItem("ztc_wif", wif);
    manualSync();
  } catch {
    alert("❌ WIF tidak valid");
  }
});

// === Backup ===
function backupWallet() {
  const address = document.getElementById("address").innerText;
  const base64Wif = localStorage.getItem("ztc_wif"); // Ambil BASE64-nya dari storage

  const data = { address, wif: base64Wif };
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
  reader.onload = async function (e) {
    const data = JSON.parse(e.target.result);
    const { address, wif: base64Wif } = data;

    // Decode Base64 JWK ke HEX untuk ditampilkan
    const jwk = JSON.parse(atob(base64Wif));
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign"]
    );
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const hexKey = [...new Uint8Array(rawKey)].map(b => b.toString(16).padStart(2, '0')).join('');

    document.getElementById("address").innerText = address;
    document.getElementById("wif").innerText = hexKey;
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(address)}`;
    showQRCode(address, "qrcode");

    localStorage.setItem("ztc_address", address);
    localStorage.setItem("ztc_wif", base64Wif);

    manualSync(); // ✅ auto sync
  };
  reader.readAsText(file);
}


// === QR SCAN ===
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
    (err) => {}
  );
}

// === Restore Wallet on Reload ===
window.addEventListener("DOMContentLoaded", async () => {
  const savedAddr = localStorage.getItem("ztc_address");
  const savedWif = localStorage.getItem("ztc_wif");

  if (savedAddr && savedWif) {
    const jwk = JSON.parse(atob(savedWif));
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign"]
    );
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const hexKey = [...new Uint8Array(rawKey)].map(b => b.toString(16).padStart(2, '0')).join('');

    document.getElementById("address").innerText = savedAddr;
    document.getElementById("wif").innerText = hexKey;
    document.getElementById("balance").innerText = `Balance: ${loadLocalBalance(savedAddr)}`;
    showQRCode(savedAddr, "qrcode");
  }
});

// Ekspor
window.Transaction = { send: sendZTC };
