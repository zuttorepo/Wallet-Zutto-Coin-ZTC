# ZuttoWalletBackend
https://zuttorepo.github.io/Wallet_Zutto_Coin_ZTC/
Komponen backend dan offline wallet untuk ZuttoChain (ZTC).

## Struktur
- `backend/`: API FastAPI
- `signer/`: Signer dengan proteksi PIN
- `mobile_lib/`: Untuk Android bridge
- `desktop_offline/`: GUI wallet offline

## Jalankan
```bash
uvicorn backend.main:app --reload
python desktop_offline/run_wallet.py
```
