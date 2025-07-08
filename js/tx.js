// tx.js
const Transaction = (() => {
  const send = async () => {
    const wallet = Wallet.getWallet();
    if (!wallet) return alert("❌ Wallet tidak ditemukan");

    const to = document.getElementById("send-to").value.trim();
    const amount = parseFloat(document.getElementById("send-amount").value);

    if (!/^ZTC[A-F0-9]{32}$/i.test(to)) {
      return alert("❌ Alamat tidak valid");
    }

    if (isNaN(amount) || amount <= 0) {
      return alert("❌ Jumlah tidak valid");
    }

    const confirmSend = confirm(`Kirim ${amount} ZTC ke ${to}?`);
    if (!confirmSend) return;

    try {
      const res = await fetch("http://localhost:3000/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "99b97c92848f4cc2a9910b50519efe43"
        },
        body: JSON.stringify({
          from: wallet.address,
          privateKey: wallet.privateKey,
          to,
          amount
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Gagal mengirim");

      alert("✅ Transaksi berhasil dikirim!");
      document.getElementById("send-to").value = "";
      document.getElementById("send-amount").value = "";
      await manualSync();
    } catch (err) {
      console.error(err);
      alert("❌ Gagal mengirim: " + err.message);
    }
  };

  return { send };
})();
