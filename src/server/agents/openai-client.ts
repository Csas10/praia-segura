import type { Message } from './store';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function callOpenAI(messages: Message[], model = 'gpt-4o', max_tokens = 600) {
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not configured');

  const payload = {
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens,
    temperature: 0.2,
  };

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${body}`);
  }

  const data = await res.json();
  // Follow current OpenAI chat completion response shape
  const choice = data.choices?.[0];
  const text = choice?.message?.content ?? '';
  return String(text);
}
