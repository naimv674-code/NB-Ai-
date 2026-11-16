import fs from 'fs';
import path from 'path';

export interface LearnedFact {
  id: string;
  topic: string;
  fact: string;
  keywords: string[];
  taughtBy: string;
  createdAt: string;
  updatedAt: string;
  useCount: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.nb-data');
const MEMORY_FILE = path.join(DATA_DIR, 'learned-facts.json');
const MAX_STORED_FACTS = 500;

let cachedFacts: LearnedFact[] | null = null;

const STOP_WORDS = new Set([
  'the',
  'is',
  'am',
  'are',
  'was',
  'were',
  'a',
  'an',
  'and',
  'or',
  'to',
  'of',
  'in',
  'on',
  'for',
  'with',
  'what',
  'who',
  'how',
  'why',
  'when',
  'where',
  'do',
  'does',
  'did',
  'can',
  'you',
  'me',
  'my',
  'i',
  'we',
  'it',
  'this',
  'that',
  'কি',
  'কী',
  'কে',
  'কেন',
  'কখন',
  'কোথায়',
  'কোথায়',
  'কিভাবে',
  'কীভাবে',
  'করে',
  'হয়',
  'হয়',
  'আছে',
  'একটি',
  'একটা',
  'এটা',
  'সেটা',
  'তুমি',
  'আমি',
  'আপনি',
  'বলো',
  'বলেন',
  'क्या',
  'कैसे',
  'क्यों',
  'कौन',
  'है',
  'हैं',
  'में',
  'को',
  'से',
  'का',
  'की',
  'के',
  'ما',
  'ماذا',
  'كيف',
  'لماذا',
  'من',
  'في',
  'على',
]);

// Preserve Unicode combining marks (\p{M}) so Bengali/Hindi/Arabic vowel signs stay attached to words
export function tokenizeMultilingual(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]+/gu, ' ')
    .trim();
  if (!cleaned) return [];
  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
  return Array.from(new Set(tokens));
}

function readFactsFromDisk(): LearnedFact[] {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is LearnedFact =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.topic === 'string' &&
        typeof item.fact === 'string'
    );
  } catch {
    return [];
  }
}

function writeFactsToDisk(facts: LearnedFact[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(facts, null, 2), 'utf-8');
}

export function loadLearnedFacts(): LearnedFact[] {
  if (!cachedFacts) {
    cachedFacts = readFactsFromDisk();
  }
  return [...cachedFacts];
}

export function addOrUpdateLearnedFact(params: {
  topic: string;
  fact: string;
  keywords?: string[];
  taughtBy?: string;
}): LearnedFact {
  const topic = params.topic.trim();
  const fact = params.fact.trim();
  const taughtBy = (params.taughtBy || 'User').trim();
  const derivedKeywords = tokenizeMultilingual(`${topic} ${fact}`);
  const mergedKeywords = Array.from(
    new Set([
      ...(params.keywords ?? [])
        .map((k) => k.toLowerCase().trim())
        .filter(Boolean),
      ...derivedKeywords,
    ])
  ).slice(0, 20);

  const existing = loadLearnedFacts();
  const normTopic = topic.toLowerCase();
  const normFact = fact.toLowerCase();

  const matchIdx = existing.findIndex(
    (f) =>
      f.topic.toLowerCase() === normTopic || f.fact.toLowerCase() === normFact
  );

  const now = new Date().toISOString();
  let saved: LearnedFact;

  if (matchIdx >= 0) {
    const prev = existing[matchIdx];
    saved = {
      ...prev,
      topic,
      fact,
      keywords: Array.from(new Set([...prev.keywords, ...mergedKeywords])).slice(
        0,
        24
      ),
      taughtBy,
      updatedAt: now,
    };
    existing[matchIdx] = saved;
  } else {
    saved = {
      id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topic,
      fact,
      keywords: mergedKeywords,
      taughtBy,
      createdAt: now,
      updatedAt: now,
      useCount: 0,
    };
    existing.unshift(saved);
  }

  cachedFacts = existing.slice(0, MAX_STORED_FACTS);
  writeFactsToDisk(cachedFacts);
  return saved;
}

