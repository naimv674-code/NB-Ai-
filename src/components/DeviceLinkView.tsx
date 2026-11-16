import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import {
  SUPPORTED_COUNTRIES,
  getCountryByIso,
  normalizePhoneNumber,
} from '../lib/countries';
import {
  SUPPORTED_LANGUAGES,
  UI_TRANSLATIONS,
  type UiLanguageCode,
} from '../lib/i18n';
import type { WhatsAppSessionSnapshot } from '../types';

interface DeviceLinkViewProps {
  session: WhatsAppSessionSnapshot | null;
  onStartPairing: (countryIso: string, phoneNumber: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onOpenDemo: () => void;
  language: UiLanguageCode;
  onChangeLanguage: (lang: UiLanguageCode) => void;
  isSubmitting: boolean;
  apiError: string | null;
}

export function DeviceLinkView({
  session,
  onStartPairing,
  onDisconnect,
  onOpenDemo,
  language,
  onChangeLanguage,
  isSubmitting,
  apiError,
}: DeviceLinkViewProps) {
  const [countryIso, setCountryIso] = useState<string>('BD');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const t = UI_TRANSLATIONS[language];
  const isRtl = language === 'ar' || language === 'ur';
  const selectedCountry = getCountryByIso(countryIso);
  const preview = phoneInput.trim()
    ? normalizePhoneNumber(countryIso, phoneInput)
    : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = normalizePhoneNumber(countryIso, phoneInput);
    if (!result.valid) {
      setValidationError(
        result.error || 'Please enter a valid WhatsApp phone number.'
      );
      return;
    }
    setValidationError(null);
    await onStartPairing(countryIso, phoneInput);
  };

