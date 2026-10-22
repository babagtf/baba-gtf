# ⚽ BABA GTF — Gestão de Mensalidades e Eventos

Sistema web progressivo (PWA) desenvolvido para o controle financeiro e gestão de mensalidades, despesas, eventos e associados do grupo de futebol **BABA GTF**.

## Tecnologias Utilizadas

O projeto foi construído com as seguintes tecnologias:

- **[React 18](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)**
- **[Vite](https://vitejs.dev/)** (Build tool e dev server)
- **[Ant Design (v5)](https://ant.design/)** (Biblioteca de componentes de UI)
- **[Zustand](https://zustand-demo.pmnd.rs/)** (Gerenciamento de estado global)
- **[Firebase (v10)](https://firebase.google.com/)** (Firestore para banco de dados NoSQL e Google Auth para autenticação)
- **[Vite PWA](https://vite-pwa-org.netlify.app/)** (Transforma o app em Progressive Web App com suporte offline)

## Funcionalidades Principais

- **Autenticação Segura:** Login exclusivo via Google (OAuth), com lista de e-mails de administradores autorizados duplamente validada (no cliente e nas regras do Firestore).
- **Dashboard Dinâmico:** Visão geral de caixa, valores mensais, receitas x despesas e status de inadimplência em tempo real.
- **Grade de Mensalidades:** Matriz anual interativa (associados x meses) para visualização e lançamento rápido de pagamentos, festas e extras.
- **Lançamentos e Despesas:** Controle detalhado de entradas (mensalidades, visitantes, eventos) e saídas (juiz, goleiro, bola, outras despesas).
- **Tempo Real:** Sincronização instantânea de dados via `onSnapshot` do Firestore. Se um admin altera no PC, o celular de outro admin atualiza na hora.
- **Soft Delete (Auditoria):** Lançamentos e despesas não são apagados do banco, mas sim "anulados", mantendo o histórico de quem editou/anulou e o motivo, para total transparência.
- **PWA (Progressive Web App):** Pode ser instalado na tela inicial do celular ou desktop e funciona parcialmente offline.
- **Campanha (Confra):** Controle de metas e parcelas para a festa de fim de ano do grupo.

## Como rodar o projeto localmente

### Pré-requisitos
- Node.js (versão 18 ou superior)
- Conta no Firebase com um projeto configurado (Firestore + Google Authentication)

### Passo a passo

1. Clone o repositório:
```bash
git clone https://github.com/babagtf/baba-gtf.git
cd baba-gtf
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto e adicione as credenciais do seu projeto Firebase:
```env
VITE_FIREBASE_API_KEY=seu_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse `http://localhost:5173` no seu navegador.

##  Segurança e Regras do Firestore

A segurança do banco de dados é feita via **Firestore Security Rules**. O acesso à coleção `config` é restrito aos e-mails listados em `src/config/admins.ts` e nas próprias regras do console do Firebase.

Para saber mais sobre as regras, consulte o arquivo de regras no Firebase Console ou entre em contato com a diretoria.