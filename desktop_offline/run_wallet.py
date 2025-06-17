import tkinter as tk
from offline_utils import sign_offline_tx

def run_app():
    win = tk.Tk()
    win.title("ZuttoChain Offline Wallet")
    label = tk.Label(win, text="ZuttoChain Offline Wallet", font=("Arial", 16))
    label.pack(pady=10)
    win.mainloop()

if __name__ == "__main__":
    run_app()