  const handleCopyCode = async () => {
    if (!session?.pairingCode) return;
    try {
      await navigator.clipboard.writeText(session.pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback not needed when blocked
    }
  };

  const displayedError = validationError || apiError || session?.error;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {t.pageTitle}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">{t.pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-slate-300 bg-white">
            <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <select
              aria-label={t.interfaceLanguageLabel}
              value={language}
              onChange={(e) =>
                onChangeLanguage(e.target.value as UiLanguageCode)
              }
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenDemo}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            {t.testLiveModel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section
          aria-label="WhatsApp phone number form"
          className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">
              {t.step1Title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{t.step1Subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="country-select"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                {t.countryLabel}
              </label>
              <select
                id="country-select"
                value={countryIso}
                onChange={(e) => {
                  setCountryIso(e.target.value);
                  setValidationError(null);
                }}
                className="w-full h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              >
                {SUPPORTED_COUNTRIES.map((country) => (
                  <option key={country.iso} value={country.iso}>
                    {country.name} ({country.localName}) — {country.examplePrefix}{' '}
                    · {country.languageLabel}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                +{selectedCountry.dialCode} ({selectedCountry.languageLabel}) ·{' '}
                <span className="font-mono">
                  {selectedCountry.examplePrefix}
                  {selectedCountry.iso === 'BD'
                    ? selectedCountry.placeholder.slice(1)
                    : selectedCountry.placeholder}
                </span>
              </p>
            </div>

            <div>
              <label
                htmlFor="phone-input"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                {t.phoneLabel}
              </label>
              <div
                dir="ltr"
                className="flex items-stretch rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 overflow-hidden"
              >
                <div className="flex items-center gap-1.5 px-3.5 bg-slate-50 border-r border-slate-200 text-sm font-mono font-medium text-slate-800 shrink-0 tabular-nums">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>+{selectedCountry.dialCode}</span>
                </div>
                <input
                  id="phone-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder={selectedCountry.placeholder}
                  className="flex-1 h-11 px-3.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none tabular-nums"
                />
              </div>
              {preview?.valid && (
                <p className="mt-1.5 text-xs text-emerald-700 font-medium">
                  Normalized WhatsApp ID:{' '}
                  <span className="font-mono tabular-nums" dir="ltr">
                    {preview.displayNumber}
                  </span>
                </p>
              )}
            </div>

            {displayedError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
              >
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{displayedError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.requestingBtn}
                  </>
                ) : session?.pairingCode ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {t.regenerateBtn}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    {t.requestCodeBtn}
                  </>
                )}
              </button>

              {session &&
                (session.status === 'connected' ||
                  session.status === 'pairing_code_ready' ||
                  session.status === 'connecting') && (
                  <button
                    type="button"
                    onClick={onDisconnect}
                    className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Unplug className="h-4 w-4" />
                    {t.disconnectBtn}
                  </button>
                )}
            </div>
          </form>

          <div className="pt-4 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-700 mb-2">
              Quick Country Codes
            </div>
            <div
              dir="ltr"
              className="grid grid-cols-2 sm:grid-cols-5 border border-slate-200 rounded-lg overflow-hidden divide-x divide-y divide-slate-200 bg-slate-50"
            >
              {SUPPORTED_COUNTRIES.map((c) => {
                const active = c.iso === countryIso;
                return (
                  <button
                    key={c.iso}
                    type="button"
                    onClick={() => {
                      setCountryIso(c.iso);
                      setValidationError(null);
                    }}
                    className={`px-2.5 py-2 text-xs font-mono text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-50 text-emerald-900 font-semibold'
                        : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[11px] font-sans text-slate-500 truncate">
                      {c.iso}
                    </span>
                    <span className="tabular-nums">+{c.dialCode}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section
          aria-label="Pairing code and connection status"
          className="xl:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {t.step2Title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t.step2Subtitle}</p>
            </div>
            <span className="text-xs font-medium text-slate-600">
              {session?.status === 'connected'
                ? 'Connected'
                : session?.status === 'pairing_code_ready'
                  ? 'Code Ready'
                  : session?.status === 'connecting'
                    ? 'Connecting'
                    : session?.status === 'error'
                      ? 'Connection Issue'
                      : 'Waiting'}
            </span>
          </div>

          {session?.status === 'connected' ? (
            <div className="p-5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-900 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>WhatsApp Device Connected to NB Bot</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <dt className="text-emerald-700">Linked Account</dt>
                  <dd className="font-mono font-semibold text-emerald-950 mt-0.5 break-all">
                    {session.connectedJid || session.displayNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-emerald-700">Device Profile</dt>
                  <dd className="font-medium text-emerald-950 mt-0.5">
                    {session.connectedName || 'NB Multi-Device'}
                  </dd>
                </div>
              </dl>
            </div>
          ) : session?.pairingCode ? (
            <div className="p-5 rounded-lg bg-slate-900 text-white space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">
                    Enter this code in WhatsApp on {session.displayNumber}
                  </div>
                  <div
                    dir="ltr"
                    data-testid="pairing-code-value"
                    className="mt-1.5 text-3xl sm:text-4xl font-mono font-semibold tracking-[0.18em] text-emerald-400 tabular-nums"
                  >
                    {session.pairingCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  aria-label="Copy pairing code"
                  className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
              <div className="text-xs text-slate-300 border-t border-slate-800 pt-3">
                A Link a Device notification has been dispatched to your
                WhatsApp app. Confirming the code connects your session
                automatically.
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <div className="text-sm font-medium text-slate-800">
                {isSubmitting
                  ? 'Establishing WhatsApp Multi-Device socket...'
                  : 'No active pairing code yet'}
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Select your country code, enter your WhatsApp number on the
                left, and submit to generate an 8-character pairing code.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-semibold text-slate-700">
              {t.howToConnectTitle}
            </h3>
            <ol className="space-y-2 text-xs text-slate-600">
              <li className="flex gap-2.5">
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  01.
                </span>
                <span>{t.stepGuide1}</span>
              </li>
              <li className="flex gap-2.5">
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  02.
                </span>
                <span>{t.stepGuide2}</span>
              </li>
              <li className="flex gap-2.5">
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  03.
                </span>
                <span>{t.stepGuide3}</span>
              </li>
              <li className="flex gap-2.5">
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  04.
                </span>
                <span>{t.stepGuide4}</span>
              </li>
            </ol>
          </div>
        </section>
      </div>

      <section
        aria-label="Live session activity log"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Session Activity Log
            </h2>
            <p className="text-xs text-slate-500">
              Real-time pairing events and handled WhatsApp messages
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {session?.logs.length ?? 0} events
          </span>
        </div>

        {!session || session.logs.length === 0 ? (
          <div className="px-6 py-8 text-center text-xs text-slate-500">
            Session events will appear here once you request a WhatsApp Link
            Device code.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-6 whitespace-nowrap">Time</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Source</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Type</th>
                  <th className="py-2.5 px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {session.logs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-6 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {entry.sender}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          entry.direction === 'outgoing'
                            ? 'text-emerald-700'
                            : entry.direction === 'incoming'
                              ? 'text-slate-900'
                              : 'text-slate-500'
                        }`}
                      >
                        {entry.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-6 text-slate-700 break-words">
                      {entry.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
