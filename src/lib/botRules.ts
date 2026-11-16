export type PrefixMode = 'true' | 'false' | 'both';

export type PermissionLevel = 0 | 2 | 3;

export type UserRole = 'user' | 'group_admin' | 'bot_admin';

export interface BotCommandConfig {
  id: string;
  name: string;
  description: string;
  usage: string;
  category: 'Core' | 'AI' | 'Group' | 'Utility';
  permission: PermissionLevel;
  enabled: boolean;
  usesAi: boolean;
}

export interface BotConfig {
  configVersion: number;
  brandName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerFacebook: string;
  prefixMode: PrefixMode;
  prefixChar: string;
  defaultPermission: PermissionLevel;
  aiAutoReply: boolean;
  aiSystemPrompt: string;
  adminPhones: string[];
  commands: BotCommandConfig[];
}

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  0: 'All users',
  2: 'Bot administrators only',
  3: 'Bot administrators and group administrators',
};

export const PREFIX_MODE_LABELS: Record<PrefixMode, string> = {
  true: 'Prefix required (only bot prefix works)',
  false: 'No prefix (commands trigger directly)',
  both: 'Hybrid (both prefix and non-prefix work)',
};

export const DEFAULT_OWNER_PHONE = '8801869816026';
export const DEFAULT_OWNER_EMAIL = 'naimuddin1623@gmail.com';
export const DEFAULT_OWNER_FACEBOOK = 'MD NAIM';

export const DEFAULT_COMMANDS: BotCommandConfig[] = [
  {
    id: 'menu',
    name: 'menu',
    description: 'Display all active NB Bot commands and prefix settings.',
    usage: 'menu',
    category: 'Core',
    permission: 0,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'help',
    name: 'help',
    description: 'Show usage guide for NB Bot or a specific command.',
    usage: 'help [command]',
    category: 'Core',
    permission: 0,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'owner',
    name: 'owner',
    description: 'Show owner NAIM phone, email, and Facebook contact info.',
    usage: 'owner',
    category: 'Core',
    permission: 0,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'info',
    name: 'info',
    description: 'Display NB Company bot status, version, and active rules.',
    usage: 'info',
    category: 'Core',
    permission: 0,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'ping',
    name: 'ping',
    description: 'Verify live socket responsiveness and session uptime.',
    usage: 'ping',
    category: 'Utility',
    permission: 0,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'time',
    name: 'time',
    description: 'Show current Bangladesh (Asia/Dhaka) and UTC date/time.',
    usage: 'time',
    category: 'Utility',
    permission: 0,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'calc',
    name: 'calc',
    description: 'Evaluate arithmetic expressions (+, -, *, /, %).',
    usage: 'calc <expression>',
    category: 'Utility',
    permission: 0,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'ai',
    name: 'ai',
    description: 'Ask NB AI Assistant powered by server-side Gemini API.',
    usage: 'ai <question>',
    category: 'AI',
    permission: 0,
    enabled: true,
    usesAi: true,
  },
  {
    id: 'translate',
    name: 'translate',
    description:
      'Translate messages across Bengali, English, Hindi, Urdu, Arabic, Malay, Indonesian, Tamil, and Chinese.',
    usage: 'translate <text>',
    category: 'AI',
    permission: 0,
    enabled: true,
    usesAi: true,
  },
  {
    id: 'summary',
    name: 'summary',
    description: 'Summarize long WhatsApp messages into concise key points.',
    usage: 'summary <text>',
    category: 'AI',
    permission: 0,
    enabled: true,
    usesAi: true,
  },
  {
    id: 'learn',
    name: 'learn',
    description: 'Teach NB Bot a new fact or custom answer it will remember.',
    usage: 'learn <topic> = <fact>',
    category: 'AI',
    permission: 0,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'memory',
    name: 'memory',
    description: 'Show facts and custom knowledge NB Bot has learned from users.',
    usage: 'memory',
    category: 'AI',
    permission: 0,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'forget',
    name: 'forget',
    description: 'Remove a learned fact by topic (or "all") from bot memory.',
    usage: 'forget <topic | all>',
    category: 'AI',
    permission: 2,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'groupinfo',
    name: 'groupinfo',
    description: 'Inspect current WhatsApp group subject and member counts.',
    usage: 'groupinfo',
    category: 'Group',
    permission: 0,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'tagall',
    name: 'tagall',
    description: 'Mention all participants in a WhatsApp group announcement.',
    usage: 'tagall [message]',
    category: 'Group',
    permission: 3,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'hidetag',
    name: 'hidetag',
    description: 'Send a clean group notice that silently pings every member.',
    usage: 'hidetag <message>',
    category: 'Group',
    permission: 3,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'mute',
    name: 'mute',
    description: 'Lock group chat so only group administrators can send messages.',
    usage: 'mute',
    category: 'Group',
    permission: 3,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'unmute',
    name: 'unmute',
    description: 'Unlock group chat so all group participants can send messages.',
    usage: 'unmute',
    category: 'Group',
    permission: 3,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'kick',
    name: 'kick',
    description: 'Remove a mentioned or replied participant from the group.',
    usage: 'kick @user',
    category: 'Group',
    permission: 3,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'config',
    name: 'config',
    description: 'Inspect NB Bot prefix mode, symbol, and permission policy.',
    usage: 'config',
    category: 'Core',
    permission: 2,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'admins',
    name: 'admins',
    description: 'Show NB Bot owner and configured administrator numbers.',
    usage: 'admins',
    category: 'Core',
    permission: 2,
    enabled: true,
    usesAi: false,
  },
  {
    id: 'broadcast',
    name: 'broadcast',
    description: 'Prepare an official NB Company update for connected chats.',
    usage: 'broadcast <message>',
    category: 'Utility',
    permission: 2,
    enabled: true,
    usesAi: false,
  },
];

