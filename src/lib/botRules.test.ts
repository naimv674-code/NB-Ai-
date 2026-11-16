import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORTED_COUNTRIES,
  normalizePhoneNumber,
  formatPairingCode,
} from './countries.ts';
import {
  DEFAULT_BOT_CONFIG,
  evaluateCommandTrigger,
  evaluateSafeCalculation,
  buildBuiltinCommandReply,
  enforceLockedOwner,
  formatOwnerPhoneDisplay,
  hasPermission,
  shouldRespondInChatContext,
  type BotConfig,
} from './botRules.ts';
import {
  addOrUpdateLearnedFact,
  deleteLearnedFact,
  executeMemoryCommand,
  findRelevantFacts,
  mightTeachSomethingNew,
  parseExplicitTeachStatement,
} from '../../server/memoryStore.ts';

test('supports exactly 10 countries with Bangladesh (+880 / +8801) first', () => {
  assert.equal(SUPPORTED_COUNTRIES.length, 10);
  assert.equal(SUPPORTED_COUNTRIES[0].iso, 'BD');
  assert.equal(SUPPORTED_COUNTRIES[0].dialCode, '880');
  assert.equal(SUPPORTED_COUNTRIES[0].examplePrefix, '+8801');
});

test('normalizes Bangladesh mobile numbers from 01..., 1..., and +8801... forms', () => {
  const fromLocalZero = normalizePhoneNumber('BD', '01869816026');
  assert.equal(fromLocalZero.valid, true);
  assert.equal(fromLocalZero.e164Digits, '8801869816026');

  const fromNoZero = normalizePhoneNumber('BD', '1869816026');
  assert.equal(fromNoZero.valid, true);
  assert.equal(fromNoZero.e164Digits, '8801869816026');

  const fromFull = normalizePhoneNumber('BD', '+880 1869-816026');
  assert.equal(fromFull.valid, true);
  assert.equal(fromFull.e164Digits, '8801869816026');
});

test('rejects empty or invalid phone numbers with descriptive errors', () => {
  const empty = normalizePhoneNumber('BD', '   ');
  assert.equal(empty.valid, false);
  assert.ok(empty.error);

  const nonMobileBd = normalizePhoneNumber('BD', '2712345678');
  assert.equal(nonMobileBd.valid, false);
  assert.ok(nonMobileBd.error?.includes('+8801'));

  const shortSg = normalizePhoneNumber('SG', '81234');
  assert.equal(shortSg.valid, false);
});

test('formats 8-character WhatsApp pairing codes with a hyphen', () => {
  assert.equal(formatPairingCode('abcd1234'), 'ABCD-1234');
  assert.equal(formatPairingCode('WXYZ-5678'), 'WXYZ-5678');
});

test('enforces prefix modes true, false, and both', () => {
  const prefixOnlyConfig: BotConfig = {
    ...DEFAULT_BOT_CONFIG,
    prefixMode: 'true',
    aiAutoReply: false,
  };
  assert.equal(
    evaluateCommandTrigger('menu', prefixOnlyConfig, 'user').matched,
    false
  );
  assert.equal(
    evaluateCommandTrigger('.menu', prefixOnlyConfig, 'user').matched,
    true
  );

  const noPrefixConfig: BotConfig = {
    ...DEFAULT_BOT_CONFIG,
    prefixMode: 'false',
    aiAutoReply: false,
  };
  assert.equal(
    evaluateCommandTrigger('.menu', noPrefixConfig, 'user').matched,
    false
  );
  assert.equal(
    evaluateCommandTrigger('menu', noPrefixConfig, 'user').matched,
    true
  );

  const bothConfig: BotConfig = {
    ...DEFAULT_BOT_CONFIG,
    prefixMode: 'both',
    aiAutoReply: false,
  };
  assert.equal(
    evaluateCommandTrigger('.menu', bothConfig, 'user').matched,
    true
  );
  assert.equal(
    evaluateCommandTrigger('menu', bothConfig, 'user').matched,
    true
  );
});

test('enforces permission levels 0, 2, and 3 across commands', () => {
  assert.equal(hasPermission('user', 0), true);
  assert.equal(hasPermission('user', 2), false);
  assert.equal(hasPermission('user', 3), false);

  assert.equal(hasPermission('group_admin', 3), true);
  assert.equal(hasPermission('group_admin', 2), false);

  assert.equal(hasPermission('bot_admin', 0), true);
  assert.equal(hasPermission('bot_admin', 2), true);
  assert.equal(hasPermission('bot_admin', 3), true);

  assert.equal(
    evaluateCommandTrigger('.admins', DEFAULT_BOT_CONFIG, 'user').allowed,
    false
  );
  assert.equal(
    evaluateCommandTrigger('.admins', DEFAULT_BOT_CONFIG, 'bot_admin').allowed,
    true
  );
  assert.equal(
    evaluateCommandTrigger('.mute', DEFAULT_BOT_CONFIG, 'group_admin').allowed,
    true
  );
});

test('owner and info replies contain NAIM contact details and owner lock cannot be bypassed', () => {
  assert.equal(formatOwnerPhoneDisplay('8801869816026'), '+880 1869816026');
  const tampered = enforceLockedOwner({
    ...DEFAULT_BOT_CONFIG,
    brandName: 'Other',
    ownerName: 'Someone Else',
    ownerPhone: '12345',
    ownerEmail: 'fake@example.com',
    ownerFacebook: 'FakeFB',
  });
  assert.equal(tampered.brandName, 'NB');
  assert.equal(tampered.ownerName, 'NAIM');
  assert.equal(tampered.ownerPhone, '8801869816026');
  assert.equal(tampered.ownerEmail, 'naimuddin1623@gmail.com');
  assert.equal(tampered.ownerFacebook, 'MD NAIM');

  const ownerReply = buildBuiltinCommandReply('owner', DEFAULT_BOT_CONFIG, 42);
  assert.ok(ownerReply.includes('NB'));
  assert.ok(ownerReply.includes('NAIM'));
  assert.ok(ownerReply.includes('+880 1869816026'));
  assert.ok(ownerReply.includes('naimuddin1623@gmail.com'));
  assert.ok(ownerReply.includes('MD NAIM'));
});

