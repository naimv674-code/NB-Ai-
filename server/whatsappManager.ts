import fs from 'fs';
import path from 'path';
import pino from 'pino';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
} from '@whiskeysockets/baileys';
import { formatPairingCode } from '../src/lib/countries.ts';
import {
  buildBuiltinCommandReply,
  evaluateCommandTrigger,
  shouldRespondInChatContext,
  type UserRole,
} from '../src/lib/botRules.ts';
import { loadBotConfig } from './configStore.ts';
import { generateBotAiReply } from './geminiService.ts';
import { executeMemoryCommand } from './memoryStore.ts';

export type SessionStatus =
  | 'idle'
  | 'connecting'
  | 'pairing_code_ready'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  direction: 'system' | 'incoming' | 'outgoing';
  sender: string;
  message: string;
}

export interface WhatsAppSessionSnapshot {
  sessionId: string;
  phoneNumber: string;
  displayNumber: string;
  countryIso: string;
  status: SessionStatus;
  pairingCode: string | null;
  connectedJid: string | null;
  connectedName: string | null;
  connectedAt: string | null;
  updatedAt: string;
  error: string | null;
  logs: ActivityLogEntry[];
}

interface InternalSession {
  snapshot: WhatsAppSessionSnapshot;
  socket: WASocket | null;
  pairingRequested: boolean;
  pairingResolve?: (code: string) => void;
  pairingReject?: (err: Error) => void;
  pairingTimeout?: ReturnType<typeof setTimeout>;
  closedByUser: boolean;
}

const SESSIONS_ROOT = path.resolve(process.cwd(), '.nb-sessions');
const FALLBACK_WA_VERSION: [number, number, number] = [2, 3000, 1025190524];
const GROUP_META_TTL_MS = 60_000;

function extractDigits(jid: string): string {
  return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
}

class WhatsAppManager {
  private sessions = new Map<string, InternalSession>();
  private sentMessageIds = new Set<string>();
  private groupMetaCache = new Map<
    string,
    { fetchedAt: number; meta: Awaited<ReturnType<WASocket['groupMetadata']>> }
  >();

  private trackSentId(id?: string | null) {
    if (!id) return;
    this.sentMessageIds.add(id);
    if (this.sentMessageIds.size > 600) {
      const first = this.sentMessageIds.values().next().value;
      if (first) this.sentMessageIds.delete(first);
    }
  }

  private async getGroupMetadataCached(sock: WASocket, jid: string, forceRefresh = false) {
    const cached = this.groupMetaCache.get(jid);
    if (!forceRefresh && cached && Date.now() - cached.fetchedAt < GROUP_META_TTL_MS) {
      return cached.meta;
    }
    const meta = await sock.groupMetadata(jid);
    this.groupMetaCache.set(jid, { fetchedAt: Date.now(), meta });
    return meta;
  }

