import fs from 'fs';
import path from 'path';
import {
  DEFAULT_BOT_CONFIG,
  DEFAULT_COMMANDS,
  DEFAULT_OWNER_PHONE,
  enforceLockedOwner,
  normalizeOwnerPhone,
  type BotCommandConfig,
  type BotConfig,
  type PermissionLevel,
  type PrefixMode,
} from '../src/lib/botRules.ts';

const DATA_DIR = path.resolve(process.cwd(), '.nb-data');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function mergeCommands(existing?: BotCommandConfig[]): BotCommandConfig[] {
  if (!Array.isArray(existing) || existing.length === 0) {
    return structuredClone(DEFAULT_COMMANDS);
  }
  const existingMap = new Map(existing.map((c) => [c.id, c]));
  const merged: BotCommandConfig[] = [];

  for (const defCmd of DEFAULT_COMMANDS) {
    const prev = existingMap.get(defCmd.id);
    if (prev) {
      merged.push({
        ...defCmd,
        ...prev,
        usage: prev.usage || defCmd.usage,
      });
      existingMap.delete(defCmd.id);
    } else {
      merged.push({ ...defCmd });
    }
  }

  for (const extra of existingMap.values()) {
    merged.push(extra);
  }

  return merged;
}

export function loadBotConfig(): BotConfig {
  ensureDataDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    const initial = enforceLockedOwner(structuredClone(DEFAULT_BOT_CONFIG));
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<BotConfig>;
    const needsV4Migration = !parsed.configVersion || parsed.configVersion < 4;

    const adminPhones =
      Array.isArray(parsed.adminPhones) && parsed.adminPhones.length > 0
        ? parsed.adminPhones.map((p) => normalizeOwnerPhone(String(p)))
        : [DEFAULT_OWNER_PHONE];

    const merged = enforceLockedOwner({
      ...DEFAULT_BOT_CONFIG,
      ...parsed,
      configVersion: 4,
      adminPhones,
      aiSystemPrompt: needsV4Migration
        ? DEFAULT_BOT_CONFIG.aiSystemPrompt
        : parsed.aiSystemPrompt?.trim() || DEFAULT_BOT_CONFIG.aiSystemPrompt,
      commands: mergeCommands(parsed.commands),
    });

    if (needsV4Migration) {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
    }

    return merged;
  } catch {
    return enforceLockedOwner(structuredClone(DEFAULT_BOT_CONFIG));
  }
}

export function saveBotConfig(input: Partial<BotConfig>): BotConfig {
  ensureDataDir();
  const current = loadBotConfig();

  const validPrefixModes: PrefixMode[] = ['true', 'false', 'both'];
  const prefixMode: PrefixMode = validPrefixModes.includes(
    input.prefixMode as PrefixMode
  )
    ? (input.prefixMode as PrefixMode)
    : current.prefixMode;

  const validPermissions: PermissionLevel[] = [0, 2, 3];
  const defaultPermission: PermissionLevel = validPermissions.includes(
    Number(input.defaultPermission) as PermissionLevel
  )
    ? (Number(input.defaultPermission) as PermissionLevel)
    : current.defaultPermission;

  // Owner identity (brandName, ownerName, ownerPhone, ownerEmail, ownerFacebook) is permanently locked
  const next = enforceLockedOwner({
    ...current,
    prefixMode,
    prefixChar: (input.prefixChar || current.prefixChar || '.').slice(0, 2),
    defaultPermission,
    aiAutoReply:
      typeof input.aiAutoReply === 'boolean'
        ? input.aiAutoReply
        : current.aiAutoReply,
    aiSystemPrompt:
      typeof input.aiSystemPrompt === 'string' && input.aiSystemPrompt.trim()
        ? input.aiSystemPrompt.trim()
        : current.aiSystemPrompt,
    adminPhones: Array.isArray(input.adminPhones)
      ? input.adminPhones
          .map((p) => normalizeOwnerPhone(String(p)))
          .filter(Boolean)
      : current.adminPhones,
    commands: Array.isArray(input.commands)
      ? input.commands.map((cmd) => ({
          ...cmd,
          permission: validPermissions.includes(
            Number(cmd.permission) as PermissionLevel
          )
            ? (Number(cmd.permission) as PermissionLevel)
            : 0,
        }))
      : current.commands,
    configVersion: 4,
  });

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2));
  return next;
}
