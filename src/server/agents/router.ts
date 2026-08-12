import express from 'express';
import rateLimit from 'express-rate-limit';
import { createAgent, listAgents, getAgent, appendMessage, Message } from './store';
import { callOpenAI } from './openai-client';

const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 }); // 30 requests / minute per IP

router.post('/', limiter, async (req, res) => {
  try {
    const { name, systemPrompt, model } = req.body;
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required' });
    const agent = await createAgent(name, systemPrompt, model);
    res.status(201).json(agent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (_req, res) => {
  try {
    const agents = await listAgents();
    res.json(agents.map((a) => ({ id: a.id, name: a.name, createdAt: a.createdAt, model: a.model })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/message', limiter, async (req, res) => {
  try {
    let { id } = req.params as { id?: string | string[] };
    if (Array.isArray(id)) id = id[0];
    id = (id ?? '') as string;

    const { message } = req.body;
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message is required' });

    const agent = await getAgent(id);
    if (!agent) return res.status(404).json({ error: 'agent not found' });

    // Build messages: system prompt (if any) + recent history + user message
    const system: Message[] = agent.systemPrompt ? [{ role: 'system', content: agent.systemPrompt, timestamp: new Date().toISOString() }] : [];
    const historyMsgs = (agent.history || []).slice(-20).map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp }));
    const userMsg: Message = { role: 'user', content: message, timestamp: new Date().toISOString() };

    const conversation = [...system, ...historyMsgs, userMsg];

    // Call provider
    const replyText = await callOpenAI(conversation, agent.model ?? 'gpt-4o');

    const assistantMsg: Message = { role: 'assistant', content: replyText, timestamp: new Date().toISOString() };

    // Persist
    await appendMessage(id, userMsg);
    await appendMessage(id, assistantMsg);

    res.json({ reply: replyText });
  } catch (err: any) {
    console.error('agent message error', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
