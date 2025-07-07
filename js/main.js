function render(wallet) {
  const addrEl = document.getElementById("address");
  const wifEl = document.getElementById("wif");
  const qrEl = document.getElementById("qrcode");

  addrEl.textContent = "Address: " + wallet.address;
  wifEl.textContent = "Private Key: " + wallet.privateKey;
  qrEl.innerHTML = "";
  new QRCode(qrEl, {
    text: wallet.address,
    width: 160,
    height: 160
  });
}

window.onload = async () => {
  document.getElementById("genWallet").onclick = async () => {
    const wallet = await Wallet.generateWallet();
    render(wallet);
    await manualSync(); // langsung sync setelah generate
  };

  document.getElementById("importBtn").onclick = async () => {
    const input = prompt("Masukkan Private Key (64 hex):");
    if (!input) return;
    const wallet = await Wallet.importPrivateKey(input.trim());
    if (wallet) {
      render(wallet);
      await manualSync();
    }
  };

  // Cek dan render wallet saat load
  const saved = Wallet.getWallet();
  if (saved) {
    render(saved);
    await manualSync(); // Auto-sync saat load
    setInterval(manualSync, 5000); // Auto-sync setiap 5 detik
  }

  // Setup event listener untuk restore
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", restoreWallet);
  document.body.appendChild(fileInput);

  window.triggerRestore = () => fileInput.click();
};

async function encryptData(data, password) {
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    pwKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = enc.encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const result = new Uint8Array([...salt, ...iv, ...new Uint8Array(ciphertext)]);
  return btoa(String.fromCharCode(...result));
}

async function decryptData(b64, password) {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const data = raw.slice(28);
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    pwKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

async function manualSync() {
  const wallet = Wallet.getWallet();
  if (!wallet) return;

  try {
    // Simulasi data dari node
    const fakeBalance = (Math.random() * 10).toFixed(4);
    document.getElementById("balance").textContent = `Balance: ${fakeBalance}`;

    // Simulasi histori dummy
    const tbody = document.getElementById("tx-body");
    tbody.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>Sim Tx #${i + 1}</td><td>${(Math.random() * 2).toFixed(3)}</td><td>${new Date().toLocaleTimeString()}</td>`;
      tbody.appendChild(tr);
    }
  } catch (e) {
    console.error("Sync error:", e);
    alert("❌ Gagal sync (simulasi)");
  }
}


async function getFaucet() {
  const wallet = Wallet.getWallet();
  if (!wallet) return alert("Wallet belum ada");

  const nodeURL = document.getElementById("rpc-url")?.value || location.origin;
  try {
    const res = await fetch(`${nodeURL}/faucet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: wallet.address })
    });
    if (!res.ok) throw new Error("Faucet gagal");
    await manualSync();
  } catch (e) {
    alert("❌ Faucet gagal");
    console.error(e);
  }
}

async function backupWallet() {
  const wallet = Wallet.getWallet();
  const password = prompt("Masukkan password untuk backup:");
  if (!password) return;

  const encrypted = await encryptData(wallet, password);
  const blob = new Blob([encrypted], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `ztc-backup-${Date.now()}.txt`;
  a.click();
}

async function restoreWallet(event) {
  const file = event.target.files[0];
  if (!file) return;

  const password = prompt("Masukkan password backup:");
  if (!password) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const decrypted = await decryptData(reader.result, password);
      if (!decrypted.privateKey || !decrypted.address) {
        alert("❌ File tidak valid.");
        return;
      }
      Storage.saveWallet(decrypted);
      alert("✅ Wallet berhasil direstore!");
      location.reload();
    } catch (e) {
      alert("❌ Gagal restore: password salah atau file rusak.");
      console.error(e);
    }
  };
  reader.readAsText(file);
}
