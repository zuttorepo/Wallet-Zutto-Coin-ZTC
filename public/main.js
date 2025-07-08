// public/main.js
import { generateZTCAddress } from "../js/main.js";

let address = localStorage.getItem("ztc_address");

// Kalau belum ada address, generate baru
if (!address) {
  address = generateZTCAddress();
  localStorage.setItem("ztc_address", address);
}

// Tampilkan address ke UI
document.getElementById("ztc-address").innerText = address;

// Ambil saldo awal dari backend
async function fetchBalance() {
  const res = await fetch(`http://localhost:3000/balance/${address}`);
  const data = await res.json();
  document.getElementById("ztc-balance").innerText = `ZTC Balance: ${data.balance}`;
}

// Fungsi klaim faucet
async function claimZTC() {
  const res = await fetch("http://localhost:3000/faucet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address })
  });
  const data = await res.json();
  document.getElementById("ztc-balance").innerText = `ZTC Balance: ${data.balance}`;
}

// Event klik tombol faucet
document.getElementById("claim-button").addEventListener("click", claimZTC);

// Saat halaman pertama kali dibuka
fetchBalance();
