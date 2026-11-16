import {
  GoogleGenAI,
  ThinkingLevel,
  type Content,
  type GenerateContentResponse,
} from '@google/genai';
import {
  formatOwnerPhoneDisplay,
  type BotConfig,
} from '../src/lib/botRules.ts';
import {
  findRelevantFacts,
  learnFromUserStatement,
} from './memoryStore.ts';

type FastModel = 'gemini-3.1-flash-lite' | 'gemini-4-hydrogen';

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | undefined;
let fastModelOrder: FastModel[] = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
const modelCooldownUntil = new Map<FastModel, number>();

const conversationHistory = new Map<string, Content[]>();
const MAX_HISTORY_MESSAGES = 8;
const FIRST_CHUNK_TIMEOUT_MS = 12000;
const GENERATE_TIMEOUT_MS = 14000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in environment secrets. Set it in Settings > Secrets to enable AI responses.'
    );
  }
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 18000,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedApiKey = apiKey;
  }
  return cachedClient;
}

function getModelConfig(
  model: FastModel,
  systemInstruction: string,
  abortSignal?: AbortSignal
) {
  return {
    systemInstruction,
    abortSignal,
    thinkingConfig: {
      thinkingLevel:
        model === 'gemini-3.1-flash-lite'
          ? ThinkingLevel.MINIMAL
          : ThinkingLevel.LOW,
    },
  };
}

function promoteModel(model: FastModel) {
  fastModelOrder =
    model === 'gemini-3.1-flash-lite'
      ? ['gemini-3.1-flash-lite', 'gemini-4-hydrogen']
      : ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
}

function markCooldownIfQuotaError(model: FastModel, err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    const isDaily =
      msg.includes('PerDay') || msg.includes('per day') || msg.includes('quotaValue');
    const durationMs = isDaily ? 10 * 60_000 : 15_000;
    modelCooldownUntil.set(model, Date.now() + durationMs);
    return true;
  }
  return false;
}

function getAvailableModels(): FastModel[] {
  const now = Date.now();
  const ready = fastModelOrder.filter(
    (m) => (modelCooldownUntil.get(m) ?? 0) <= now
  );
  return ready.length > 0 ? ready : [...fastModelOrder];
}

function formatFriendlyGeminiError(err: unknown): Error {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return new Error(
      '⚠️ Free-tier Gemini API quota limit reached right now. Please wait a moment or switch to a billing-enabled API key in Settings > Secrets for higher quota.'
    );
  }
  if (raw.includes('403') || raw.includes('400') || raw.includes('API_KEY_INVALID')) {
    return new Error(
      '⚠️ Gemini API key error. Please check your GEMINI_API_KEY in Settings > Secrets.'
    );
  }
  return err instanceof Error
    ? err
    : new Error('Gemini AI could not generate a response right now.');
}

function buildSystemInstruction(config: BotConfig, userQuery: string): string {
  const relevantFacts = findRelevantFacts(userQuery, 6);
  const parts = [
    config.aiSystemPrompt,
    `Company: ${config.brandName} | Owner: ${config.ownerName} (${formatOwnerPhoneDisplay(config.ownerPhone)}, ${config.ownerEmail}, Facebook: ${config.ownerFacebook})`,
    'Answer EVERY question directly, accurately, and completely using Gemini’s full knowledge (science, math, coding, general info, message drafting, 1TB+/100TB+ topics).',
  ];

  if (relevantFacts.length > 0) {
    parts.push(
      'Custom Notes:\n' +
        relevantFacts.map((f) => `- [${f.topic}]: ${f.fact}`).join('\n')
    );
  }

  parts.push(
    'Reply strictly in the SAME language & script as the user message (বাংলা, English, हिन्दी, اردو, العربية, Malay, Indonesian, தமிழ், 中文, or Romanized text) with warm emojis 😊✨💡. Be fast and concise.'
  );

  return parts.join('\n');
}

function recordHistory(
  sessionKey: string | undefined,
  prompt: string,
  reply: string
) {
  if (!sessionKey) return;
  const history = conversationHistory.get(sessionKey) ?? [];
  const updated: Content[] = [
    ...history,
    { role: 'user', parts: [{ text: prompt }] },
    { role: 'model', parts: [{ text: reply }] },
  ];
  conversationHistory.set(sessionKey, updated.slice(-MAX_HISTORY_MESSAGES));
}