export const DEFAULT_BOT_CONFIG: BotConfig = {
  configVersion: 4,
  brandName: 'NB',
  ownerName: 'NAIM',
  ownerPhone: DEFAULT_OWNER_PHONE,
  ownerEmail: DEFAULT_OWNER_EMAIL,
  ownerFacebook: DEFAULT_OWNER_FACEBOOK,
  prefixMode: 'both',
  prefixChar: '.',
  defaultPermission: 0,
  aiAutoReply: true,
  aiSystemPrompt:
    'You are NB Bot AI (Company: NB, Owner: NAIM, +880 1869816026, naimuddin1623@gmail.com, Facebook: MD NAIM). Powered by Gemini full knowledge: answer any general, technical, coding, math, or 1TB+/100TB+ question accurately. Detect the user language automatically (Bengali, English, Hindi, Urdu, Arabic, Malay, Indonesian, Tamil, Chinese, or Romanized text) and reply directly in that same language with warm, friendly emojis 😊✨💡. Prioritize user-taught facts when relevant and warmly confirm whenever a user teaches you something new.',
  adminPhones: [DEFAULT_OWNER_PHONE],
  commands: DEFAULT_COMMANDS,
};

export function formatOwnerPhoneDisplay(phoneDigits: string): string {
  const digits = phoneDigits.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length === 13) {
    return `+880 ${digits.slice(3)}`;
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return `+880 ${digits.slice(1)}`;
  }
  return digits ? `+${digits}` : '+880 1869816026';
}

export function normalizeOwnerPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return DEFAULT_OWNER_PHONE;
  if (digits.startsWith('01') && digits.length === 11) {
    return `880${digits.slice(1)}`;
  }
  if (digits.startsWith('1') && digits.length === 10) {
    return `880${digits}`;
  }
  return digits;
}

export function enforceLockedOwner(config: BotConfig): BotConfig {
  return {
    ...config,
    brandName: 'NB',
    ownerName: 'NAIM',
    ownerPhone: DEFAULT_OWNER_PHONE,
    ownerEmail: DEFAULT_OWNER_EMAIL,
    ownerFacebook: DEFAULT_OWNER_FACEBOOK,
  };
}

