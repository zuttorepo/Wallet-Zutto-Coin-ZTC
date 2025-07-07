const Storage = (() => {
  const getWallets = () => JSON.parse(localStorage.getItem("wallets") || "[]");
  const saveWallets = (data) => localStorage.setItem("wallets", JSON.stringify(data));
  const getCurrentIndex = () => parseInt(localStorage.getItem("currentIndex") || "0");
  const setCurrentIndex = (i) => localStorage.setItem("currentIndex", i);

  const getWallet = () => getWallets()[getCurrentIndex()];
  const saveWallet = (wallet) => {
    const wallets = getWallets();
    wallets.push(wallet);
    saveWallets(wallets);
    setCurrentIndex(wallets.length - 1);
  };

  return {
    getWallets,
    saveWallets,
    getCurrentIndex,
    setCurrentIndex,
    getWallet,
    saveWallet,
  };
})();
const Storage = {
  getWallets: () => {
    return JSON.parse(localStorage.getItem("wallets") || "[]");
  },
  saveWallets: (wallets) => {
    localStorage.setItem("wallets", JSON.stringify(wallets));
  },
  setCurrentIndex: (index) => {
    localStorage.setItem("currentIndex", index);
  },
  getCurrentIndex: () => {
    return parseInt(localStorage.getItem("currentIndex") || "0");
  },
  saveWallet: (wallet) => {
    const wallets = Storage.getWallets();
    wallets.push(wallet);
    Storage.saveWallets(wallets);
    Storage.setCurrentIndex(wallets.length - 1);
  }
};