export async function generateBotAiReply(
  prompt: string,
  config: BotConfig,
  senderLabel = 'WhatsApp User',
  sessionKey?: string
): Promise<string> {
  const ai = getGeminiClient();
  const systemInstruction = buildSystemInstruction(config, prompt);
  const history = sessionKey ? conversationHistory.get(sessionKey) ?? [] : [];
  const contents: Content[] = [
    ...history,
    { role: 'user', parts: [{ text: prompt }] },
  ];

  const available = getAvailableModels();
  const attempts: FastModel[] = [...available, available[0]];
  let lastError: unknown;

  for (let i = 0; i < attempts.length; i++) {
    const model = attempts[i];
    try {
      const started = Date.now();
      const response = await ai.models.generateContent({
        model,
        contents,
        config: getModelConfig(
          model,
          systemInstruction,
          AbortSignal.timeout(GENERATE_TIMEOUT_MS)
        ),
      });
      const text = response.text?.trim();
      if (!text) {
        throw new Error(`${model} returned an empty response`);
      }
      promoteModel(model);
      console.log(`[NB AI] ${model} reply in ${Date.now() - started}ms`);
      recordHistory(sessionKey, prompt, text);
      learnFromUserStatement({ userMessage: prompt, taughtBy: senderLabel });
      return text;
    } catch (err) {
      lastError = err;
      const isQuota = markCooldownIfQuotaError(model, err);
      console.warn(
        `[NB AI] ${model} failed:`,
        err instanceof Error ? err.message : err
      );
      if (isQuota && i === 0 && available.length === 1) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }

  throw formatFriendlyGeminiError(lastError);
}

export async function* streamBotAiReply(
  prompt: string,
  config: BotConfig,
  sessionKey?: string,
  senderLabel = 'Demo User'
): AsyncGenerator<string> {
  const ai = getGeminiClient();
  const systemInstruction = buildSystemInstruction(config, prompt);
  const history = sessionKey ? conversationHistory.get(sessionKey) ?? [] : [];
  const contents: Content[] = [
    ...history,
    { role: 'user', parts: [{ text: prompt }] },
  ];

  const modelAttempts = getAvailableModels();
  let lastError: unknown;

  for (const model of modelAttempts) {
    const controller = new AbortController();
    let gotFirstChunk = false;
    const firstChunkTimer = setTimeout(() => {
      if (!gotFirstChunk) {
        controller.abort(
          new Error(`${model} first-chunk timeout (${FIRST_CHUNK_TIMEOUT_MS}ms)`)
        );
      }
    }, FIRST_CHUNK_TIMEOUT_MS);

    const totalTimer = setTimeout(() => {
      controller.abort(new Error(`${model} total stream timeout`));
    }, 25000);

    try {
      const started = Date.now();
      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config: getModelConfig(model, systemInstruction, controller.signal),
      });

      let fullText = '';
      for await (const chunk of stream) {
        const piece = chunk.text;
        if (piece) {
          if (!gotFirstChunk) {
            gotFirstChunk = true;
            clearTimeout(firstChunkTimer);
            console.log(
              `[NB AI] ${model} first chunk in ${Date.now() - started}ms`
            );
          }
          fullText += piece;
          yield piece;
        }
      }

      clearTimeout(firstChunkTimer);
      clearTimeout(totalTimer);

      const cleaned = fullText.trim();
      if (cleaned) {
        promoteModel(model);
        recordHistory(sessionKey, prompt, cleaned);
        learnFromUserStatement({ userMessage: prompt, taughtBy: senderLabel });
        return;
      }

      lastError = new Error(`${model} stream ended with empty text`);
      console.warn(`[NB AI] ${model} stream yielded empty text, retrying...`);
    } catch (err) {
      clearTimeout(firstChunkTimer);
      clearTimeout(totalTimer);
      lastError = err;
      markCooldownIfQuotaError(model, err);
      console.warn(
        `[NB AI] ${model} stream error:`,
        err instanceof Error ? err.message : err
      );
      if (gotFirstChunk) {
        return;
      }
    }
  }

  // Final safety net using whichever available model has not hit daily quota
  const fallbackModel = getAvailableModels()[0] ?? 'gemini-3.1-flash-lite';
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: fallbackModel,
      contents,
      config: getModelConfig(
        fallbackModel,
        systemInstruction,
        AbortSignal.timeout(GENERATE_TIMEOUT_MS)
      ),
    });
    const text = response.text?.trim();
    if (text) {
      promoteModel(fallbackModel);
      recordHistory(sessionKey, prompt, text);
      learnFromUserStatement({ userMessage: prompt, taughtBy: senderLabel });
      yield text;
      return;
    }
  } catch (err) {
    lastError = err;
    markCooldownIfQuotaError(fallbackModel, err);
  }

  throw formatFriendlyGeminiError(lastError);
}
