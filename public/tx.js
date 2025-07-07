const Transaction = (() => {
  const send = async () => {
    const wallet = Wallet.getWallet();
    if (!wallet) return alert("❌ Wallet belum ada");

    const to = document.getElementById("send-to").value.trim();
    const amount = parseFloat(document.getElementById("send-amount").value);
    const nodeURL = document.getElementById("rpc-url").value || "http://localhost:3000";

    if (!to || isNaN(amount) || amount <= 0) {
      return alert("❌ Alamat tujuan dan jumlah harus valid!");
    }

    try {
      const res = await fetch(`${nodeURL}/wallet/${wallet.address}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, amount })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengirim");
      }

      const data = await res.json();
      alert("✅ Transaksi berhasil!");
      await manualSync();
    } catch (err) {
      alert("❌ Gagal mengirim: " + err.message);
    }
  };

  return { send };
})();
