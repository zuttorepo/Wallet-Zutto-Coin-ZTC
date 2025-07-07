// qrcode.js
const QRCode = {
  generate(el, text) {
    el.innerHTML = "";
    new QRCode(el, {
      text: text,
      width: 160,
      height: 160
    });
  }
};
