"""
WhatsApp Business API Channel
Meta Business API v18+ webhook handler
"""

import os
import logging
import httpx
from fastapi import APIRouter, Request, Response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["whatsapp"])

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "asio_verify_2025")
PHONE_ID = os.getenv("WHATSAPP_PHONE_ID", "")
WA_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
META_API = "https://graph.facebook.com/v18.0"

# Agent reference (set from main.py)
_agent = None


def set_agent(agent):
    global _agent
    _agent = agent


# ── Webhook verification ────────────────────────────────────────────────
@router.get("")
async def verify_webhook(request: Request):
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified ✅")
        return Response(content=challenge, media_type="text/plain")

    logger.warning("WhatsApp webhook verification failed")
    return Response(status_code=403)


# ── Incoming messages ────────────────────────────────────────────────────
@router.post("")
async def receive_message(request: Request):
    body = await request.json()

    try:
        entry = body.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if not messages:
            return {"status": "no_message"}

        msg = messages[0]
        wa_id = msg.get("from")
        msg_type = msg.get("type")

        # Only process text for now
        if msg_type != "text":
            await _send_wa_message(
                wa_id,
                "Por ahora solo proceso texto 📝 Escríbeme tu consulta."
            )
            return {"status": "non_text_ignored"}

        text = msg["text"]["body"]
        session_id = f"wa-{wa_id}"

        logger.info(f"[WA] {wa_id}: {text[:80]}")

        if _agent:
            response = await _agent.process(
                message=text,
                session_id=session_id,
                channel="whatsapp",
                lang="es",
            )
            # WhatsApp max 4096 chars
            await _send_wa_message(wa_id, response[:4090])

    except Exception as e:
        logger.error(f"WhatsApp handler error: {e}")

    return {"status": "ok"}


async def _send_wa_message(to: str, text: str):
    if not PHONE_ID or not WA_TOKEN:
        logger.warning("WhatsApp credentials not configured")
        return

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{META_API}/{PHONE_ID}/messages",
            headers={
                "Authorization": f"Bearer {WA_TOKEN}",
                "Content-Type": "application/json",
            },
            json={
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": to,
                "type": "text",
                "text": {"preview_url": False, "body": text},
            },
            timeout=10,
        )
        if resp.status_code != 200:
            logger.error(f"WhatsApp send error: {resp.status_code} {resp.text}")
