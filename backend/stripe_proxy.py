"""
Stripe Proxy Service - Uses emergentintegrations to proxy Stripe API calls.
Runs on port 8002 and serves the Node.js backend.
"""
import os
import json
import asyncio
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
import uvicorn

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

app = FastAPI(title="Stripe Proxy")

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
WEBHOOK_URL = os.environ.get("STRIPE_WEBHOOK_URL", "")


def get_stripe():
    return StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=WEBHOOK_URL)


class CreateSessionRequest(BaseModel):
    amount: float
    currency: str = "usd"
    product_name: str = "Payment"
    product_description: str = ""
    success_url: str
    cancel_url: str
    customer_email: Optional[str] = None
    metadata: Optional[Dict[str, str]] = None


class SessionStatusRequest(BaseModel):
    session_id: str


@app.post("/create-session")
async def create_session(req: CreateSessionRequest):
    try:
        sc = get_stripe()
        checkout_req = CheckoutSessionRequest(
            amount=req.amount,
            currency=req.currency,
            success_url=req.success_url,
            cancel_url=req.cancel_url,
            metadata=req.metadata or {},
        )
        result = await sc.create_checkout_session(checkout_req)
        return {"url": result.url, "session_id": result.session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/session-status/{session_id}")
async def session_status(session_id: str):
    try:
        sc = get_stripe()
        result = await sc.get_checkout_status(session_id)
        return {
            "status": result.status,
            "payment_status": result.payment_status,
            "amount_total": result.amount_total,
            "currency": result.currency,
            "metadata": result.metadata,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/handle-webhook")
async def handle_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("stripe-signature", "")
        sc = get_stripe()
        result = await sc.handle_webhook(body, signature)
        return {
            "event_type": result.event_type,
            "event_id": result.event_id,
            "session_id": result.session_id,
            "payment_status": result.payment_status,
            "metadata": result.metadata,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "service": "stripe-proxy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
