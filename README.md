## The Hybrid Architect – AI-Priority Middleware

MVP de um sistema de **priorização inteligente de tarefas**.

- **Frontend**: Next.js (App Router) + React + TypeScript + Tailwind CSS  
- **Backend**: rotas de API do Next (`/api/tasks`)  
- **IA**: OpenRouter (`arcee-ai/trinity-large-preview:free`) com fallback heurístico local  
- **Deploy**: Vercel  

### Demo

Aplicação publicada em produção:  
[`https://mvp-lyfiti.vercel.app/`](https://mvp-lyfiti.vercel.app/)

### Como funciona

- O usuário envia uma tarefa com:
  - **Título** (`title`)
  - **Descrição** (`description`)
- O backend prioriza a tarefa:
  - Tenta primeiro usar uma LLM via OpenRouter para devolver:
    - `score`: inteiro de **1 a 10** (urgência/impacto)
    - `justification`: breve explicação em português
  - Se a IA falhar ou não houver chave, aplica uma **heurística local** baseada em:
    - termos de emergência/saúde
    - impacto em negócio (ex.: site fora do ar)
    - pressão de tempo
    - tarefas de baixa prioridade (ex.: necessidades triviais)
- As tarefas priorizadas aparecem no **dashboard**, ordenadas do maior para o menor score.

### API

- `POST /api/tasks`  
  Corpo (JSON):
  ```json
  {
    "title": "Site de vendas caiu",
    "description": "Clientes não conseguem finalizar compras desde as 9h."
  }
  ```
  Resposta (exemplo):
  ```json
  {
    "id": "uuid",
    "title": "Site de vendas caiu",
    "description": "Clientes não conseguem finalizar compras desde as 9h.",
    "score": 9,
    "justification": "Site fora do ar durante horário crítico gera perda financeira imediata.",
    "createdAt": "2026-03-04T12:34:56.000Z"
  }
  ```

- `GET /api/tasks`  
  Retorna um array com todas as tarefas priorizadas (em memória), ordenadas por `score` decrescente.

### Rodando localmente

Dentro da pasta `my-app`:

```bash
npm install
npm run dev
```

Aplicação disponível em `http://localhost:3000`.

