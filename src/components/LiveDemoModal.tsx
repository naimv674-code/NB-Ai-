import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Bot, Loader2, Send, X } from 'lucide-react';
import type { BotConfig } from '../lib/botRules';
import { UI_TRANSLATIONS, type UiLanguageCode } from '../lib/i18n';

interface LiveDemoModalProps {
  open: boolean;
  onClose: () => void;
  onProceedToLink: () => void;
  config: BotConfig;
  language: UiLanguageCode;
}

interface DemoMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export function LiveDemoModal({
  open,
  onClose,
  onProceedToLink,
  config,
  language,
}: LiveDemoModalProps) {
  const [sessionKey] = useState(
    () => `demo-${Math.random().toString(36).slice(2, 10)}`
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hi! 😊 I'm NB WhatsApp AI — ready to answer any question, write replies for you, translate, or solve 1TB+/100TB+ technical topics automatically in বাংলা, English, हिन्दी, اردو, العربية, Malay, Indonesian, தமிழ், or 中文! ✨🚀`,
    },
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const t = UI_TRANSLATIONS[language];
  const isRtl = language === 'ar' || language === 'ur';

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!open) return null;

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading) return;

    const botMsgId = `b-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: 'user', text },
      { id: botMsgId, sender: 'bot', text: '' },
    ]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          senderRole: 'user',
          demoMode: true,
          sessionKey,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Streaming connection failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith('data:')) continue;
          const payload = JSON.parse(line.slice(5).trim()) as {
            type: string;
            text?: string;
            error?: string;
          };
          if (payload.type === 'chunk' && payload.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, text: m.text + payload.text }
                  : m
              )
            );
          } else if (payload.type === 'error') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, text: payload.error || 'AI request failed.' }
                  : m
              )
            );
          }
        }
      }

      if (buffer.trim().startsWith('data:')) {
        try {
          const payload = JSON.parse(buffer.trim().slice(5).trim()) as {
            type: string;
            text?: string;
            error?: string;
          };
          if (payload.type === 'chunk' && payload.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, text: m.text + payload.text }
                  : m
              )
            );
          }
        } catch {
          // Ignore incomplete trailing frame
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId && !m.text.trim()
            ? {
                ...m,
                text: '⚠️ একটু নেটওয়ার্ক সমস্যা হয়েছে, অনুগ্রহ করে আবার লিখুন। 😊',
              }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, text: 'Network error reaching NB Bot server.' }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="demo-modal-title"
                className="text-sm font-semibold text-white truncate"
              >
                {t.demoTitle}
              </h2>
              <p className="text-xs text-slate-300 truncate">
                {t.demoSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close live preview modal"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-100/70 min-h-[300px]"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                {msg.text ? (
                  <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                    ...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 bg-white border-t border-slate-200 space-y-3"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              aria-label="Ask NB Bot anything in live demo"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.demoPlaceholder}
              className="flex-1 h-10 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {config.brandName} · Owner: {config.ownerName}
            </span>
            <button
              type="button"
              onClick={onProceedToLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>{t.demoConnectBtn}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