test('safe calculator evaluates arithmetic and rejects unsafe or invalid expressions', () => {
  assert.deepEqual(evaluateSafeCalculation('25 * 4 + 10'), {
    ok: true,
    result: 110,
  });
  assert.deepEqual(evaluateSafeCalculation('(100 - 25) / 3'), {
    ok: true,
    result: 25,
  });
  assert.equal(evaluateSafeCalculation('10 / 0').ok, false);
  assert.equal(evaluateSafeCalculation('process.exit(1)').ok, false);

  const calcReply = buildBuiltinCommandReply(
    'calc',
    DEFAULT_BOT_CONFIG,
    0,
    '12 * 8'
  );
  assert.equal(calcReply, '12 * 8 = 96');
});

test('inbox replies directly without quoting while groups require quote, mention, or command', () => {
  const casualEval = evaluateCommandTrigger(
    'কেমন আছো বন্ধু',
    DEFAULT_BOT_CONFIG,
    'user'
  );
  assert.equal(casualEval.matched, true);

  // Inbox: replies directly, no quote/tag
  const inboxDecision = shouldRespondInChatContext({
    isGroup: false,
    isReplyToBot: false,
    isBotMentioned: false,
    rawMessage: 'কেমন আছো বন্ধু',
    evaluation: casualEval,
  });
  assert.deepEqual(inboxDecision, {
    shouldRespond: true,
    quoteIncomingMessage: false,
  });

  // Group normal chatter: ignored
  const groupIgnore = shouldRespondInChatContext({
    isGroup: true,
    isReplyToBot: false,
    isBotMentioned: false,
    rawMessage: 'কেমন আছো বন্ধু',
    evaluation: casualEval,
  });
  assert.equal(groupIgnore.shouldRespond, false);

  // Group quoting AI message: responds and quotes
  const groupQuote = shouldRespondInChatContext({
    isGroup: true,
    isReplyToBot: true,
    isBotMentioned: false,
    rawMessage: 'এটা একটু বুঝিয়ে বলো',
    evaluation: casualEval,
  });
  assert.deepEqual(groupQuote, {
    shouldRespond: true,
    quoteIncomingMessage: true,
  });

  // Group tagging bot or addressing "ai ...": responds and quotes
  const groupMention = shouldRespondInChatContext({
    isGroup: true,
    isReplyToBot: false,
    isBotMentioned: true,
    rawMessage: '@NB hello',
    evaluation: casualEval,
  });
  assert.equal(groupMention.shouldRespond, true);

  const aiAddrEval = evaluateCommandTrigger(
    'ai আজকের আবহাওয়া কেমন?',
    DEFAULT_BOT_CONFIG,
    'user'
  );
  const groupAiAddr = shouldRespondInChatContext({
    isGroup: true,
    isReplyToBot: false,
    isBotMentioned: false,
    rawMessage: 'ai আজকের আবহাওয়া কেমন?',
    evaluation: aiAddrEval,
  });
  assert.equal(groupAiAddr.shouldRespond, true);
});

test('self-learning memory parses, saves, and retrieves user-taught facts', () => {
  assert.equal(mightTeachSomethingNew('কলা খাই'), true);
  assert.equal(mightTeachSomethingNew('হ্যালো'), false);
  assert.equal(mightTeachSomethingNew('কলা কি করে?'), false);
  assert.equal(mightTeachSomethingNew('তুমি কি করো'), false);

  const explicit = parseExplicitTeachStatement('মনে রাখো কলা = কলা খাই');
  assert.deepEqual(explicit, { topic: 'কলা', fact: 'কলা খাই' });

  const reply = executeMemoryCommand('learn', 'কলা_টেস্ট = কলা খাই', 'Tester');
  assert.ok(reply?.includes('কলা খাই'));

  const found = findRelevantFacts('কলা_টেস্ট কি করে?');
  assert.ok(found.some((f) => f.fact === 'কলা খাই'));

  const removed = deleteLearnedFact('কলা_টেস্ট');
  assert.ok(removed >= 1);

  const direct = addOrUpdateLearnedFact({
    topic: 'test_topic_nb',
    fact: 'NB stays fast',
    taughtBy: 'UnitTest',
  });
  assert.equal(direct.topic, 'test_topic_nb');
  assert.equal(deleteLearnedFact('test_topic_nb'), 1);
});

test('natural unprefixed sentences starting with command words route to AI instead of failing', () => {
  for (const msg of [
    'help me write a short sorry message',
    'time management tips dao',
    'info about Bangladesh economy',
    'config mane ki',
    'mute option kothay pabo',
    'learn python in 7 days',
    '...',
  ]) {
    const res = evaluateCommandTrigger(msg, DEFAULT_BOT_CONFIG, 'user');
    assert.equal(res.matched, true, msg);
    assert.equal(res.allowed, true, msg);
    assert.equal(res.aiFallback, true, msg);
    assert.equal(res.command, undefined, msg);
  }

  // Exact commands still trigger properly
  const exactHelp = evaluateCommandTrigger('help calc', DEFAULT_BOT_CONFIG, 'user');
  assert.equal(exactHelp.command?.name, 'help');
  const exactTime = evaluateCommandTrigger('time', DEFAULT_BOT_CONFIG, 'user');
  assert.equal(exactTime.command?.name, 'time');
});
