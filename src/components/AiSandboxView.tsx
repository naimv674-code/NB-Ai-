import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Brain, Loader2, Plus, Send, Trash2 } from 'lucide-react';
import type { BotConfig, UserRole } from '../lib/botRules';

interface AiSandboxViewProps {
  config: BotConfig;
  aiConfigured: boolean;
  onSaveConfig: (next: BotConfig) => Promise<void>;
}

interface LearnedFactItem {
  id: string;
  topic: string;
  fact: string;
  taughtBy: string;
  updatedAt: string;
}

interface ChatItem {
  id: string;
  sender: string;
  role: UserRole;
  input: string;
  reply: string | null;
  meta: string;
  isError?: boolean;
}

export function AiSandboxView({
  config,
  aiConfigured,
  onSaveConfig,
}: AiSandboxViewProps) {
  const [senderRole, setSenderRole] = useState<UserRole>('user');
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(config.aiSystemPrompt);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [history, setHistory] = useState<ChatItem[]>([]);
  const [facts, setFacts] = useState<LearnedFactItem[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [newFact, setNewFact] = useState('');
  const [savingFact, setSavingFact] = useState(false);

  const loadMemory = useCallback(async () => {
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.facts)) {
          setFacts(data.facts);
        }
      }
    } catch {
      // Keep existing list on transient error
    }
  }, []);

  useEffect(() => {
    void loadMemory();
  }, [loadMemory]);

  useEffect(() => {
    setSystemPrompt(config.aiSystemPrompt);
  }, [config.aiSystemPrompt]);

  const prefixSymbol = config.prefixMode === 'false' ? '' : config.prefixChar;

  const quickPrompts = [
    `${prefixSymbol}menu`,
    `${prefixSymbol}owner`,
    `${prefixSymbol}info`,
    `${prefixSymbol}time`,
    `${prefixSymbol}calc 25 * 4 + 10`,
    `${prefixSymbol}memory`,
    `${prefixSymbol}config`,
    `${prefixSymbol}mute`,
  ];

  const runTestMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const itemId = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setHistory((prev) => [
      {
        id: itemId,
        sender: senderRole,
        role: senderRole,
        input: trimmed,
        reply: '',
        meta: 'Streaming...',
      },
      ...prev,
    ]);
    setMessageInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, senderRole }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Failed to reach /api/ai/stream');
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
            triggered?: boolean;
            allowed?: boolean;
            usedAi?: boolean;
            command?: string;
            reason?: string;
            text?: string;
            error?: string;
          };

          if (payload.type === 'meta') {
            if (!payload.triggered) {
              setHistory((prev) =>
                prev.map((h) =>
                  h.id === itemId
                    ? {
                        ...h,
                        reply:
                          payload.reason ||
                          'Message did not trigger any command.',
                        meta: 'Ignored by prefix rule',
                      }
                    : h
                )
              );
            } else {
              setHistory((prev) =>
                prev.map((h) =>
                  h.id === itemId
                    ? {
                        ...h,
                        meta: payload.allowed
                          ? `${payload.usedAi ? 'Gemini AI' : 'Built-in'} · ${payload.command}`
                          : 'Blocked by permission policy',
                        isError: !payload.allowed,
                      }
                    : h
                )
              );
            }
          } else if (payload.type === 'chunk' && payload.text) {
            setHistory((prev) =>
              prev.map((h) =>
                h.id === itemId
                  ? { ...h, reply: (h.reply ?? '') + payload.text }
                  : h
              )
            );
          } else if (payload.type === 'error') {
            setHistory((prev) =>
              prev.map((h) =>
                h.id === itemId
                  ? {
                      ...h,
                      reply: payload.error || 'AI service returned an error.',
                      meta: 'Error',
                      isError: true,
                    }
                  : h
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
          };
          if (payload.type === 'chunk' && payload.text) {
            setHistory((prev) =>
              prev.map((h) =>
                h.id === itemId
                  ? { ...h, reply: (h.reply ?? '') + payload.text }
                  : h
              )
            );
          }
        } catch {
          // Ignore incomplete frame
        }
      }

      setHistory((prev) =>
        prev.map((h) =>
          h.id === itemId && !(h.reply ?? '').trim()
            ? {
                ...h,
                reply: 'No response returned for this input. Please try again.',
                meta: 'Empty response',
                isError: true,
              }
            : h
        )
      );
    } catch {
      setHistory((prev) =>
        prev.map((h) =>
          h.id === itemId
            ? {
                ...h,
                reply: 'Network error reaching /api/ai/stream.',
                meta: 'Network Error',
                isError: true,
              }
            : h
        )
      );
    } finally {
      setIsSending(false);
      setTimeout(() => {
        void loadMemory();
      }, 1500);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await runTestMessage(messageInput);
  };

  const handleSavePersona = async () => {
    setSavingPrompt(true);
    await onSaveConfig({ ...config, aiSystemPrompt: systemPrompt });
    setSavingPrompt(false);
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2000);
  };

  const handleAddFact = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newFact.trim()) return;
    setSavingFact(true);
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: newTopic, fact: newFact }),
      });
      if (res.ok) {
        setNewTopic('');
        setNewFact('');
        await loadMemory();
      }
    } finally {
      setSavingFact(false);
    }
  };

  const handleDeleteFact = async (id: string) => {
    await fetch(`/api/memory/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    await loadMemory();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          AI Assistant & Command Sandbox
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Test how NB Bot processes prefixes, permissions, and Gemini AI
          responses before or while your WhatsApp device is linked.
        </p>
      </div>

      {!aiConfigured && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900"
        >
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Gemini API token is not detected in environment secrets. Built-in
            commands (menu, owner, ping, config) still work; configure{' '}
            <code className="font-mono font-semibold">GEMINI_API_KEY</code> in
            Settings → Secrets to enable live AI replies.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section
          aria-label="Command and AI simulator"
          className="xl:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Simulate WhatsApp Message
              </h2>
              <p className="text-xs text-slate-500">
                Active prefix: <span className="font-mono">{config.prefixMode}</span>{' '}
                · Symbol: <span className="font-mono">{config.prefixChar}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="role-select"
                className="text-xs font-medium text-slate-600"
              >
                Sender Role
              </label>
              <select
                id="role-select"
                value={senderRole}
                onChange={(e) => setSenderRole(e.target.value as UserRole)}
                className="h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                <option value="user">All Users (0)</option>
                <option value="group_admin">Group Admin (3)</option>
                <option value="bot_admin">Bot Admin (2)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void runTestMessage(prompt)}
                disabled={isSending}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-mono text-slate-700 transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
            <input
              type="text"
              aria-label="WhatsApp test message"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Type a command (e.g. ${prefixSymbol}ai hello) or question...`}
              className="flex-1 h-11 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              disabled={isSending || !messageInput.trim()}
              className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {history.length === 0 ? (
              <div className="p-6 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Click a quick command above or enter a message to inspect how NB
                Bot responds.
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-medium text-slate-900">
                      {item.input}
                    </span>
                    <span>
                      {item.role} · {item.meta}
                    </span>
                  </div>
                  <pre
                    className={`text-xs whitespace-pre-wrap font-sans leading-relaxed ${
                      item.isError ? 'text-red-700' : 'text-slate-700'
                    }`}
                  >
                    {item.reply}
                  </pre>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="xl:col-span-5 space-y-6">
          <section
            aria-label="AI persona settings"
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-semibold text-slate-900">
                NB AI System Persona
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Server-side Gemini instructions used for WhatsApp replies
              </p>
            </div>

            <div>
              <label
                htmlFor="ai-persona-textarea"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Assistant Instructions
              </label>
              <textarea
                id="ai-persona-textarea"
                rows={6}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="button"
              onClick={handleSavePersona}
              disabled={savingPrompt}
              className="w-full h-10 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              {savingPrompt
                ? 'Saving Persona...'
                : promptSaved
                  ? 'Persona Saved'
                  : 'Update AI Persona'}
            </button>
          </section>

          <section
            aria-label="Bot learned memory"
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-emerald-600" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Saved Chat Context ({facts.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Full Gemini AI is always active; custom details from chats appear here
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddFact} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  aria-label="Topic to teach"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Topic (e.g. Office Hours)"
                  className="h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
                <input
                  type="text"
                  aria-label="Fact or answer to remember"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  placeholder="Fact (e.g. Open 9 AM - 6 PM)"
                  className="h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <button
                type="submit"
                disabled={savingFact || !newTopic.trim() || !newFact.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 disabled:opacity-60 text-xs font-medium text-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Custom Note
              </button>
            </form>

            {facts.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                NB AI already answers everything using full Gemini knowledge. Any custom business or personal details shared in WhatsApp chats are saved here automatically.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {facts.map((item) => (
                  <li
                    key={item.id}
                    className="py-2.5 flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {item.topic}
                      </div>
                      <div className="text-slate-600 break-words">
                        {item.fact}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteFact(item.id)}
                      aria-label={`Delete learned fact ${item.topic}`}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
