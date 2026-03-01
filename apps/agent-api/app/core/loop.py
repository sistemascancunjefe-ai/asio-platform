"""
ARIA Agent Loop — Núcleo de procesamiento
Groq (primary) + Anthropic (fallback)
"""

import os
import json
import logging
from pathlib import Path
from typing import Optional
from datetime import datetime, timedelta

from groq import AsyncGroq
import anthropic

logger = logging.getLogger(__name__)

# ── Paths ───────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
SOUL_PATH = BASE_DIR.parent / "ASIO_SOUL.md"
KNOWLEDGE_DIR = BASE_DIR / "knowledge"
SESSIONS_DIR = BASE_DIR / "sessions"
SESSIONS_DIR.mkdir(exist_ok=True)


def _load_soul() -> str:
    if SOUL_PATH.exists():
        return SOUL_PATH.read_text(encoding="utf-8")
    return "Eres ARIA, la IA de ASIO. Ayudas a los visitantes con información sobre servicios de automatización e IA."


def _load_knowledge() -> str:
    parts = []
    for fname in ["services.json", "portfolio.json", "faq.json"]:
        fpath = KNOWLEDGE_DIR / fname
        if fpath.exists():
            data = json.loads(fpath.read_text(encoding="utf-8"))
            parts.append(f"### {fname}\n```json\n{json.dumps(data, ensure_ascii=False, indent=2)}\n```")
    return "\n\n".join(parts)


class AgentLoop:
    def __init__(self):
        self.groq_client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY", ""))
        self.anthropic_client = anthropic.AsyncAnthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY", "")
        )
        self.model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.fallback_model = "claude-haiku-4-5-20251001"
        self.soul = _load_soul()
        self.knowledge = _load_knowledge()
        self._sessions: dict[str, list] = {}
        logger.info(f"AgentLoop initialized — primary: {self.model_name}")

    def _system_prompt(self, lang: str = "es") -> str:
        lang_note = (
            "Responde SIEMPRE en español mexicano."
            if lang == "es"
            else "Always respond in English."
        )
        return f"""{self.soul}

---
## IDIOMA
{lang_note}

---
## CATÁLOGO DE CONOCIMIENTO
{self.knowledge}

---
## INSTRUCCIONES ADICIONALES
- Fecha actual: {datetime.now().strftime('%d/%m/%Y')}
- Canal actual: Web (widget embebido)
- Si el usuario quiere hablar con un humano, da: https://wa.me/529988000000
- Máximo 3 párrafos por respuesta en web chat
- Usa markdown básico (bold, bullets) cuando ayude a la claridad
"""

    def _get_session(self, session_id: str) -> list:
        if session_id not in self._sessions:
            self._sessions[session_id] = []
        return self._sessions[session_id]

    def _append_session(self, session_id: str, role: str, content: str):
        history = self._get_session(session_id)
        history.append({"role": role, "content": content})
        # Keep last 20 messages to avoid context overflow
        if len(history) > 20:
            self._sessions[session_id] = history[-20:]

    async def process(
        self,
        message: str,
        session_id: str,
        channel: str = "web",
        lang: str = "es",
    ) -> str:
        self._append_session(session_id, "user", message)
        history = self._get_session(session_id)
        system = self._system_prompt(lang)

        # ── Try Groq first ─────────────────────────────────────────────
        try:
            response = await self._call_groq(system, history)
            self._append_session(session_id, "assistant", response)
            logger.info(f"[{session_id}] Groq OK — {len(response)} chars")
            return response
        except Exception as e:
            logger.warning(f"[{session_id}] Groq failed: {e} — falling back to Anthropic")

        # ── Fallback: Anthropic ────────────────────────────────────────
        try:
            response = await self._call_anthropic(system, history)
            self._append_session(session_id, "assistant", response)
            logger.info(f"[{session_id}] Anthropic fallback OK")
            return response
        except Exception as e:
            logger.error(f"[{session_id}] Both providers failed: {e}")
            return (
                "Lo siento, tuve un problema técnico momentáneo. "
                "Por favor contáctanos directamente en https://wa.me/529988000000 🙏"
                if lang == "es"
                else "Sorry, I had a technical issue. Please contact us at https://wa.me/529988000000 🙏"
            )

    async def _call_groq(self, system: str, history: list) -> str:
        resp = await self.groq_client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "system", "content": system}, *history],
            max_tokens=800,
            temperature=0.7,
        )
        return resp.choices[0].message.content.strip()

    async def _call_anthropic(self, system: str, history: list) -> str:
        resp = await self.anthropic_client.messages.create(
            model=self.fallback_model,
            system=system,
            messages=history,
            max_tokens=800,
        )
        return resp.content[0].text.strip()
