// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Task = {
  id: string;
  title: string;
  description: string;
  score: number;
  justification: string;
  createdAt: string;
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadTasks() {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      setTitle('');
      setDescription('');
      // re-carrega a lista ou adiciona direto
      setTasks((prev) => [data, ...prev].sort((a, b) => b.score - a.score));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center p-8">
      <div className="w-full max-w-3xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">The Hybrid Architect</h1>
          <p className="text-slate-400">
            Middleware de priorização inteligente: envie tarefas, receba scores de 1 a 10.
          </p>
        </header>

        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold">Nova tarefa</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Título da tarefa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Descrição detalhada da tarefa"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? 'Priorizando...' : 'Enviar para priorização'}
            </button>
          </form>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Dashboard de prioridades</h2>
            <button
              onClick={loadTasks}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Atualizar
            </button>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{task.title}</h3>
                  <span className="text-sm font-mono px-2 py-1 rounded-md bg-slate-950 border border-slate-700">
                    Score: {task.score}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{task.description}</p>
                <p className="text-xs text-emerald-300">
                  {task.justification}
                </p>
                <p className="text-[11px] text-slate-500">
                  {new Date(task.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-sm text-slate-500">
                Nenhuma tarefa priorizada ainda. Envie a primeira acima.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}