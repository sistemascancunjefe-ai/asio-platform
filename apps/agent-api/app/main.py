"""
ASIO Agent API v2.0
FastAPI backend para ARIA — ASIO Research & Intelligence Agent
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os

from app.core.loop import AgentLoop
from app.channels.whatsapp import router as whatsapp_router
from app.channels.telegram_channel import setup_telegram

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ASIO Agent API",
    description="ARIA — ASIO Research & Intelligence Agent",
    version="2.0.0",
    docs_url="/docs" if os.getenv("ENV") != "production" else None,
)

# ── CORS ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://asiomarketing.com",
        "https://asio-marketing.pages.dev",
        "http://localhost:3000",
        "http://localhost:4321",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Routers ─────────────────────────────────────────────────────────────
app.include_router(whatsapp_router)

# ── Agent singleton ─────────────────────────────────────────────────────
agent = AgentLoop()


@app.on_event("startup")
async def startup():
    await setup_telegram(agent)
    logger.info("✅ ASIO Agent API started — ARIA is online")


@app.get("/health")
async def health():
    return {"status": "ok", "agent": "ARIA v2.0", "model": agent.model_name}


# ── Web Chat endpoint ────────────────────────────────────────────────────
@app.post("/api/chat")
async def web_chat(request: Request):
    body = await request.json()
    message = body.get("message", "").strip()
    session_id = body.get("session_id", "web-anon")
    lang = body.get("lang", "es")

    if not message:
        return JSONResponse({"error": "empty message"}, status_code=400)
    if len(message) > 1000:
        return JSONResponse({"error": "message too long"}, status_code=400)

    response = await agent.process(
        message=message,
        session_id=session_id,
        channel="web",
        lang=lang,
    )
    return {"response": response, "session_id": session_id}
