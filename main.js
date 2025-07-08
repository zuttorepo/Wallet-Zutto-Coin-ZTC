// === GENERATE ADDRESS ===
function generateZTCAddress() {
  return "ZTCF" + Math.random().toString(36).substr(2, 10).toUpperCase();
}

// === QR CODE ===
function showQRCode(text, elementId) {
  const qrcodeContainer = document.getElementById(elementId);
  qrcodeContainer.innerHTML = ""; // Clear previous QR
  new QRCode(qrcodeContainer, {
    text: text,
    width: 128,
    height: 128
  });
}

// === BACKUP WALLET ===
function backupWallet() {
  const address = document.getElementById("address").innerText;
  if (!address) return alert("Belum ada wallet!");

  const data = {
    address: address,
    wif: document.getElementById("wif").innerText || ""
  };

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "ztc-wallet-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

// === RESTORE WALLET ===
function restoreWallet(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.address) {
        document.getElementById("address").innerText = data.address;
        document.getElementById("wif").innerText = data.wif || "";
        document.getElementById("balance").innerText = "Balance: 0";
        showQRCode(data.address, "qrcode");
        alert("Wallet berhasil direstore!");
      } else {
        alert("File tidak valid!");
      }
    } catch (err) {
      alert("Gagal membaca file wallet!");
    }
  };
  reader.readAsText(file);
}

// === IMPORT WALLET (Manual Input) ===
document.getElementById("importBtn").addEventListener("click", () => {
  const wif = prompt("Masukkan WIF (Dummy):");
  if (!wif) return;
  const addr = generateZTCAddress(); // Simulasi hasil dari WIF
  document.getElementById("address").innerText = addr;
  document.getElementById("wif").innerText = wif;
  document.getElementById("balance").innerText = "Balance: 0";
  showQRCode(addr, "qrcode");
});

// === GENERATE WALLET ===
document.getElementById("genWallet").addEventListener("click", () => {
  const addr = generateZTCAddress();
  document.getElementById("address").innerText = addr;
  document.getElementById("wif").innerText = "";
  document.getElementById("balance").innerText = "Balance: 0";
  showQRCode(addr, "qrcode");
});

// === FAUCET (simulasi fetch) ===
function getFaucet() {
  const addr = document.getElementById("address").innerText;
  if (!addr) return alert("Buat wallet dulu!");

  alert("💸 Simulasi klaim faucet untuk: " + addr);
  document.getElementById("balance").innerText = "Balance: 100";
}

// === SEND TRANSACTION (dummy) ===
function sendZTC() {
  const to = document.getElementById("send-to").value;
  const amount = document.getElementById("send-amount").value;
  const from = document.getElementById("address").innerText;

  if (!to || !amount) return alert("Lengkapi tujuan dan jumlah!");
  if (!from) return alert("Wallet belum di-generate!");

  alert(`🚀 Kirim ${amount} ZTC dari ${from} ke ${to}`);

  // Tambah ke history
  const tbody = document.getElementById("tx-body");
  const row = document.createElement("tr");
  row.innerHTML = `<td>To: ${to}</td><td>${amount}</td><td>${new Date().toLocaleString()}</td>`;
  tbody.prepend(row);
}
window.Transaction = { send: sendZTC };

// === SYNC (dummy) ===
function manualSync() {
  alert("🔁 Sync berhasil! (simulasi)");
}

// === QR SCANNER ===
function startQRScan() {
  const preview = document.getElementById("camera-preview");
  preview.style.display = "block";

  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      alert("QR Terdeteksi: " + decodedText);
      document.getElementById("send-to").value = decodedText;
      html5QrCode.stop();
      preview.style.display = "none";
    },
    (errorMsg) => {
      // console.warn("QR error", errorMsg);
    }
  );
}
