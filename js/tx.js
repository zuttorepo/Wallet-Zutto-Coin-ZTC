export const Transaction = {
  send: function () {
    const to = document.getElementById("send-to").value;
    const amount = document.getElementById("send-amount").value;
    const from = document.getElementById("address").innerText;

    if (!to || !amount) return alert("Alamat tujuan & jumlah harus diisi!");
    if (!from) return alert("Alamat pengirim tidak ditemukan!");

    alert(`🚀 Kirim ${amount} ZTC dari ${from} ke ${to}`);
  }
};
