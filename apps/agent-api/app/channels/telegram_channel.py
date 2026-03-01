"""
Telegram Channel para ARIA
python-telegram-bot async
"""

import os
import logging
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

logger = logging.getLogger(__name__)
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "")

_tg_app = None


async def setup_telegram(agent):
    if not TELEGRAM_TOKEN:
        logger.warning("TELEGRAM_TOKEN not set — Telegram channel disabled")
        return

    global _tg_app

    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(
            "👋 ¡Hola! Soy **ARIA**, la IA de ASIO.\n\n"
            "Puedo ayudarte con:\n"
            "• 🤖 Información sobre servicios\n"
            "• 📊 Ver nuestro portafolio\n"
            "• 💡 Cotizaciones rápidas\n\n"
            "¿En qué puedo ayudarte?",
            parse_mode="Markdown",
        )

    async def handle_message(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        user_id = str(update.effective_user.id)
        text = update.message.text

        if not text:
            await update.message.reply_text("Solo proceso texto por ahora 📝")
            return

        await update.message.chat.send_action("typing")

        response = await agent.process(
            message=text,
            session_id=f"tg-{user_id}",
            channel="telegram",
            lang="es",
        )
        # Telegram max 4096 chars
        await update.message.reply_text(response[:4090], parse_mode="Markdown")

    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    _tg_app = app
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)
    logger.info("✅ Telegram bot started")