  private appendLog(
    session: InternalSession,
    direction: ActivityLogEntry['direction'],
    sender: string,
    message: string
  ) {
    session.snapshot.logs = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        direction,
        sender,
        message,
      },
      ...session.snapshot.logs.slice(0, 49),
    ];
    session.snapshot.updatedAt = new Date().toISOString();
  }

  private getSessionDir(sessionId: string): string {
    const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
    return path.join(SESSIONS_ROOT, safeId);
  }

  private async createSocket(
    sessionId: string,
    e164Digits: string,
    isReconnect = false
  ) {
    const session = this.sessions.get(sessionId);
    if (!session || session.closedByUser) return;

    const sessionDir = this.getSessionDir(sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    let version: [number, number, number] = FALLBACK_WA_VERSION;
    try {
      const latest = await Promise.race([
        fetchLatestBaileysVersion(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Version lookup timeout')), 5000)
        ),
      ]);
      if (latest?.version) {
        version = latest.version;
      }
    } catch {
      // Keep fallback WhatsApp Web protocol version
    }

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      browser: Browsers.ubuntu('Chrome'),
      countryCode: session.snapshot.countryIso,
      markOnlineOnConnect: true,
      syncFullHistory: false,
      connectTimeoutMs: 25000,
    });

    session.socket = sock;
    sock.ev.on('creds.update', saveCreds);

    const triggerPairingCode = async () => {
      if (
        session.pairingRequested ||
        session.closedByUser ||
        state.creds.registered ||
        isReconnect
      ) {
        return;
      }
      session.pairingRequested = true;
      try {
        await new Promise((r) => setTimeout(r, 900));
        if (session.closedByUser) return;
        const rawCode = await sock.requestPairingCode(e164Digits);
        const formatted = formatPairingCode(rawCode);
        session.snapshot.pairingCode = formatted;
        session.snapshot.status = 'pairing_code_ready';
        session.snapshot.error = null;
        this.appendLog(
          session,
          'system',
          'NB Linker',
          `Pairing code generated for +${e164Digits}: ${formatted}. Waiting for confirmation in WhatsApp Linked Devices.`
        );
        if (session.pairingTimeout) {
          clearTimeout(session.pairingTimeout);
          session.pairingTimeout = undefined;
        }
        session.pairingResolve?.(formatted);
        session.pairingResolve = undefined;
        session.pairingReject = undefined;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to request pairing code from WhatsApp.';
        session.snapshot.status = 'error';
        session.snapshot.error = message;
        this.appendLog(session, 'system', 'NB Linker', `Pairing error: ${message}`);
        if (session.pairingTimeout) {
          clearTimeout(session.pairingTimeout);
          session.pairingTimeout = undefined;
        }
        session.pairingReject?.(new Error(message));
        session.pairingResolve = undefined;
        session.pairingReject = undefined;
      }
    };

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !session.pairingRequested && !state.creds.registered) {
        void triggerPairingCode();
      }

      if (connection === 'connecting') {
        if (session.snapshot.status === 'idle') {
          session.snapshot.status = 'connecting';
        }
        if (!session.pairingRequested && !state.creds.registered) {
          setTimeout(() => {
            if (!session.pairingRequested && !session.closedByUser) {
              void triggerPairingCode();
            }
          }, 1500);
        }
      }

      if (connection === 'open') {
        session.snapshot.status = 'connected';
        session.snapshot.connectedJid =
          sock.user?.id ?? `${e164Digits}@s.whatsapp.net`;
        session.snapshot.connectedName = sock.user?.name ?? 'Connected Device';
        session.snapshot.connectedAt = new Date().toISOString();
        session.snapshot.error = null;
        this.appendLog(
          session,
          'system',
          'WhatsApp',
          `Device connected to NB Bot (${session.snapshot.connectedJid}).`
        );
      }

      if (connection === 'close') {
        const statusCode = (
          lastDisconnect?.error as { output?: { statusCode?: number } } | undefined
        )?.output?.statusCode;
        const errMessage =
          lastDisconnect?.error instanceof Error
            ? lastDisconnect.error.message
            : 'Connection closed';

        if (session.closedByUser) {
          session.snapshot.status = 'disconnected';
          return;
        }

        const shouldRestart =
          statusCode === DisconnectReason.restartRequired ||
          (state.creds.registered && statusCode !== DisconnectReason.loggedOut);

        if (shouldRestart) {
          this.appendLog(
            session,
            'system',
            'WhatsApp',
            'Completing multi-device handshake after pairing...'
          );
          setTimeout(() => {
            void this.createSocket(sessionId, e164Digits, true);
          }, 800);
          return;
        }

        if (statusCode === DisconnectReason.loggedOut) {
          session.snapshot.status = 'disconnected';
          session.snapshot.pairingCode = null;
          session.snapshot.connectedJid = null;
          session.snapshot.error = 'Device logged out from WhatsApp.';
          this.appendLog(session, 'system', 'WhatsApp', 'Session logged out.');
          return;
        }

        session.snapshot.status = 'error';
        session.snapshot.error = `WhatsApp connection closed (${errMessage}).`;
        this.appendLog(
          session,
          'system',
          'WhatsApp',
          `Socket closed: ${errMessage}`
        );

        if (session.pairingReject) {
          if (session.pairingTimeout) {
            clearTimeout(session.pairingTimeout);
            session.pairingTimeout = undefined;
          }
          session.pairingReject(new Error(session.snapshot.error));
          session.pairingResolve = undefined;
          session.pairingReject = undefined;
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      const config = loadBotConfig();
      const botPhoneDigits = sock.user?.id
        ? extractDigits(sock.user.id)
        : e164Digits;
      const botLidDigits = sock.user?.lid ? extractDigits(sock.user.lid) : '';

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        const jid = msg.key.remoteJid;
        if (!jid || jid === 'status@broadcast') continue;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          '';

        if (!text.trim()) continue;

        const isGroup = jid.endsWith('@g.us');
        const senderJid = isGroup ? msg.key.participant || jid : jid;
        const senderDigits = extractDigits(senderJid);

        const ctx =
          msg.message.extendedTextMessage?.contextInfo ||
          msg.message.imageMessage?.contextInfo ||
          msg.message.videoMessage?.contextInfo ||
          msg.message.documentMessage?.contextInfo ||
          msg.message.audioMessage?.contextInfo;

        const quotedParticipantDigits = ctx?.participant
          ? extractDigits(ctx.participant)
          : '';
        const isReplyToBot = Boolean(
          (ctx?.stanzaId && this.sentMessageIds.has(ctx.stanzaId)) ||
            (quotedParticipantDigits &&
              (quotedParticipantDigits === botPhoneDigits ||
                (botLidDigits && quotedParticipantDigits === botLidDigits)))
        );

        const mentionedJids = ctx?.mentionedJid ?? [];
        const isBotMentioned = mentionedJids.some((mJid) => {
          const d = extractDigits(mJid);
          return d === botPhoneDigits || (botLidDigits && d === botLidDigits);
        });

        const isBotAdmin =
          senderDigits === extractDigits(config.ownerPhone) ||
          config.adminPhones.some((p) => extractDigits(p) === senderDigits) ||
          senderDigits === e164Digits;

        let role: UserRole = isBotAdmin ? 'bot_admin' : 'user';

        // Preliminary trigger check before expensive groupMetadata lookup
        const preEval = evaluateCommandTrigger(text, config, isBotAdmin ? 'bot_admin' : 'user');
        const preContext = shouldRespondInChatContext({
          isGroup,
          isReplyToBot,
          isBotMentioned,
          rawMessage: text,
          evaluation: preEval,
        });

        if (!preContext.shouldRespond) {
          continue;
        }

        let groupMeta:
          | Awaited<ReturnType<WASocket['groupMetadata']>>
          | undefined;
        if (isGroup && !isBotAdmin) {
          try {
            groupMeta = await this.getGroupMetadataCached(sock, jid);
            const participantInfo = groupMeta.participants.find(
              (p) => extractDigits(p.id) === senderDigits
            );
            if (
              participantInfo?.admin === 'admin' ||
              participantInfo?.admin === 'superadmin'
            ) {
              role = 'group_admin';
            }
          } catch {
            // Leave role as 'user' if group metadata lookup fails
          }
        }

        const evaluation = evaluateCommandTrigger(text, config, role);
        const contextDecision = shouldRespondInChatContext({
          isGroup,
          isReplyToBot,
          isBotMentioned,
          rawMessage: text,
          evaluation,
        });
        if (!contextDecision.shouldRespond) continue;

        const sendOptions = contextDecision.quoteIncomingMessage
          ? { quoted: msg }
          : undefined;

        this.appendLog(
          session,
          'incoming',
          msg.pushName || `+${senderDigits}`,
          text
        );

        const uptimeSeconds = session.snapshot.connectedAt
          ? Math.max(
              0,
              Math.floor(
                (Date.now() - Date.parse(session.snapshot.connectedAt)) / 1000
              )
            )
          : 0;

        if (!evaluation.allowed) {
          const deniedText = evaluation.reason || 'Permission denied.';
          const sent = await sock
            .sendMessage(jid, { text: deniedText }, sendOptions)
            .catch(() => null);
          this.trackSentId(sent?.key?.id);
          this.appendLog(session, 'outgoing', 'NB Bot', deniedText);
          continue;
        }

        try {
          const cmdName = evaluation.command?.name;

          if (cmdName === 'learn' || cmdName === 'memory' || cmdName === 'forget') {
            const memReply = executeMemoryCommand(
              cmdName,
              evaluation.args,
              msg.pushName || `+${senderDigits}`
            );
            if (memReply) {
              const sent = await sock.sendMessage(
                jid,
                { text: memReply },
                sendOptions
              );
              this.trackSentId(sent?.key?.id);
              this.appendLog(session, 'outgoing', 'NB Bot', memReply);
              continue;
            }
          }

          if (isGroup && cmdName === 'groupinfo') {
            const meta =
              groupMeta ?? (await this.getGroupMetadataCached(sock, jid, true));
            const adminCount = meta.participants.filter(
              (p) => p.admin === 'admin' || p.admin === 'superadmin'
            ).length;
            const infoText = [
              `👥 Group: ${meta.subject}`,
              `📊 Members: ${meta.participants.length} · Admins: ${adminCount}`,
              `🔒 Restricted Mode: ${meta.announce ? 'Admins Only' : 'Open'}`,
            ].join('\n');
            const sent = await sock.sendMessage(jid, { text: infoText }, sendOptions);
            this.trackSentId(sent?.key?.id);
            this.appendLog(session, 'outgoing', 'NB Bot', infoText);
            continue;
          }

          if (isGroup && (cmdName === 'tagall' || cmdName === 'hidetag')) {
            const meta =
              groupMeta ?? (await this.getGroupMetadataCached(sock, jid, true));
            const mentions = meta.participants.map((p) => p.id);
            const notice =
              evaluation.args || `📢 Announcement from ${config.brandName} Bot`;
            const body =
              cmdName === 'hidetag'
                ? notice
                : [
                    notice,
                    '',
                    ...meta.participants.map((p) => `@${extractDigits(p.id)}`),
                  ].join('\n');
            const sent = await sock.sendMessage(
              jid,
              { text: body, mentions },
              sendOptions
            );
            this.trackSentId(sent?.key?.id);
            this.appendLog(session, 'outgoing', 'NB Bot', notice);
            continue;
          }

          if (isGroup && (cmdName === 'mute' || cmdName === 'unmute')) {
            await sock.groupSettingUpdate(
              jid,
              cmdName === 'mute' ? 'announcement' : 'not_announcement'
            );
            const replyText = buildBuiltinCommandReply(
              cmdName,
              config,
              uptimeSeconds,
              evaluation.args
            );
            const sent = await sock.sendMessage(
              jid,
              { text: replyText },
              sendOptions
            );
            this.trackSentId(sent?.key?.id);
            this.appendLog(session, 'outgoing', 'NB Bot', replyText);
            continue;
          }

          if (isGroup && cmdName === 'kick') {
            const targets = new Set<string>(ctx?.mentionedJid ?? []);
            if (ctx?.participant) targets.add(ctx.participant);

            if (targets.size === 0) {
              const hint =
                '🚫 Mention or reply to a group participant to remove them (e.g. .kick @user).';
              const sent = await sock.sendMessage(jid, { text: hint }, sendOptions);
              this.trackSentId(sent?.key?.id);
              this.appendLog(session, 'outgoing', 'NB Bot', hint);
              continue;
            }

            await sock.groupParticipantsUpdate(
              jid,
              Array.from(targets),
              'remove'
            );
            const removedMsg = `✅ Removed ${targets.size} participant(s) from the group.`;
            const sent = await sock.sendMessage(
              jid,
              { text: removedMsg },
              sendOptions
            );
            this.trackSentId(sent?.key?.id);
            this.appendLog(session, 'outgoing', 'NB Bot', removedMsg);
            continue;
          }

          let replyText = '';
          if (evaluation.command && !evaluation.command.usesAi) {
            replyText = buildBuiltinCommandReply(
              evaluation.command.name,
              config,
              uptimeSeconds,
              evaluation.args
            );
          } else {
            const prefixChar =
              config.prefixMode === 'false' ? '' : config.prefixChar;
            if (evaluation.command && !evaluation.args) {
              replyText = `💡 Usage: ${prefixChar}${evaluation.command.usage}`;
            } else {
              void sock.sendPresenceUpdate('composing', jid).catch(() => {});
              const promptText =
                cmdName === 'translate'
                  ? `Translate accurately and naturally: ${evaluation.args || text}`
                  : cmdName === 'summary'
                    ? `Summarize the key points clearly: ${evaluation.args || text}`
                    : evaluation.args || text;
              replyText = await generateBotAiReply(
                promptText,
                config,
                msg.pushName || senderDigits,
                jid
              );
              void sock.sendPresenceUpdate('paused', jid).catch(() => {});
            }
          }

          if (replyText) {
            const sent = await sock.sendMessage(
              jid,
              { text: replyText },
              sendOptions
            );
            this.trackSentId(sent?.key?.id);
            this.appendLog(session, 'outgoing', 'NB Bot', replyText);
          }
        } catch (err) {
          void sock.sendPresenceUpdate('paused', jid).catch(() => {});
          const errReply =
            err instanceof Error
              ? `NB Bot could not complete command: ${err.message}`
              : 'NB Bot encountered an error executing this command.';
          const sent = await sock
            .sendMessage(jid, { text: errReply }, sendOptions)
            .catch(() => null);
          this.trackSentId(sent?.key?.id);
          this.appendLog(session, 'system', 'NB Bot', errReply);
        }
      }
    });
  }

  public async startPairing(params: {
    sessionId: string;
    e164Digits: string;
    displayNumber: string;
    countryIso: string;
  }): Promise<WhatsAppSessionSnapshot> {
    const { sessionId, e164Digits, displayNumber, countryIso } = params;

    await this.disconnect(sessionId);

    const sessionDir = this.getSessionDir(sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    const session: InternalSession = {
      snapshot: {
        sessionId,
        phoneNumber: e164Digits,
        displayNumber,
        countryIso,
        status: 'connecting',
        pairingCode: null,
        connectedJid: null,
        connectedName: null,
        connectedAt: null,
        updatedAt: new Date().toISOString(),
        error: null,
        logs: [],
      },
      socket: null,
      pairingRequested: false,
      closedByUser: false,
    };

    this.appendLog(
      session,
      'system',
      'NB Linker',
      `Initializing WhatsApp Multi-Device socket for ${displayNumber}...`
    );

    this.sessions.set(sessionId, session);

    const codePromise = new Promise<string>((resolve, reject) => {
      session.pairingResolve = resolve;
      session.pairingReject = reject;
      session.pairingTimeout = setTimeout(() => {
        if (session.pairingReject) {
          const timeoutMsg =
            'WhatsApp Web socket timed out while generating a pairing code. Ensure outbound access to WhatsApp servers is open and try again.';
          session.snapshot.status = 'error';
          session.snapshot.error = timeoutMsg;
          this.appendLog(session, 'system', 'NB Linker', timeoutMsg);
          session.pairingReject(new Error(timeoutMsg));
          session.pairingResolve = undefined;
          session.pairingReject = undefined;
        }
      }, 20000);
    });

    try {
      await this.createSocket(sessionId, e164Digits, false);
      await codePromise;
    } catch {
      // Snapshot captures error details cleanly
    }

    return this.getStatus(sessionId)!;
  }

  public getStatus(sessionId: string): WhatsAppSessionSnapshot | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return {
      ...session.snapshot,
      logs: [...session.snapshot.logs],
    };
  }

  public listSessions(): WhatsAppSessionSnapshot[] {
    return Array.from(this.sessions.values()).map((s) => ({
      ...s.snapshot,
      logs: [...s.snapshot.logs],
    }));
  }

  public async disconnect(sessionId: string): Promise<void> {
    const existing = this.sessions.get(sessionId);
    if (!existing) return;
    existing.closedByUser = true;
    if (existing.pairingTimeout) {
      clearTimeout(existing.pairingTimeout);
      existing.pairingTimeout = undefined;
    }
    try {
      if (existing.socket) {
        if (existing.snapshot.status === 'connected') {
          await existing.socket.logout().catch(() => {});
        }
        existing.socket.end(undefined);
      }
    } catch {
      // Ignore teardown errors
    }
    const sessionDir = this.getSessionDir(sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    this.sessions.delete(sessionId);
  }
}

export const whatsappManager = new WhatsAppManager();
