import path from 'node:path';
import { promises as fs } from 'node:fs';

export type Message = { role: 'user' | 'assistant' | 'system'; content: string; timestamp: string };
export type Agent = { id: string; name: string; systemPrompt?: string; model?: string; createdAt: string; history: Message[] };

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'agents.json');

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE).catch(() => fs.writeFile(DATA_FILE, JSON.stringify([])));
  } catch {
    // ignore
  }
}

async function readStore(): Promise<Agent[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw) as Agent[];
  } catch {
    return [];
  }
}

async function writeStore(items: Agent[]) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

export async function listAgents(): Promise<Agent[]> {
  return await readStore();
}

export async function createAgent(name: string, systemPrompt?: string, model?: string): Promise<Agent> {
  const agents = await readStore();
  const id = crypto.randomUUID();
  const agent: Agent = { id, name, systemPrompt, model: model ?? 'gpt-4o', createdAt: new Date().toISOString(), history: [] };
  agents.push(agent);
  await writeStore(agents);
  return agent;
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  const agents = await readStore();
  return agents.find((a) => a.id === id);
}

export async function appendMessage(id: string, msg: Message): Promise<void> {
  const agents = await readStore();
  const idx = agents.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('Agent not found');
  agents[idx].history.push(msg);
  // Keep history bounded (last 40 messages)
  if (agents[idx].history.length > 40) agents[idx].history = agents[idx].history.slice(-40);
  await writeStore(agents);
}
