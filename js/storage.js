const Storage = (() => {
  const getWallets = () => JSON.parse(localStorage.getItem("wallets") || "[]");
  const saveWallets = (wallets) => localStorage.setItem("wallets", JSON.stringify(wallets));
  const setCurrentIndex = (index) => localStorage.setItem("currentIndex", index);
  const getCurrentIndex = () => parseInt(localStorage.getItem("currentIndex") || "0");

  const saveWallet = (wallet) => {
    const wallets = getWallets();
    wallets.push(wallet);
    saveWallets(wallets);
    setCurrentIndex(wallets.length - 1);
  };

  return {
    getWallets,
    saveWallets,
    setCurrentIndex,
    getCurrentIndex,
    saveWallet
  };
})();
