import { Bot, Link2, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { formatOwnerPhoneDisplay, type BotConfig } from '../lib/botRules';
import type { ActiveTab, SessionStatus } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  sessionStatus: SessionStatus;
  aiConfigured: boolean;
  config: BotConfig;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: {
  id: ActiveTab;
  label: string;
  subtitle: string;
  icon: typeof Link2;
}[] = [
  {
    id: 'link',
    label: 'Device Link',
    subtitle: 'Pair WhatsApp via code',
    icon: Link2,
  },
  {
    id: 'config',
    label: 'Bot Config',
    subtitle: 'Prefix & permissions',
    icon: SlidersHorizontal,
  },
  {
    id: 'ai',
    label: 'AI & Commands',
    subtitle: 'Gemini responder & test',
    icon: Sparkles,
  },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  sessionStatus,
  aiConfigured,
  config,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const statusLabel =
    sessionStatus === 'connected'
      ? 'WhatsApp Connected'
      : sessionStatus === 'pairing_code_ready'
        ? 'Awaiting Phone Link'
        : sessionStatus === 'connecting'
          ? 'Connecting Socket'
          : 'No Device Linked';

  const content = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-display font-bold text-sm tracking-tight">
            {config.brandName}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 leading-tight">
              {config.brandName} Company
            </div>
            <div className="text-xs text-slate-500">WhatsApp Multi-Device</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav aria-label="Primary navigation" className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-emerald-400' : 'text-slate-500'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium whitespace-nowrap truncate">
                  {item.label}
                </div>
                <div
                  className={`text-xs truncate ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {item.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span>Device</span>
            <span className="font-medium text-slate-900">{statusLabel}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>AI Engine</span>
            <span className="font-medium text-slate-900">
              {aiConfigured ? 'Gemini Ready' : 'Not Configured'}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                Owner: {config.ownerName}
              </div>
              <div className="text-[11px] font-mono text-slate-600 truncate tabular-nums">
                {formatOwnerPhoneDisplay(config.ownerPhone)}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5 pl-0.5">
            <div className="truncate">{config.ownerEmail}</div>
            <div className="truncate">Facebook: {config.ownerFacebook}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{content}</div>
        </div>
      )}
    </>
  );
}
