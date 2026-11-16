import { useCallback, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { DEFAULT_BOT_CONFIG, type BotConfig } from './lib/botRules';
import type { UiLanguageCode } from './lib/i18n';
import type { ActiveTab, HealthInfo, WhatsAppSessionSnapshot } from './types';
import { Sidebar } from './components/Sidebar';
import { DeviceLinkView } from './components/DeviceLinkView';
import { BotConfigView } from './components/BotConfigView';
import { AiSandboxView } from './components/AiSandboxView';
import { LiveDemoModal } from './components/LiveDemoModal';

const TAB_TITLES: Record<ActiveTab, string> = {
  link: 'Device Link',
  config: 'Bot Config',
  ai: 'AI & Commands',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('link');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<UiLanguageCode>('en');
  const [config, setConfig] = useState<BotConfig>(DEFAULT_BOT_CONFIG);
  const [health, setHealth] = useState<HealthInfo>({
    ok: true,
    brand: 'NB',
    owner: 'NAIM',
    aiConfigured: true,
    activeSessions: 0,
  });
  const [session, setSession] = useState<WhatsAppSessionSnapshot | null>(null);
  const [isPairingSubmitting, setIsPairingSubmitting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [healthRes, configRes, sessionsRes] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/config'),
          fetch('/api/whatsapp/sessions'),
        ]);
        if (healthRes.ok) {
          setHealth(await healthRes.json());
        }
        if (configRes.ok) {
          const data = await configRes.json();
          if (data.config) setConfig(data.config);
        }
        if (sessionsRes.ok) {
          const sData = await sessionsRes.json();
          if (Array.isArray(sData.sessions) && sData.sessions.length > 0) {
            setSession(sData.sessions[0]);
          }
        }
      } catch {
        // Keep defaults if initial fetch fails
      }
    };
    void loadInitial();
  }, []);

  const sessionId = session?.sessionId;
  const sessionStatus = session?.status ?? 'idle';

  useEffect(() => {
    if (
      !sessionId ||
      sessionStatus === 'disconnected' ||
      sessionStatus === 'error'
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/status/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            setSession(data.session);
          }
        }
      } catch {
        // Ignore transient polling error
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [sessionId, sessionStatus]);

  const handleStartPairing = useCallback(
    async (countryIso: string, phoneNumber: string) => {
      setIsPairingSubmitting(true);
      setPairingError(null);
      try {
        const res = await fetch('/api/whatsapp/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            countryIso,
            phoneNumber,
            sessionId: session?.sessionId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setPairingError(data.error || 'Failed to initiate pairing request.');
          return;
        }
        if (data.session) {
          setSession(data.session);
        }
      } catch {
        setPairingError(
          'Unable to reach NB Bot server to start WhatsApp pairing.'
        );
      } finally {
        setIsPairingSubmitting(false);
      }
    },
    [session?.sessionId]
  );

  const handleDisconnect = useCallback(async () => {
    if (!session?.sessionId) return;
    try {
      await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
      setSession(null);
      setPairingError(null);
    } catch {
      setPairingError('Failed to disconnect session.');
    }
  }, [session?.sessionId]);

  const handleSaveConfig = useCallback(async (next: BotConfig) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
      }
    } finally {
      setIsSavingConfig(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        sessionStatus={sessionStatus}
        aiConfigured={health.aiConfigured}
        config={config}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-8 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="font-semibold text-slate-900 whitespace-nowrap">
                {config.brandName} Console
              </span>
              <span className="text-slate-400" aria-hidden="true">
                /
              </span>
              <span className="text-slate-600 whitespace-nowrap">
                {TAB_TITLES[activeTab]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveTab(activeTab === 'link' ? 'config' : 'link')
            }
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activeTab === 'link' ? 'Bot Rules' : 'Pair Device'}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {activeTab === 'link' && (
            <DeviceLinkView
              session={session}
              onStartPairing={handleStartPairing}
              onDisconnect={handleDisconnect}
              onOpenDemo={() => setDemoOpen(true)}
              language={uiLanguage}
              onChangeLanguage={setUiLanguage}
              isSubmitting={isPairingSubmitting}
              apiError={pairingError}
            />
          )}

          {activeTab === 'config' && (
            <BotConfigView
              config={config}
              onSaveConfig={handleSaveConfig}
              isSaving={isSavingConfig}
            />
          )}

          {activeTab === 'ai' && (
            <AiSandboxView
              config={config}
              aiConfigured={health.aiConfigured}
              onSaveConfig={handleSaveConfig}
            />
          )}
        </main>

        <LiveDemoModal
          open={demoOpen}
          onClose={() => setDemoOpen(false)}
          onProceedToLink={() => {
            setDemoOpen(false);
            setActiveTab('link');
            setTimeout(() => {
              document.getElementById('phone-input')?.focus();
            }, 60);
          }}
          config={config}
          language={uiLanguage}
        />

        <footer className="px-4 sm:px-8 py-4 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            {config.brandName} Company · Owner: {config.ownerName} ·{' '}
            {config.ownerEmail} · Facebook: {config.ownerFacebook}
          </span>
          <span>Multi-Device WhatsApp Automation</span>
        </footer>
      </div>
    </div>
  );
}