export function evaluateSafeCalculation(expression: string): {
  ok: boolean;
  result?: number;
  error?: string;
} {
  const cleaned = expression.replace(/\s+/g, '');
  if (!cleaned) {
    return { ok: false, error: 'Provide an expression, e.g. 25 * 4 + 10' };
  }
  if (!/^[0-9+\-*/%.()]+$/.test(cleaned)) {
    return {
      ok: false,
      error: 'Only numbers and operators (+, -, *, /, %, parentheses) are allowed.',
    };
  }

  // Tokenize numbers, operators, and parentheses
  const tokens: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];
    if ('+-*/%()'.includes(ch)) {
      // Handle unary minus / plus at start or after operator / '('
      const prev = tokens[tokens.length - 1];
      if (
        (ch === '-' || ch === '+') &&
        (tokens.length === 0 || '+-*/%('.includes(prev))
      ) {
        let num = ch;
        i++;
        let dotCount = 0;
        while (
          i < cleaned.length &&
          (/[0-9]/.test(cleaned[i]) || cleaned[i] === '.')
        ) {
          if (cleaned[i] === '.') dotCount++;
          if (dotCount > 1) return { ok: false, error: 'Invalid decimal number.' };
          num += cleaned[i];
          i++;
        }
        if (num === '-' || num === '+') {
          if (cleaned[i] === '(') {
            tokens.push('0', ch);
            continue;
          }
          return { ok: false, error: 'Invalid operator placement.' };
        }
        tokens.push(num);
        continue;
      }
      tokens.push(ch);
      i++;
    } else {
      let num = '';
      let dotCount = 0;
      while (
        i < cleaned.length &&
        (/[0-9]/.test(cleaned[i]) || cleaned[i] === '.')
      ) {
        if (cleaned[i] === '.') dotCount++;
        if (dotCount > 1) return { ok: false, error: 'Invalid decimal number.' };
        num += cleaned[i];
        i++;
      }
      tokens.push(num);
    }
  }

  let pos = 0;

  function parseExpression(): number {
    let left = parseTerm();
    while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const op = tokens[pos++];
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (
      pos < tokens.length &&
      (tokens[pos] === '*' || tokens[pos] === '/' || tokens[pos] === '%')
    ) {
      const op = tokens[pos++];
      const right = parseFactor();
      if ((op === '/' || op === '%') && right === 0) {
        throw new Error('Division by zero is not allowed.');
      }
      if (op === '*') left *= right;
      else if (op === '/') left /= right;
      else left %= right;
    }
    return left;
  }

  function parseFactor(): number {
    const token = tokens[pos];
    if (token === undefined) {
      throw new Error('Unexpected end of expression.');
    }
    if (token === '(') {
      pos++;
      const val = parseExpression();
      if (tokens[pos] !== ')') {
        throw new Error('Mismatched parentheses.');
      }
      pos++;
      return val;
    }
    const num = Number(token);
    if (!Number.isFinite(num)) {
      throw new Error(`Invalid number token: ${token}`);
    }
    pos++;
    return num;
  }

  try {
    const result = parseExpression();
    if (pos !== tokens.length || !Number.isFinite(result)) {
      return { ok: false, error: 'Invalid mathematical expression.' };
    }
    const rounded = Math.round(result * 1e9) / 1e9;
    return { ok: true, result: rounded };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Invalid expression.',
    };
  }
}

export function hasPermission(
  role: UserRole,
  requiredPermission: PermissionLevel
): boolean {
  if (requiredPermission === 0) return true;
  if (requiredPermission === 2) return role === 'bot_admin';
  if (requiredPermission === 3) {
    return role === 'bot_admin' || role === 'group_admin';
  }
  return false;
}

export interface CommandEvaluation {
  matched: boolean;
  allowed: boolean;
  command?: BotCommandConfig;
  args: string;
  usedPrefix: boolean;
  aiFallback: boolean;
  reason?: string;
}

