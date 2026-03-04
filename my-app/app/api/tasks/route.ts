// src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';

type Task = {
  id: string;
  title: string;
  description: string;
  score: number;
  justification: string;
  createdAt: string;
};

// Armazenamento em memória (MVP)
const tasks: Task[] = [];

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description } = body;

  if (!title || !description) {
    return NextResponse.json(
      { error: 'title e description são obrigatórios' },
      { status: 400 }
    );
  }

  // Heurística local (fallback se LLM/OpenRouter falhar)
  function localHeuristic() {
    const text = `${title} ${description}`.toLowerCase();

    let score = 5;
    const reasons: string[] = [];

    const emergencyKeywords = ['morrer', 'morte', 'sangue', 'hospital', 'ambulância', 'ambulancia', 'esfaqueado', 'acidente'];
    const businessCriticalKeywords = ['site fora do ar', 'não acessam', 'nao acessam', 'queda', 'queda do site', 'checkout', 'pagamento', 'compras', 'produção', 'producao', 'parado'];
    const timePressureKeywords = ['agora', 'urgente', 'imediato', 'hoje', 'prazo', 'deadline'];
    const lowPriorityKeywords = ['banheiro', 'café', 'cafe', 'pausa', 'descanso', 'almoço', 'almoco'];

    const hits = (words: string[]) =>
      words.some((w) => text.includes(w));

    if (hits(emergencyKeywords)) {
      score = Math.max(score, 9);
      reasons.push('Contém termos de emergência/risco à vida.');
    }

    if (hits(businessCriticalKeywords)) {
      score = Math.max(score, 8);
      reasons.push('Afeta diretamente operação de negócio ou faturamento.');
    }

    if (hits(timePressureKeywords)) {
      score = Math.max(score, 7);
      reasons.push('Indica pressão de tempo ou urgência explícita.');
    }

    if (hits(lowPriorityKeywords)) {
      score = Math.min(score, 3);
      reasons.push('Relacionada a necessidade pessoal/rotina de baixo impacto.');
    }

    const length = description.length;
    if (length > 300 && score < 8) {
      score += 1;
      reasons.push('Descrição longa indica contexto mais complexo/importante.');
    } else if (length < 50 && score > 4) {
      score -= 1;
      reasons.push('Descrição muito curta, prioridade ajustada para baixo.');
    }

    score = Math.min(10, Math.max(1, score));

    const justification =
      reasons.length > 0
        ? reasons.join(' ')
        : 'Prioridade média atribuída por heurística local (fallback sem LLM).';

    return { score, justification };
  }

  // Default: heurística local
  let { score, justification } = localHeuristic();

  // Tentar usar LLM via OpenRouter se a API key existir
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      const prompt = `
Você é um sistema de priorização de tarefas.
Analise a tarefa abaixo e responda APENAS com um JSON válido no formato:
{
  "score": 1,
  "justification": "texto curto explicando o score"
}

Regras para "score" (seja bem consistente):
- 1 a 2: tarefas triviais, desconfortos leves, coisas que podem esperar sem impacto relevante.
- 3 a 4: baixa prioridade; importante apenas para conforto individual, sem impacto maior em negócio ou saúde.
- 5 a 6: prioridade média; relevante, mas não crítica, pode ser planejada.
- 7 a 8: prioridade alta; problemas significativos de negócio ou saúde que exigem atenção rápida.
- 9 a 10: prioridade crítica; risco sério à vida/segurança OU perda financeira muito grande e imediata.

Exemplos orientadores (NÃO responda estes exemplos, são só guia):
- "Preciso ir ao banheiro" → score entre 2 e 4 (necessidade fisiológica, mas não risco de morte imediato).
- "Meu braço está coçando" → score entre 1 e 3 (sintoma leve).
- "Alguém foi esfaqueado / preciso chamar ambulância" → score entre 9 e 10 (risco de morte).
- "Site de compras caiu em plena promoção, estamos perdendo milhares" → score entre 8 e 10 (grande impacto financeiro imediato).

Regras gerais:
- "score": número inteiro de 1 a 10 (10 = máxima prioridade).
- "justification": texto curto explicando o score, em português, referenciando urgência e impacto.

Tarefa:
Título: ${title}
Descrição: ${description}
      `;

      const completion = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'arcee-ai/trinity-large-preview:free',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      }).then((res) => res.json());

      if (completion.error) {
        console.error('Erro na OpenRouter', completion.error);
      } else {
        const content = completion?.choices?.[0]?.message?.content;

        if (typeof content === 'string' && content.trim()) {
          const match = content.match(/\{[\s\S]*\}/);
          const jsonString = match ? match[0] : content;
          const parsed = JSON.parse(jsonString);

          if (typeof parsed.score === 'number') {
            score = Math.min(10, Math.max(1, parsed.score));
          }
          if (typeof parsed.justification === 'string') {
            justification = parsed.justification;
          }
        }
      }
    } catch (err) {
      console.error('Erro ao chamar/parsing OpenRouter, usando heurística local', err);
    }
  }

  const task: Task = {
    id: uuid(),
    title,
    description,
    score,
    justification,
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);

  return NextResponse.json(task);
}

export async function GET() {
  // listar todas as tasks priorizadas
  return NextResponse.json(tasks.sort((a, b) => b.score - a.score));
}