# 🏗 Arquitetura do Projeto Spicy3

Este documento fornece uma visão geral técnica da arquitetura do projeto **Spicy3**. O objetivo é facilitar o onboarding de novos desenvolvedores e garantir a consistência nas decisões técnicas.

## 1. 🛠 Tech Stack

O projeto utiliza uma stack moderna baseada no ecossistema React/Next.js, priorizando performance, tipagem estática e componentes reutilizáveis.

*   **Framework Principal:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
*   **Biblioteca de UI:** [Shadcn UI](https://ui.shadcn.com/) (baseado em Radix UI)
*   **Ícones:** [Lucide React](https://lucide.dev/)
*   **Backend / BaaS:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
*   **Gerenciamento de Estado:** React Hooks (`useState`, `useEffect`, `useContext`)
*   **Animações:** [Framer Motion](https://www.framer.com/motion/) (para Drag & Drop e transições)
*   **Validação de Formulários:** React Hook Form + Zod (implícito em alguns componentes)

---

## 2. 📂 Estrutura de Diretórios

A estrutura segue o padrão do **App Router** do Next.js, separando rotas, componentes de UI e lógica de negócios.

*   `/app`: **Rotas da Aplicação**. Cada pasta representa uma rota URL (ex: `/busca`, `/perfil/[id]`).
    *   `layout.tsx`: Layouts persistentes (Header, Footer).
    *   `page.tsx`: O conteúdo da rota.
    *   `loading.tsx`: Estados de carregamento (Suspense boundaries).
    *   `/stories`: Visualizador dedicado de stories (estilo rede social).
*   `/components`: **Biblioteca de Componentes**.
    *   `/ui`: Componentes primitivos do Shadcn (Button, Input, Card). Não devem conter lógica de negócio específica.
    *   `/admin`: Componentes da área administrativa e editores (LayoutEditor, InlineText).
    *   `/home`: Componentes da página inicial dinâmica.
    *   `/chat`: Componentes do sistema de chat e vídeo chamadas.
    *   (Raiz): Componentes compostos e de negócio (ex: `profile-card.tsx`, `login-form.tsx`).
*   `/lib`: **Lógica e Utilitários**.
    *   `/db`: Funções de acesso a dados (`profiles.ts`, `storage.ts`).
    *   `layout-config.ts`: Gerenciamento da persistência do layout da Home.
    *   `local-chat.ts`: Lógica de armazenamento de mensagens local.
    *   `local-auth.ts`: Autenticação simulada e gerenciamento de conteúdo editável.
    *   `supabase.ts`: Inicialização do cliente Supabase.
    *   `mock-profiles.ts`: Dados estáticos para fallback/demo.
    *   `utils.ts`: Helpers gerais (cn para classes Tailwind, formatadores).
*   `/hooks`: **Custom Hooks**. Lógica reutilizável de frontend (ex: `use-mobile.tsx`, `use-toast.ts`).
*   `/supabase`: **Infraestrutura de Banco**.
    *   `schema.sql`: Definições das tabelas e políticas de segurança (RLS).
    *   `seed.sql`: Dados iniciais para popular o banco.
*   `/public`: **Assets Estáticos**. Imagens, ícones e SVGs servidos diretamente.

---

## 3. 🔌 Conexão & Fluxo de Dados

O projeto adota uma abordagem híbrida de **Client-Side Fetching** com suporte a **SSR** inicial onde possível.

### Padrão de Acesso a Dados
A comunicação com o Supabase é abstraída em funções dentro de `/lib/db`.
*   **Leitura:** Componentes (como `search-results.tsx`) chamam funções assíncronas (ex: `fetchProfiles`).
*   **Escrita:** Ações de usuário (Login, Upload) chamam diretamente os métodos do Supabase Auth ou Storage.

### Estratégia de Fallback (Resiliência)
O sistema foi desenhado para funcionar mesmo sem o backend conectado:
1.  O código verifica a presença das chaves de API (`NEXT_PUBLIC_SUPABASE_URL`).
2.  **Camada Local (LocalAuth):** Para interações de escrita (Login, Edição de Perfil, Upload, Layout da Home), utilizamos `localStorage`. Isso permite persistência completa de estado na demonstração.
3.  Se as chaves estiverem ausentes e não houver dados locais, o sistema serve dados de **Mock** (`mock-profiles.ts`).
4.  Isso permite desenvolvimento de UI e testes visuais sem dependência de infraestrutura externa.

---

## 4. 🔄 Lógica de Negócio Principal

### Autenticação
*   Gerenciada via **Supabase Auth** (em produção) ou `LocalAuth` (em dev/demo).
*   Suporte a E-mail/Senha e OAuth (Google).
*   **Fluxo Completo:** Login (`login-form.tsx`), Cadastro (`model-signup-form.tsx`) e Recuperação de Senha (`app/recuperar-senha`).
*   Estado de sessão: Persistido localmente, com controle de permissões (RBAC) para Admin, Modelo e Cliente.
*   Plano de usuário opcional em `LocalAuth` (ex.: `vip`) para testes de recursos premium.
*   Admin pode alterar o plano do cliente no painel para liberar recursos VIP.

### Busca e Filtragem
*   Localizada em `/busca`.
*   **Fluxo:** O usuário define filtros (Cidade, Preço, Características) -> `search-results.tsx` solicita dados -> Backend filtra (ou frontend filtra o mock) -> Lista atualizada.
*   A filtragem suporta múltiplos critérios simultâneos (AND logic).

### Visualização de Perfil
*   Rotas dinâmicas: `/perfil/[id]` e `/modelo/[id]`.
*   Carrega detalhes completos do modelo, galeria de fotos e serviços.
*   Utiliza `ModelDetailsModal` para visualização rápida em listas.

---

## 5. 🧪 Modo Demo/Mock

O projeto possui um **Modo Demo Implícito**.

*   **Como funciona:** Se as variáveis de ambiente do Supabase não estiverem configuradas no `.env.local`, a função `hasSupabaseConfig()` retorna `false`.
*   **Comportamento:** As funções de fetch retornam arrays vazios ou nulos, gatilhando o uso de `mockProfiles` nos componentes de UI.
*   **Benefício:** Permite que qualquer dev clone o repositório e rode `npm run dev` imediatamente, vendo a aplicação populada com dados fictícios funcionais.

---

## 6. 🛠 Sistema de Edição Visual (Admin)

O projeto inclui um CMS visual embutido ("Page Builder") para administradores.

*   **Drag & Drop Nativo:** Utiliza `framer-motion` (Reorder.Group) para permitir que o admin reordene seções da Home Page visualmente.
*   **Edição Inline:** Componentes de texto (`h1`, `p`) podem ser editados clicando diretamente neles (`contentEditable`), com salvamento automático no `blur`.
*   **Persistência:** A ordem das seções e os textos editados são salvos no `localStorage` via `lib/layout-config.ts`, permitindo que as alterações persistam entre recargas.
*   **Contexto de Edição:** Um React Context (`EditModeContext`) gerencia o estado global de "Modo Edição", controlando a visibilidade de ferramentas de edição e bordas de seleção.

---

## 7. 💬 Sistema de Chat e Comunicação

Sistema híbrido de mensagens em tempo real e chamadas de vídeo, projetado para funcionar sem backend complexo na demo.

*   **Arquitetura de Dados:**
    *   **IDs:** Utiliza estritamente o e-mail do usuário como identificador único (Primary Key) para garantir consistência na entrega de mensagens entre diferentes componentes (Perfil, Lista, Modal).
    *   **Persistência:** Mensagens são salvas no `localStorage` via `local-chat.ts`.
*   **Sincronização em Tempo Real:**
    *   **BroadcastChannel:** Implementado para comunicação instantânea entre abas (Cross-Tab). Quando uma mensagem é enviada em uma aba, todas as outras instâncias da aplicação recebem o evento e atualizam a UI imediatamente.
    *   **Eventos de Storage:** Fallback para garantir que alterações no armazenamento local sejam refletidas.
*   **Interface (UI):**
    *   **Responsividade:** O `ChatLayout` adapta-se a mobile (lista oculta ao entrar no chat) e desktop (layout dividido).
    *   **Notificações:** Contador de mensagens não lidas no Header (Polling + Eventos), visível para modelos e clientes.
    *   **Chat Flutuante:** Widget global (`FloatingChat`) acessível em todas as páginas.
*   **Vídeo Chamadas (WebRTC):** Implementação experimental ponto-a-ponto usando `BroadcastChannel` para sinalização local.