export function evaluateCommandTrigger(
  rawMessage: string,
  config: BotConfig,
  senderRole: UserRole
): CommandEvaluation {
  const trimmed = rawMessage.trim();
  if (!trimmed) {
    return {
      matched: false,
      allowed: false,
      args: '',
      usedPrefix: false,
      aiFallback: false,
      reason: 'Empty message',
    };
  }

  const prefix = config.prefixChar || '.';
  const startsWithPrefix = trimmed.startsWith(prefix);

  if (config.prefixMode === 'true' && !startsWithPrefix) {
    return {
      matched: false,
      allowed: false,
      args: trimmed,
      usedPrefix: false,
      aiFallback: false,
      reason: `Ignored: prefixMode is 'true' and message does not start with '${prefix}'.`,
    };
  }

  if (config.prefixMode === 'false' && startsWithPrefix) {
    return {
      matched: false,
      allowed: false,
      args: trimmed,
      usedPrefix: true,
      aiFallback: false,
      reason: `Ignored: prefixMode is 'false' (non-prefix only).`,
    };
  }

  const body = startsWithPrefix ? trimmed.slice(prefix.length).trim() : trimmed;
  if (!body) {
    if (config.aiAutoReply) {
      const allowed = hasPermission(senderRole, config.defaultPermission);
      return {
        matched: true,
        allowed,
        args: trimmed,
        usedPrefix: false,
        aiFallback: true,
        reason: allowed
          ? undefined
          : `Access denied: default permission ${config.defaultPermission} (${PERMISSION_LABELS[config.defaultPermission]}) required.`,
      };
    }
    return {
      matched: false,
      allowed: false,
      args: '',
      usedPrefix: startsWithPrefix,
      aiFallback: false,
      reason: 'Missing command after prefix.',
    };
  }

  const [firstToken, ...restTokens] = body.split(/\s+/);
  const keyword = firstToken.toLowerCase();
  const args = restTokens.join(' ').trim();

  let command = config.commands.find(
    (cmd) => cmd.enabled && cmd.name.toLowerCase() === keyword
  );

  // When message has NO prefix and AI auto-reply is enabled, avoid hijacking normal English/Banglish sentences
  // that happen to start with a command word (e.g. "help me...", "time management...", "info about...", "learn English").
  if (command && !startsWithPrefix && config.aiAutoReply) {
    const zeroArgCommands = new Set([
      'menu',
      'owner',
      'info',
      'ping',
      'time',
      'admins',
      'config',
      'memory',
      'groupinfo',
      'mute',
      'unmute',
    ]);
    const isAdminOnlyWord = command.permission !== 0 && senderRole === 'user';
    const hasUnexpectedArgs = zeroArgCommands.has(command.name) && args.length > 0;
    const isNaturalHelpSentence =
      command.name === 'help' &&
      args.length > 0 &&
      !config.commands.some(
        (c) => c.name.toLowerCase() === args.toLowerCase().replace(/^\./, '')
      );
    const isNaturalLearnSentence =
      command.name === 'learn' && !/(?:=|->|=>)/.test(args);

    if (
      isAdminOnlyWord ||
      hasUnexpectedArgs ||
      isNaturalHelpSentence ||
      isNaturalLearnSentence
    ) {
      command = undefined;
    }
  }

  if (command) {
    const allowed = hasPermission(senderRole, command.permission);
    return {
      matched: true,
      allowed,
      command,
      args,
      usedPrefix: startsWithPrefix,
      aiFallback: false,
      reason: allowed
        ? undefined
        : `Access denied: '${command.name}' requires permission ${command.permission} (${PERMISSION_LABELS[command.permission]}).`,
    };
  }

  if (config.aiAutoReply) {
    const allowed = hasPermission(senderRole, config.defaultPermission);
    return {
      matched: true,
      allowed,
      args: body,
      usedPrefix: startsWithPrefix,
      aiFallback: true,
      reason: allowed
        ? undefined
        : `Access denied: default permission ${config.defaultPermission} (${PERMISSION_LABELS[config.defaultPermission]}) required.`,
    };
  }

  return {
    matched: false,
    allowed: false,
    args: body,
    usedPrefix: startsWithPrefix,
    aiFallback: false,
    reason: `Unknown command '${keyword}'.`,
  };
}

export interface ChatContextTriggerInput {
  isGroup: boolean;
  isReplyToBot: boolean;
  isBotMentioned: boolean;
  rawMessage: string;
  evaluation: CommandEvaluation;
}

/**
 * Group vs. Inbox rule:
 * - Inbox (DM): reply directly to every message without requiring any tag or quote.
 * - Group: reply ONLY when someone quotes/replies to the bot's message, @mentions the bot,
 *   calls an explicit command (e.g. .menu, .ai, .mute), or directly addresses "ai ..." / "nb ...".
 */
