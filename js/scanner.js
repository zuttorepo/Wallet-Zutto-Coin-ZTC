// scanner.js
function startQRScan() {
  const preview = document.getElementById("camera-preview");
  preview.style.display = "block";

  const qrScanner = new Html5Qrcode("reader");
  qrScanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    (decoded) => {
      qrScanner.stop();
      preview.style.display = "none";
      document.getElementById("send-to").value = decoded;
      alert("✅ QR terdeteksi:\n" + decoded);
    },
    (err) => {
      console.warn("QR Scan error", err);
    }
  );
}
