import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'aria';
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  lang?: 'es' | 'en';
  agentUrl?: string;
}

const QUICK_PROMPTS = {
  es: [
    '¿Qué servicios ofrecen?',
    'Necesito automatizar procesos',
    'Ver portafolio',
    '¿Cuánto cuesta?',
  ],
  en: [
    'What services do you offer?',
    'I need to automate processes',
    'View portfolio',
    'What are the prices?',
  ],
};

const WELCOME = {
  es: 'Hola 👋 Soy **ARIA**, la IA de ASIO. ¿En qué puedo ayudarte hoy? Puedo mostrarte nuestros servicios, portafolio o generarte una cotización.',
  en: 'Hi 👋 I\'m **ARIA**, ASIO\'s AI assistant. How can I help you today? I can show you our services, portfolio, or generate a quote.',
};

function renderContent(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export default function ChatWidget({ lang = 'es', agentUrl = '/api/chat' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'aria',
      content: WELCOME[lang],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `web-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(agentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId, lang }),
      });

      if (!res.ok) throw new Error('Agent error');

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'aria',
          content: data.response || (lang === 'es' ? 'Lo siento, ocurrió un error. Intenta de nuevo.' : 'Sorry, an error occurred. Please try again.'),
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'aria',
          content: lang === 'es'
            ? '⚠️ No pude conectarme al servidor. Por favor contáctanos por [WhatsApp](https://wa.me/529988000000).'
            : '⚠️ Could not connect to server. Please contact us on [WhatsApp](https://wa.me/529988000000).',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6738FF 0%, #00D4FF 100%)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#fff',
          boxShadow: '0 4px 24px rgba(103,56,255,0.5)',
          zIndex: 9999,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat con ARIA'}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '360px',
            maxHeight: '520px',
            background: '#1A1A2E',
            border: '1px solid rgba(103,56,255,0.3)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9998,
            boxShadow: '0 8px 48px rgba(103,56,255,0.3)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #6738FF 0%, #4F28CC 100%)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              🤖
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>ARIA</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                <span style={{ color: '#4ADE80' }}>●</span>{' '}
                {lang === 'es' ? 'En línea' : 'Online'} · ASIO AI
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <a
                href="https://wa.me/529988000000"
                target="_blank"
                rel="noopener"
                style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', textDecoration: 'none' }}
                title="WhatsApp"
              >
                💬
              </a>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #6738FF, #4F28CC)'
                      : 'rgba(255,255,255,0.05)',
                    border: msg.role === 'aria' ? '1px solid rgba(103,56,255,0.2)' : 'none',
                    color: '#E8E8F0',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', gap: '6px', padding: '8px 14px' }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#6738FF',
                      animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div
              style={{
                padding: '8px 12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              {QUICK_PROMPTS[lang].map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  style={{
                    background: 'rgba(103,56,255,0.1)',
                    border: '1px solid rgba(103,56,255,0.25)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    color: '#A78BFA',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(103,56,255,0.15)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lang === 'es' ? 'Escribe tu mensaje...' : 'Type your message...'}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(103,56,255,0.25)',
                borderRadius: '24px',
                padding: '10px 16px',
                color: '#E8E8F0',
                fontSize: '14px',
                outline: 'none',
              }}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #6738FF, #00D4FF)'
                  : 'rgba(255,255,255,0.1)',
                border: 'none',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                color: '#fff',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
