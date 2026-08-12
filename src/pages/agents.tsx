import { useEffect, useState } from 'react';

type AgentSummary = { id: string; name: string; model?: string; createdAt: string };

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => { fetch('/api/agents').then((r) => r.json()).then(setAgents); }, []);

  return (
    <div className="page-shell">
      <div className="container">
        <div style={{ display: 'flex', gap: '2rem' }}>
          <section style={{ flex: 0.6 }}>
            <h2>Agentes</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
              const data = await res.json();
              setAgents((s) => [...s, data]);
              setName('');
            }}>
              <label>
                Nome do agente
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <button className="button button--primary" type="submit">Criar agente</button>
            </form>

            <ul>
              {agents.map((a) => (
                <li key={a.id} style={{ margin: '0.6rem 0' }}>
                  <button className="button button--ghost" onClick={() => setSelected(a.id)}>{a.name}</button>
                </li>
              ))}
            </ul>
          </section>

          <section style={{ flex: 1 }}>
            {selected ? <AgentChat agentId={selected} /> : <div>Selecione um agente para conversar</div>}
          </section>
        </div>
      </div>
    </div>
  );
}

function AgentChat({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [text, setText] = useState('');

  async function send() {
    if (!text) return;
    const user = { role: 'user', text };
    setMessages((m) => [...m, user]);
    setText('');
    try {
      const res = await fetch(`/api/agents/${agentId}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: user.text }) });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Erro: não foi possível contactar o agente.' }]);
    }
  }

  return (
    <div>
      <div style={{ height: 320, overflow: 'auto', border: '1px solid #eee', padding: 12, borderRadius: 8, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <strong>{m.role}:</strong> <span>{m.text}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1 }} />
        <button className="button button--primary" onClick={send}>Enviar</button>
      </div>
    </div>
  );
}
