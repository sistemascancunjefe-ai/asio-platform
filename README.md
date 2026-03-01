# ASIO Platform v2.0

> Automatización e Inteligencia para tu Negocio  
> Cancún, México · Astro 4 + FastAPI + WhatsApp/Telegram

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Marketing Site | Astro 4 + Bootstrap 5 + React Islands |
| Agent API | FastAPI + Groq (LLaMA 3.3) + Anthropic |
| Channels | WhatsApp Business API + Telegram Bot |
| Deployment | Cloudflare Pages + Render |
| CDN | Cloudflare Edge (200+ PoPs) |
| Routing | Cloudflare Workers (A/B rollout) |

---

## Estructura

```
asio-platform/
├── apps/
│   ├── marketing/          # Astro 4 — sitio web estático
│   └── agent-api/          # FastAPI — ARIA agent backend
├── workers/
│   ├── routing/            # Cloudflare Worker A/B routing
│   └── agent-bridge/       # Cloudflare Worker → Agent API
├── packages/
│   ├── ui/                 # Design system compartido
│   └── types/              # TypeScript types compartidos
├── .env.example
├── render.yaml             # Render deployment
└── turbo.json              # Monorepo build
```

---

## Quick Start

```bash
# 1. Instalar dependencias
cp .env.example .env   # Llenar variables
npm install            # Node deps (Turbo)

# 2. Marketing site
cd apps/marketing
npm install
npm run dev            # → http://localhost:3000

# 3. Agent API  
cd apps/agent-api
pip install poetry
poetry install
uvicorn app.main:app --reload --port 8001

# 4. Todo junto (Turbo)
npm run dev            # Desde raíz del monorepo
```

---

## Variables de Entorno

Ver `.env.example` para la lista completa. Mínimo requerido:

```bash
GROQ_API_KEY=...         # Proveedor LLM principal (FREE)
ANTHROPIC_API_KEY=...    # Fallback LLM
TELEGRAM_TOKEN=...       # Bot de Telegram (opcional)
WHATSAPP_TOKEN=...       # Meta Business API (opcional)
WHATSAPP_PHONE_ID=...
```

---

## Deploy

### Marketing → Cloudflare Pages
```bash
npm run build -w apps/marketing
wrangler pages deploy apps/marketing/dist --project-name=asio-marketing
```

### Agent API → Render
```bash
# Push a GitHub y Render detecta render.yaml automáticamente
# O usa render deploy hook
```

### Rollout gradual (Worker)
```bash
cd workers/routing
# Empieza en 5%
wrangler deploy

# Aumenta gradualmente:
# wrangler secret put ROLLOUT_PERCENT → 25 → 50 → 100
```

---

## Performance Targets

| Métrica | Target |
|---------|--------|
| Lighthouse | >95 |
| LCP (México) | <1.2s |
| JS Bundle | <60KB |
| Agent Response | <3s |
| Uptime | 99.9% |

---

## ARIA — El Agente

ARIA (ASIO Research & Intelligence Agent) es el agente conversacional de ASIO.

- **Canales**: Web widget, WhatsApp Business API, Telegram Bot
- **LLM**: Groq LLaMA 3.3 70B (primario) + Claude Haiku (fallback)  
- **Funciones**: Información de servicios, portafolio, cotizaciones, captura de leads
- **Configuración**: `apps/agent-api/ASIO_SOUL.md` + `app/knowledge/`

---

## Licencia

Propietario — ASIO © 2025. Todos los derechos reservados.