export function deleteLearnedFact(idOrTopic: string): number {
  const target = idOrTopic.trim().toLowerCase();
  if (!target) return 0;

  const existing = loadLearnedFacts();
  if (target === 'all') {
    const count = existing.length;
    cachedFacts = [];
    writeFactsToDisk([]);
    return count;
  }

  const remaining = existing.filter(
    (f) =>
      f.id.toLowerCase() !== target &&
      f.topic.toLowerCase() !== target &&
      !f.topic.toLowerCase().includes(target)
  );
  const removed = existing.length - remaining.length;
  if (removed > 0) {
    cachedFacts = remaining;
    writeFactsToDisk(cachedFacts);
  }
  return removed;
}

export function findRelevantFacts(query: string, limit = 10): LearnedFact[] {
  const facts = loadLearnedFacts();
  if (facts.length === 0) return [];

  const qLower = query.toLowerCase().trim();
  const qTokens = tokenizeMultilingual(query);

  const scored = facts.map((item) => {
    let score = 0;
    const topicLower = item.topic.toLowerCase();
    const factLower = item.fact.toLowerCase();

    if (qLower && (qLower.includes(topicLower) || topicLower.includes(qLower))) {
      score += 12;
    }

    for (const token of qTokens) {
      if (topicLower.includes(token)) score += 8;
      if (item.keywords.some((k) => k === token || k.includes(token))) {
        score += 5;
      }
      if (factLower.includes(token)) score += 3;
    }

    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}

export function parseExplicitTeachStatement(
  rawText: string
): { topic: string; fact: string } | null {
  const text = rawText.trim();
  if (!text) return null;

  // Pattern 1: Explicit remember/learn prefix
  const prefixMatch = text.match(
    /^(?:মনে রাখো|মনে রেখো|শিখে নাও|জেনে রাখো|শিখো|remember|note that|learn this|learn|याद रखो|تذكر)\s*[:\-–,]?\s*(.+)$/iu
  );
  if (prefixMatch) {
    const body = prefixMatch[1].trim();
    const subEq = body.match(/^(.{1,60}?)\s*(?:=|->|=>|মানে|:)\s*(.{1,400})$/s);
    if (subEq) {
      return { topic: subEq[1].trim(), fact: subEq[2].trim() };
    }
    const tokens = tokenizeMultilingual(body);
    return {
      topic: tokens[0] || body.slice(0, 32),
      fact: body,
    };
  }

  // Pattern 2: "topic = fact" or "topic -> fact"
  const eqMatch = text.match(/^(.{1,60}?)\s*(?:=|->|=>)\s*(.{1,400})$/s);
  if (eqMatch) {
    const topic = eqMatch[1].trim();
    const fact = eqMatch[2].trim();
    if (topic && fact) return { topic, fact };
  }

  return null;
}

const ASCII_QUESTION_START =
  /^(?:what|who|why|how|when|where|which|explain|tell me|can you|could you|please|translate|summarize|give me|write|list|say|help|make|create|generate|draw|calculate|convert|reply|answer|find|check|show|solve|define|search|is|are|do|does|did)\b/iu;

const UNICODE_QUESTION_WORDS = new Set([
  'কি',
  'কী',
  'কে',
  'কেন',
  'কখন',
  'কোথায়',
  'কোথায়',
  'কিভাবে',
  'কীভাবে',
  'কেমনে',
  'কত',
  'কোন',
  'বলো',
  'বলেন',
  'জানাও',
  'লিখো',
  'দাও',
  'দেও',
  'বানাও',
  'বানিয়ে',
  'পারছো',
  'পারো',
  'জানো',
  'চিনতে',
  'করো',
  'क्या',
  'कैसे',
  'क्यों',
  'कौन',
  'कब',
  'कहाँ',
  'बताओ',
  'ما',
  'ماذا',
  'كيف',
  'لماذا',
  'متى',
  'أين',
  'هل',
]);

const SMALLTALK_ONLY =
  /^(?:hi+|hello+|hey+|salam|assalamu\s*alaikum|slm|ok|okay|yes|no|nice|good|great|wow|thanks|thank you|bye|good\s*(?:morning|night|evening)|হ্যালো|হাই|সালাম|আসসালামু\s*আলাইকুম|কেমন\s*আছো|কেমন\s*আছেন|আমি\s*ভালো\s*আছি|ভালো\s*আছি|ধন্যবাদ|ওকে|ঠিক\s*আছে|দারুণ|বাহ|খুব\s*ভালো|জি|হ্যাঁ|না|नमस्ते|धन्यवाद|बहुत\s*अच्छा|السلام\s*عليكم|شكرا)\s*[!.]*$/iu;

export function mightTeachSomethingNew(rawMessage: string): boolean {
  const text = rawMessage.trim();
  if (text.length < 4 || text.length > 300) return false;
  if (text.startsWith('.') || text.startsWith('/') || text.startsWith('!')) {
    return false;
  }
  if (SMALLTALK_ONLY.test(text)) return false;

  if (parseExplicitTeachStatement(text)) return true;

  if (/[?？]/.test(text) || ASCII_QUESTION_START.test(text)) return false;

  const normalizedWords = text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (normalizedWords.some((w) => UNICODE_QUESTION_WORDS.has(w))) {
    return false;
  }

  return normalizedWords.length >= 2 && normalizedWords.length <= 24;
}

/**
 * Instant (<0.5ms), zero-extra-API-call self-learning recorder.
 * Saves user-taught facts and declarative statements (e.g. "কলা খাই") immediately to disk.
 */
export function learnFromUserStatement(params: {
  userMessage: string;
  taughtBy: string;
}): LearnedFact | null {
  const { userMessage, taughtBy } = params;
  if (!mightTeachSomethingNew(userMessage)) return null;

  const explicit = parseExplicitTeachStatement(userMessage);
  if (explicit) {
    return addOrUpdateLearnedFact({
      topic: explicit.topic,
      fact: explicit.fact,
      taughtBy,
    });
  }

  const tokens = tokenizeMultilingual(userMessage);
  if (tokens.length === 0) return null;

  return addOrUpdateLearnedFact({
    topic: tokens[0],
    fact: userMessage.trim(),
    keywords: tokens,
    taughtBy,
  });
}

export function executeMemoryCommand(
  commandName: string,
  args: string,
  senderLabel = 'User'
): string | null {
  if (commandName === 'learn') {
    const trimmed = args.trim();
    if (!trimmed) {
      return '🧠 কী শিখাতে চান তা লিখুন! যেমন: .learn বিষয় = তথ্য 😊✨';
    }
    const parsed = parseExplicitTeachStatement(trimmed);
    const topic =
      parsed?.topic || tokenizeMultilingual(trimmed)[0] || trimmed.slice(0, 32);
    const fact = parsed?.fact || trimmed;
    const saved = addOrUpdateLearnedFact({
      topic,
      fact,
      taughtBy: senderLabel,
    });
    return `✅ শিখে নিয়েছি এবং মনে রেখেছি! 🧠✨\n📌 বিষয়: ${saved.topic}\n💡 তথ্য: ${saved.fact}`;
  }

  if (commandName === 'memory') {
    const facts = loadLearnedFacts();
    if (facts.length === 0) {
      return '🧠 NB AI সম্পূর্ণ Gemini জ্ঞানে সক্রিয় আছে এবং যেকোনো প্রশ্নের উত্তর দিতে প্রস্তুত! ✨ চ্যাটে কোনো ব্যক্তিগত বা কাস্টম তথ্য শেয়ার করলে সেটিও স্বয়ংক্রিয়ভাবে মনে থাকবে। 😊';
    }
    const list = facts
      .slice(0, 15)
      .map((f, idx) => `${idx + 1}. [${f.topic}] → ${f.fact}`)
      .join('\n');
    return `🧠 শেখা তথ্য (${facts.length}টি):\n${list}`;
  }

  if (commandName === 'forget') {
    const target = args.trim();
    if (!target) {
      return '🧹 কোন বিষয়টি ভুলে যেতে হবে লিখুন (যেমন: .forget কলা অথবা .forget all)।';
    }
    const removed = deleteLearnedFact(target);
    if (removed === 0) {
      return `❓ "${target}" নামের কোনো শেখা তথ্য মেমোরিতে পাওয়া যায়নি।`;
    }
    return `🧹 মেমোরি থেকে ${removed}টি তথ্য মুছে ফেলা হয়েছে! ✅`;
  }

  return null;
}
