from fastapi import FastAPI, HTTPException
from walletlib import generate_address, sign_transaction
import config

app = FastAPI()

@app.get("/generate")
def generate():
    return generate_address()

@app.post("/sign")
def sign(tx_data: dict):
    try:
        return sign_transaction(tx_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))