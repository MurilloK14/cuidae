<div align="center">
  <img src="public/images/cuidae-logo-trimmed.png" alt="Cuidaê Logo" width="280" />

  # Cuidaê / SaúdePraTodos — Healthcare Technology & AI

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
  [![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash-blue?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

  <p align="center">
    <strong>Plataforma inteligente de triagem em saúde conectando o cidadão à rede pública (SUS), hospitais e unidades de saúde com inteligência artificial generativa (Google Gemini Flash) e geolocalização.</strong>
  </p>
</div>

---

## 🏥 Sobre o Projeto

O **Cuidaê (SaúdePraTodos)** foi desenvolvido para simplificar o fluxo de atendimento na rede pública de saúde. A plataforma avalia queixas de saúde via texto e foto, orienta o nível de urgência e direciona o cidadão à unidade correta (UBS, UPA, CAPS ou emergência SAMU), prevenindo filas no lugar errado e atrasos no cuidado.

### ✨ Funcionalidades Principais
- 🤖 **Triagem Inteligente com Google Gemini Flash:** Avaliação clínica preliminar de sintomas por texto e imagens de pele.
- 📍 **Geolocalização & Rota Direta:** Mapeamento automático da UBS ou UPA mais próxima via Google Maps.
- 🏷️ **Camadas de Atendimento:** Gratuito (SUS presencial), Intermediário e Premium (teleconsulta).
- 🏥 **Hub de Unidades e Hospitais:** Visualização de tempos de espera, especialidades e localização.
- 🫀 **Modelo 3D Interativo:** Visualização anatômica em Three.js.
- 🔐 **Autenticação & Histórico:** Login seguro com email/Google e histórico de triagens via Supabase.

---

## 🏗️ Arquitetura do Sistema

```
Cuidaê (SaúdePraTodos)
├── src/                    # Frontend (Next.js 14 App Router + Tailwind)
│   ├── app/                # Rotas: Landing, Triagem, Dashboard, Planos, Auth
│   ├── components/         # Componentes UI, Hero, 3D Canvas, Modais
│   ├── lib/                # Clientes Supabase, Server Actions, Tipos
│   └── services/           # Clientes HTTP de comunicação com a API
├── server/                 # Backend (Express API)
│   ├── routes/             # Rotas /api/triage
│   ├── services/           # Integração Gemini AI, Geolocation, Infermedica
│   └── middleware/         # Upload de imagens com Multer
├── public/                 # Imagens, modelos 3D (.glb) e ícones
└── supabase/               # Schema SQL e políticas RLS
```

---

## 🔌 API Endpoints (Backend Express :3001)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Verificação de status do servidor |
| `GET` | `/api/triage/welcome` | Mensagem inicial humanizada do assistente |
| `POST` | `/api/triage/symptoms` | Avaliação de sintomas em texto via Gemini Flash |
| `POST` | `/api/triage/image` | Análise dermatológica preliminar de foto |

---

## 🚀 Como Executar o Projeto

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/MurilloK14/cuidae.git
cd cuidae
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz baseado no `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-supabase
GEMINI_API_KEY=sua-chave-gemini-aistudio
PORT=3001
```

### 3. Iniciar a Aplicação

#### Opção A: Executar Frontend e Backend Juntos (Recomendado)
```bash
npm run dev:all
```

#### Opção B: Executar em Terminais Separados
- **Terminal 1 — Backend (API Express na porta 3001):**
  ```bash
  npm run server
  ```
- **Terminal 2 — Frontend (Next.js na porta 3000):**
  ```bash
  npm run dev
  ```

Acesse a aplicação em [http://localhost:3000](http://localhost:3000). As requisições de `/api/triage` e `/api/health` são automaticamente redirecionadas para o backend no `:3001`.

---

## 👥 Equipe do Projeto

- **Murillo Kennedy** — Desenvolvimento Frontend & Arquitetura Next.js / Supabase
- **José Fernando AL** — Desenvolvimento Backend & Integração Gemini AI / Geolocalização
