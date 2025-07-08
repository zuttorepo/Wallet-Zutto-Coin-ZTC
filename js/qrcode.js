// qrcode.js
const QRTool = {
  generate(el, text) {
    el.innerHTML = "";
    new QRCode(el, {
      text: text,
      width: 160,
      height: 160
    });
  }
};