export function shouldRespondInChatContext(
  input: ChatContextTriggerInput
): { shouldRespond: boolean; quoteIncomingMessage: boolean } {
  if (!input.evaluation.matched) {
    return { shouldRespond: false, quoteIncomingMessage: false };
  }

  if (!input.isGroup) {
    return { shouldRespond: true, quoteIncomingMessage: false };
  }

  const trimmedLower = input.rawMessage.trim().toLowerCase();
  const addressesAiByName =
    /^@?(?:ai|nb)\b[:\s,]*/i.test(trimmedLower);

  const isExplicitCommand = Boolean(input.evaluation.command);
  const shouldRespond =
    isExplicitCommand ||
    input.isReplyToBot ||
    input.isBotMentioned ||
    addressesAiByName;

  return {
    shouldRespond,
    quoteIncomingMessage: true,
  };
}

export function buildBuiltinCommandReply(
  commandName: string,
  config: BotConfig,
  uptimeSeconds = 0,
  args = ''
): string {
  const prefixDisplay =
    config.prefixMode === 'false' ? '' : config.prefixChar;
  const ownerPhoneDisplay = formatOwnerPhoneDisplay(config.ownerPhone);
  const enabledCount = config.commands.filter((c) => c.enabled).length;

  switch (commandName) {
    case 'owner':
      return [
        `👑 ${config.brandName} Company — Official Owner Information`,
        `👤 Owner: ${config.ownerName}`,
        `📞 WhatsApp / Phone: ${ownerPhoneDisplay}`,
        `📧 Email: ${config.ownerEmail}`,
        `📘 Facebook: ${config.ownerFacebook}`,
      ].join('\n');

    case 'info':
      return [
        `🤖 ${config.brandName} Bot System Overview`,
        `🏢 Company: ${config.brandName}`,
        `👑 Owner: ${config.ownerName} (${ownerPhoneDisplay})`,
        `📧 Email: ${config.ownerEmail}`,
        `📘 Facebook: ${config.ownerFacebook}`,
        `⚙️ Prefix Mode: ${config.prefixMode} (symbol: "${config.prefixChar}")`,
        `✅ Active Commands: ${enabledCount} · AI Auto-Reply: ${config.aiAutoReply ? 'On ✨' : 'Off'}`,
      ].join('\n');

    case 'ping':
      return `🚀 ${config.brandName} Bot is online!\n👑 Owner: ${config.ownerName} · ⏱️ Uptime: ${uptimeSeconds}s · ⚙️ Prefix: ${config.prefixMode}`;

    case 'time': {
      const now = new Date();
      const dhakaTime = now.toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka',
        dateStyle: 'medium',
        timeStyle: 'medium',
        hour12: true,
      });
      const utcTime = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      return `🕒 Current Time (${config.brandName} Bot)\n🇧🇩 Bangladesh (Asia/Dhaka): ${dhakaTime}\n🌐 UTC: ${utcTime}`;
    }

    case 'calc': {
      if (!args) {
        return `Usage: ${prefixDisplay}calc 25 * 4 + 10`;
      }
      const calcResult = evaluateSafeCalculation(args);
      if (!calcResult.ok) {
        return `❌ Calculation error: ${calcResult.error}`;
      }
      return `${args} = ${calcResult.result}`;
    }

    case 'help': {
      if (args) {
        const target = config.commands.find(
          (c) => c.name.toLowerCase() === args.toLowerCase().replace(/^\./, '')
        );
        if (target) {
          return [
            `📌 Command: ${prefixDisplay}${target.name}`,
            `💡 Usage: ${prefixDisplay}${target.usage}`,
            `📂 Category: ${target.category}`,
            `🔐 Permission: ${target.permission} (${PERMISSION_LABELS[target.permission]})`,
            `📝 Description: ${target.description}`,
          ].join('\n');
        }
        return `❓ No command named '${args}' found. Send ${prefixDisplay}menu to view all commands.`;
      }
      return [
        `🤖 ${config.brandName} Bot Help Guide (Owner: ${config.ownerName})`,
        `Send ${prefixDisplay}menu for all commands, or ${prefixDisplay}help <command> for details. ✨`,
        `Example: ${prefixDisplay}help calc  or  ${prefixDisplay}ai আপনার প্রশ্ন`,
      ].join('\n');
    }

    case 'config':
      return [
        `⚙️ ${config.brandName} Bot Configuration`,
        `🏢 Company: ${config.brandName} | 👑 Owner: ${config.ownerName}`,
        `prefix: ${config.prefixMode} (symbol: "${config.prefixChar}")`,
        `defaultPermission: ${config.defaultPermission} (${PERMISSION_LABELS[config.defaultPermission]})`,
        `aiAutoReply: ${config.aiAutoReply ? 'enabled ✅' : 'disabled'}`,
      ].join('\n');

    case 'admins': {
      const adminList =
        config.adminPhones.length > 0
          ? config.adminPhones.map((p) => formatOwnerPhoneDisplay(p)).join(', ')
          : ownerPhoneDisplay;
      return [
        `🛡️ ${config.brandName} Bot Administrators`,
        `👑 Primary Owner: ${config.ownerName} (${ownerPhoneDisplay})`,
        `✅ Authorized Bot Admins: ${adminList}`,
      ].join('\n');
    }

    case 'menu': {
      const enabledCmds = config.commands
        .filter((c) => c.enabled)
        .map(
          (c) =>
            `• ${prefixDisplay}${c.name} — ${c.description} [perm: ${c.permission}]`
        );
      return [
        `🤖 ${config.brandName} Bot Command Menu (Owner: ${config.ownerName})`,
        `⚙️ Prefix mode: ${config.prefixMode} · Total commands: ${enabledCmds.length}`,
        '',
        ...enabledCmds,
      ].join('\n');
    }

    case 'learn':
      return `🧠 Usage: ${prefixDisplay}learn <topic> = <fact> (or just tell me any new fact naturally in chat!)`;

    case 'memory':
      return `🧠 NB Bot Memory active. Send ${prefixDisplay}learn <topic> = <fact> to teach new facts anytime!`;

    case 'forget':
      return `🧹 Usage: ${prefixDisplay}forget <topic | all> (Bot Admin only).`;

    case 'groupinfo':
      return `👥 Group Info is active on live WhatsApp groups. Send ${prefixDisplay}groupinfo inside a connected WhatsApp group to view subject, member count, and admins.`;

    case 'tagall':
      return args
        ? `📢 NB Group Tag-All Notice (Permission 3 verified):\n${args}`
        : `📢 NB Group Tag-All ready (Permission 3 verified). Include a message like: ${prefixDisplay}tagall Meeting at 9 PM`;

    case 'hidetag':
      return args
        ? `🔔 NB Group Silent Notice (Permission 3 verified):\n${args}`
        : `Usage: ${prefixDisplay}hidetag <announcement message>`;

    case 'mute':
      return `🔇 Group chat locked to Administrators Only (Permission 3 verified).`;

    case 'unmute':
      return `🔊 Group chat unlocked for All Participants (Permission 3 verified).`;

    case 'kick':
      return `🚫 Group removal command verified (Permission 3: Bot/Group Admin). Mention or reply to a user in a WhatsApp group to remove them.`;

    case 'broadcast':
      return args
        ? `📣 NB Company Broadcast queued by Bot Administrator (Permission 2 verified):\n"${args}"`
        : `Usage: ${prefixDisplay}broadcast <official announcement>`;

    default:
      return `✅ ${config.brandName} command '${commandName}' executed.`;
  }
}

export function formatConfigSnippet(config: BotConfig): string {
  const prefixValue =
    config.prefixMode === 'both' ? `'both'` : config.prefixMode;
  return `export const nbConfig = {
  company: '${config.brandName}',
  owner: {
    name: '${config.ownerName}',
    phone: '${formatOwnerPhoneDisplay(config.ownerPhone)}',
    email: '${config.ownerEmail}',
    facebook: '${config.ownerFacebook}',
  },
  prefix: ${prefixValue},
  prefixSymbol: '${config.prefixChar}',
  defaultPermission: ${config.defaultPermission},
  permission: {
    0: 'All users',
    2: 'Bot administrators only',
    3: 'Bot administrators and group administrators',
  },
  aiAutoReply: ${config.aiAutoReply},
};`;
}
