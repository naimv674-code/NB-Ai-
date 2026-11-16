import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { normalizePhoneNumber } from './src/lib/countries.ts';
import {
  buildBuiltinCommandReply,
  evaluateCommandTrigger,
  type UserRole,
} from './src/lib/botRules.ts';
import { loadBotConfig, saveBotConfig } from './server/configStore.ts';
import {
  generateBotAiReply,
  streamBotAiReply,
} from './server/geminiService.ts';
import {
  addOrUpdateLearnedFact,
  deleteLearnedFact,
  executeMemoryCommand,
  loadLearnedFacts,
} from './server/memoryStore.ts';
import { whatsappManager } from './server/whatsappManager.ts';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    const config = loadBotConfig();
    res.json({
      ok: true,
      brand: config.brandName,
      owner: config.ownerName,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      activeSessions: whatsappManager.listSessions().length,
    });
  });

  app.get('/api/config', (_req, res) => {
    res.json({ config: loadBotConfig() });
  });

  app.put('/api/config', (req, res) => {
    try {
      const updated = saveBotConfig(req.body ?? {});
      res.json({ config: updated });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Invalid configuration payload',
      });
    }
  });

  app.get('/api/memory', (_req, res) => {
    res.json({ facts: loadLearnedFacts() });
  });

  app.post('/api/memory', (req, res) => {
    const { topic = '', fact = '' } = req.body ?? {};
    if (!String(topic).trim() || !String(fact).trim()) {
      res.status(400).json({ error: 'Both topic and fact are required.' });
      return;
    }
    const saved = addOrUpdateLearnedFact({
      topic: String(topic),
      fact: String(fact),
      taughtBy: 'Owner Console',
    });
    res.json({ fact: saved });
  });

  app.delete('/api/memory/:id', (req, res) => {
    const removed = deleteLearnedFact(req.params.id);
    res.json({ removed });
  });

  app.get('/api/whatsapp/sessions', (_req, res) => {
    res.json({ sessions: whatsappManager.listSessions() });
  });

  app.post('/api/whatsapp/pair', async (req, res) => {
    const { countryIso = 'BD', phoneNumber = '', sessionId } = req.body ?? {};
    const validation = normalizePhoneNumber(String(countryIso), String(phoneNumber));

    if (!validation.valid) {
      res.status(400).json({
        error: validation.error || 'Invalid WhatsApp phone number.',
      });
      return;
    }

    const resolvedSessionId =
      typeof sessionId === 'string' && sessionId.trim().length > 0
        ? sessionId.trim().replace(/[^a-zA-Z0-9_-]/g, '')
        : `nb-${validation.e164Digits}`;

    const snapshot = await whatsappManager.startPairing({
      sessionId: resolvedSessionId,
      e164Digits: validation.e164Digits,
      displayNumber: validation.displayNumber,
      countryIso: validation.country.iso,
    });

    res.json({ session: snapshot });
  });

  app.get('/api/whatsapp/status/:sessionId', (req, res) => {
    const snapshot = whatsappManager.getStatus(req.params.sessionId);
    if (!snapshot) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }
    res.json({ session: snapshot });
  });

  app.post('/api/whatsapp/disconnect', async (req, res) => {
    const { sessionId } = req.body ?? {};
    if (typeof sessionId !== 'string' || !sessionId.trim()) {
      res.status(400).json({ error: 'sessionId is required.' });
      return;
    }
    await whatsappManager.disconnect(sessionId.trim());
    res.json({ ok: true });
  });

  app.post('/api/ai/reply', async (req, res) => {
    const {
      message = '',
      senderRole = 'user',
      demoMode = false,
      sessionKey = 'console-default',
    } = req.body ?? {};
    const role: UserRole =
      senderRole === 'bot_admin' || senderRole === 'group_admin'
        ? senderRole
        : 'user';

    const config = loadBotConfig();
    const evaluation = evaluateCommandTrigger(String(message), config, role);

    if (!evaluation.matched) {
      if (demoMode && String(message).trim()) {
        try {
          const reply = await generateBotAiReply(
            String(message).trim(),
            config,
            'Demo Visitor',
            String(sessionKey)
          );
          res.json({
            triggered: true,
            allowed: true,
            usedAi: true,
            command: 'ai-demo',
            reply,
          });
          return;
        } catch (err) {
          const errMessage =
            err instanceof Error ? err.message : 'Gemini AI request failed.';
          res.status(500).json({
            triggered: true,
            allowed: true,
            usedAi: true,
            error: errMessage,
          });
          return;
        }
      }

      res.json({
        triggered: false,
        allowed: false,
        usedAi: false,
        reason: evaluation.reason,
        reply: null,
      });
      return;
    }

    if (!evaluation.allowed) {
      res.json({
        triggered: true,
        allowed: false,
        usedAi: false,
        command: evaluation.command?.name ?? null,
        reason: evaluation.reason,
        reply: evaluation.reason,
      });
      return;
    }

    if (evaluation.command && !evaluation.command.usesAi) {
      const memReply = executeMemoryCommand(
        evaluation.command.name,
        evaluation.args,
        demoMode ? 'Demo Visitor' : `Console (${role})`
      );
      const reply =
        memReply ??
        buildBuiltinCommandReply(
          evaluation.command.name,
          config,
          128,
          evaluation.args
        );
      res.json({
        triggered: true,
        allowed: true,
        usedAi: false,
        command: evaluation.command.name,
        reply,
      });
      return;
    }

    const prefixChar =
      config.prefixMode === 'false' ? '' : config.prefixChar;
    if (evaluation.command && !evaluation.args) {
      res.json({
        triggered: true,
        allowed: true,
        usedAi: false,
        command: evaluation.command.name,
        reply: `Usage: ${prefixChar}${evaluation.command.usage}`,
      });
      return;
    }

    try {
      const prompt =
        evaluation.command?.name === 'translate'
          ? `Translate accurately and naturally: ${evaluation.args || message}`
          : evaluation.command?.name === 'summary'
            ? `Summarize the key points clearly in the same language: ${evaluation.args || message}`
            : evaluation.args || String(message);

      const reply = await generateBotAiReply(
        prompt,
        config,
        demoMode ? 'Demo Visitor' : `Console Sandbox (${role})`,
        String(sessionKey)
      );
      res.json({
        triggered: true,
        allowed: true,
        usedAi: true,
        command: evaluation.command?.name ?? 'ai-auto-reply',
        reply,
      });
    } catch (err) {
      const errMessage =
        err instanceof Error ? err.message : 'Gemini AI request failed.';
      res.status(500).json({
        triggered: true,
        allowed: true,
        usedAi: true,
        error: errMessage,
      });
    }
  });

  app.post('/api/ai/stream', async (req, res) => {
    const {
      message = '',
      senderRole = 'user',
      demoMode = false,
      sessionKey = 'console-default',
    } = req.body ?? {};
    const role: UserRole =
      senderRole === 'bot_admin' || senderRole === 'group_admin'
        ? senderRole
        : 'user';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (payload: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const config = loadBotConfig();
    const trimmed = String(message).trim();
    const senderLabel = demoMode ? 'Demo Visitor' : `Console (${role})`;
    const evaluation = evaluateCommandTrigger(trimmed, config, role);

    if (!evaluation.matched) {
      if (demoMode && trimmed) {
        try {
          sendEvent({ type: 'meta', triggered: true, allowed: true, usedAi: true, command: 'ai-demo' });
          for await (const chunk of streamBotAiReply(trimmed, config, String(sessionKey), senderLabel)) {
            sendEvent({ type: 'chunk', text: chunk });
          }
          sendEvent({ type: 'done' });
        } catch (err) {
          sendEvent({
            type: 'error',
            error: err instanceof Error ? err.message : 'Gemini AI stream failed.',
          });
        }
        res.end();
        return;
      }

      sendEvent({
        type: 'meta',
        triggered: false,
        allowed: false,
        usedAi: false,
        reason: evaluation.reason,
      });
      sendEvent({ type: 'done' });
      res.end();
      return;
    }

    if (!evaluation.allowed) {
      sendEvent({
        type: 'meta',
        triggered: true,
        allowed: false,
        usedAi: false,
        command: evaluation.command?.name ?? null,
        reason: evaluation.reason,
      });
      sendEvent({ type: 'chunk', text: evaluation.reason || 'Permission denied.' });
      sendEvent({ type: 'done' });
      res.end();
      return;
    }

    if (evaluation.command && !evaluation.command.usesAi) {
      const memReply = executeMemoryCommand(
        evaluation.command.name,
        evaluation.args,
        senderLabel
      );
      const reply =
        memReply ??
        buildBuiltinCommandReply(
          evaluation.command.name,
          config,
          128,
          evaluation.args
        );
      sendEvent({
        type: 'meta',
        triggered: true,
        allowed: true,
        usedAi: false,
        command: evaluation.command.name,
      });
      sendEvent({ type: 'chunk', text: reply });
      sendEvent({ type: 'done' });
      res.end();
      return;
    }

    const prefixChar =
      config.prefixMode === 'false' ? '' : config.prefixChar;
    if (evaluation.command && !evaluation.args) {
      sendEvent({
        type: 'meta',
        triggered: true,
        allowed: true,
        usedAi: false,
        command: evaluation.command.name,
      });
      sendEvent({ type: 'chunk', text: `Usage: ${prefixChar}${evaluation.command.usage}` });
      sendEvent({ type: 'done' });
      res.end();
      return;
    }

    try {
      const prompt =
        evaluation.command?.name === 'translate'
          ? `Translate accurately and naturally: ${evaluation.args || trimmed}`
          : evaluation.command?.name === 'summary'
            ? `Summarize the key points clearly in the same language: ${evaluation.args || trimmed}`
            : evaluation.args || trimmed;

      sendEvent({
        type: 'meta',
        triggered: true,
        allowed: true,
        usedAi: true,
        command: evaluation.command?.name ?? 'ai-auto-reply',
      });
      for await (const chunk of streamBotAiReply(prompt, config, String(sessionKey), senderLabel)) {
        sendEvent({ type: 'chunk', text: chunk });
      }
      sendEvent({ type: 'done' });
    } catch (err) {
      sendEvent({
        type: 'error',
        error: err instanceof Error ? err.message : 'Gemini AI stream failed.',
      });
    }
    res.end();
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NB Bot server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NB Bot server:', err);
  process.exit(1);
});
