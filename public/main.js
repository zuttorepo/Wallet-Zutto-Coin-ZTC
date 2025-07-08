import { generateZTCAddress } from "../js/wallet.js";
import { showQRCode } from "../js/qrcode.js";
import { Transaction } from "../js/tx.js";

// === GENERATE WALLET ===
document.getElementById("genWallet").addEventListener("click", () => {
  const addr = generateZTCAddress();
  document.getElementById("address").innerText = addr;
  showQRCode(addr, "qrcode");

  // Reset balance display
  document.getElementById("balance").innerText = "Balance: 0";
});

// === FAUCET CLAIM ===
window.getFaucet = async function () {
  const addr = document.getElementById("address").innerText;
  if (!addr) return alert("⚠️ Wallet belum dibuat!");

  try {
    const res = await fetch("http://localhost:3000/faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: addr })
    });
    const data = await res.json();
    document.getElementById("balance").innerText = `Balance: ${data.balance}`;
  } catch (err) {
    console.error("❌ Gagal klaim faucet:", err);
    alert("Gagal klaim faucet. Periksa koneksi server.");
  }
};

// === KIRIM ZTC ===
console.log("Transaction object:", Transaction);
window.Transaction = Transaction;
