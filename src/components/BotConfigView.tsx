import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Lock, Save, Search } from 'lucide-react';
import {
  PERMISSION_LABELS,
  PREFIX_MODE_LABELS,
  formatConfigSnippet,
  formatOwnerPhoneDisplay,
  type BotConfig,
  type PermissionLevel,
  type PrefixMode,
} from '../lib/botRules';

interface BotConfigViewProps {
  config: BotConfig;
  onSaveConfig: (next: BotConfig) => Promise<void>;
  isSaving: boolean;
}

export function BotConfigView({
  config,
  onSaveConfig,
  isSaving,
}: BotConfigViewProps) {
  const [draft, setDraft] = useState<BotConfig>(config);
  const [adminInput, setAdminInput] = useState<string>(
    config.adminPhones.join(', ')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraft(config);
    setAdminInput(config.adminPhones.join(', '));
  }, [config]);

  const filteredCommands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return draft.commands.filter((cmd) => {
      const matchesCat =
        categoryFilter === 'All' || cmd.category === categoryFilter;
      const matchesQuery =
        !q ||
        cmd.name.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [draft.commands, searchQuery, categoryFilter]);

  const handleSave = async () => {
    const parsedAdmins = adminInput
      .split(',')
      .map((s) => s.replace(/\D/g, '').trim())
      .filter(Boolean);
    await onSaveConfig({ ...draft, adminPhones: parsedAdmins });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const updateCommand = (
    id: string,
    patch: Partial<BotConfig['commands'][number]>
  ) => {
    setDraft((prev) => ({
      ...prev,
      commands: prev.commands.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Bot Rules & Permissions
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Configure prefix behavior and command access permissions. Owner
            identity is locked to NB / NAIM.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : savedNotice ? (
            <>
              <Check className="h-4 w-4" />
              Saved Configuration
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Configuration
            </>
        )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section
          aria-label="Prefix and ownership configuration"
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <span>Verified Owner Identity (Locked)</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Read-only
              </span>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-slate-500">Company & Owner</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">
                  {config.brandName} · {config.ownerName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">WhatsApp / Phone</dt>
                <dd className="font-mono font-medium text-slate-900 mt-0.5 tabular-nums">
                  {formatOwnerPhoneDisplay(config.ownerPhone)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-800 mt-0.5 truncate">
                  {config.ownerEmail}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Facebook</dt>
                <dd className="text-slate-800 mt-0.5">
                  {config.ownerFacebook}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <label
              htmlFor="bot-admins-input"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Bot Admin Numbers (comma separated)
            </label>
            <input
              id="bot-admins-input"
              type="text"
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
              placeholder="8801869816026"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-600 tabular-nums"
            />
          </div>

          <div className="space-y-2.5">
            <div className="text-sm font-medium text-slate-900">
              Command Prefix Mode
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['true', 'false', 'both'] as PrefixMode[]).map((mode) => {
                const active = draft.prefixMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({ ...p, prefixMode: mode }))
                    }
                    className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-mono font-semibold">
                      prefix: {mode === 'both' ? `'both'` : mode}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {PREFIX_MODE_LABELS[mode]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prefix-symbol-select"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Prefix Symbol
              </label>
              <select
                id="prefix-symbol-select"
                value={draft.prefixChar}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, prefixChar: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                <option value=".">. (Dot — e.g. .menu)</option>
                <option value="/">/ (Slash — e.g. /menu)</option>
                <option value="!">! (Bang — e.g. !menu)</option>
                <option value="#"># (Hash — e.g. #menu)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="default-permission-select"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Default AI / Fallback Permission
              </label>
              <select
                id="default-permission-select"
                value={draft.defaultPermission}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    defaultPermission: Number(e.target.value) as PermissionLevel,
                  }))
                }
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                <option value={0}>0 — {PERMISSION_LABELS[0]}</option>
                <option value={2}>2 — {PERMISSION_LABELS[2]}</option>
                <option value={3}>3 — {PERMISSION_LABELS[3]}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <div className="text-sm font-medium text-slate-900">
                Gemini AI Auto-Reply
              </div>
              <div className="text-xs text-slate-500">
                Automatically answer conversational WhatsApp messages using
                your server-side AI API key.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft.aiAutoReply}
              aria-label="Toggle Gemini AI Auto-Reply"
              onClick={() =>
                setDraft((p) => ({ ...p, aiAutoReply: !p.aiAutoReply }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                draft.aiAutoReply ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  draft.aiAutoReply ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900">
              WhatsApp Group &amp; Inbox Reply Rule
            </div>
            <div>
              <span className="font-medium text-slate-900">Inbox (DM):</span>{' '}
              Replies directly to every message without tagging or quoting.
            </div>
            <div>
              <span className="font-medium text-slate-900">Group Chat:</span>{' '}
              Replies only when someone quotes/replies to NB Bot, tags @bot,
              writes &ldquo;ai ...&rdquo;, or uses a bot command.
            </div>
          </div>
        </section>

        <section
          aria-label="Generated bot configuration preview"
          className="lg:col-span-5 bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-white">
                Active Policy Snapshot
              </h2>
              <span className="text-xs font-mono text-emerald-400">
                Live Rule Set
              </span>
            </div>
            <pre className="mt-4 text-xs font-mono leading-relaxed text-slate-300 overflow-x-auto whitespace-pre">
              {formatConfigSnippet(draft)}
            </pre>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
            Applies immediately to all incoming WhatsApp messages on your
            connected device and in the AI & Commands console.
          </div>
        </section>
      </div>

      <section
        aria-label="Command registry table"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Command Permissions ({draft.commands.length} Commands)
            </h2>
            <p className="text-xs text-slate-500">
              Control which roles can invoke each NB Bot WhatsApp command
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {['All', 'Core', 'AI', 'Group', 'Utility'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Filter commands"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter commands..."
                className="h-9 pl-8 pr-3 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                <th className="py-2.5 px-6">Command</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Permission Level</th>
                <th className="py-2.5 px-6 text-right">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCommands.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-slate-500 text-xs"
                  >
                    No commands match your filter.
                  </td>
                </tr>
              ) : (
                filteredCommands.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 whitespace-nowrap">
                      <div className="font-mono font-semibold text-slate-900">
                        {draft.prefixMode === 'false' ? '' : draft.prefixChar}
                        {cmd.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {draft.prefixMode === 'false' ? '' : draft.prefixChar}
                        {cmd.usage}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {cmd.category}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {cmd.description}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        aria-label={`Permission for ${cmd.name}`}
                        value={cmd.permission}
                        onChange={(e) =>
                          updateCommand(cmd.id, {
                            permission: Number(
                              e.target.value
                            ) as PermissionLevel,
                          })
                        }
                        className="h-8 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
                      >
                        <option value={0}>0 · All users</option>
                        <option value={2}>2 · Bot admins only</option>
                        <option value={3}>3 · Bot & group admins</option>
                      </select>
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <input
                        type="checkbox"
                        aria-label={`Enable ${cmd.name}`}
                        checked={cmd.enabled}
                        onChange={(e) =>
                          updateCommand(cmd.id, { enabled: e.target.checked })
                        }
                        className="h-4 w-4 accent-emerald-600 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
