// wallet.js
const Wallet = (() => {
  const generateHex = (bytes = 32) => {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const sha256 = async (hex) => {
    const buffer = Uint8Array.from(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const keyToAddress = async (privateKey) => {
    const pub = await sha256(privateKey);
    return "ZTC" + pub.substring(0, 32).toUpperCase();
  };

  const generateWallet = async () => {
    const privateKey = generateHex(32);
    const address = await keyToAddress(privateKey);
    const wallet = { privateKey, address };

    const wallets = Storage.getWallets();
    wallets.push(wallet);
    Storage.saveWallets(wallets);
    Storage.setCurrentIndex(wallets.length - 1);
    return wallet;
  };

  const importPrivateKey = async (privateKey) => {
    if (!/^[0-9a-f]{64}$/i.test(privateKey)) {
      alert("❌ Private key harus 64 digit hex.");
      return null;
    }
    const address = await keyToAddress(privateKey);
    const wallet = { privateKey, address };

    const wallets = Storage.getWallets();
    wallets.push(wallet);
    Storage.saveWallets(wallets);
    Storage.setCurrentIndex(wallets.length - 1);
    return wallet;
  };

  const getWallet = () => {
    const index = Storage.getCurrentIndex();
    const wallets = Storage.getWallets();
    return wallets[index];
  };

  const getCurrentWallet = getWallet;

  const switchTo = (index) => {
    const wallets = Storage.getWallets();
    if (wallets[index]) {
      Storage.setCurrentIndex(index);
      location.reload();
    }
  };

  return {
    generateWallet,
    importPrivateKey,
    getWallet,
    getCurrentWallet,
    switchTo
  };
})();
