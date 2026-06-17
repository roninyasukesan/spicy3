# 🏗 Arquitetura do Projeto Spicy3

Este documento fornece uma visão geral técnica da arquitetura do projeto **Spicy3**. O objetivo é facilitar o onboarding de novos desenvolvedores e garantir a consistência nas decisões técnicas.

## 1. 🛠 Tech Stack

O projeto utiliza uma stack moderna baseada no ecossistema React/Next.js, priorizando performance, tipagem estática e componentes reutilizáveis.

*   **Framework Principal:** [Next.js 16.2.7](https://nextjs.org/) (App Router e Proxy)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
*   **Biblioteca de UI:** [Shadcn UI](https://ui.shadcn.com/) (baseado em Radix UI)
*   **Ícones:** [Lucide React](https://lucide.dev/)
*   **Backend / BaaS:** [Supabase](https://supabase.com/) (PostgreSQL, Auth e RLS)
*   **Arquivos de Mídia:** Google Drive API, acessada apenas pelo servidor Next.js
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
    *   `/supabase`: Clientes browser, SSR e administrativo do Supabase.
    *   `layout-config.ts`: Gerenciamento da persistência do layout da Home.
    *   `local-chat.ts`: Lógica de armazenamento de mensagens local.
    *   `local-auth.ts`: Autenticação simulada e gerenciamento de conteúdo editável.
    *   `remote-mode.ts`: Flags que selecionam persistência local ou remota.
    *   `media-client.ts`: Sincronização de fotos, stories, vídeos e áudio.
    *   `local-infrastructure-migration.ts`: Migração idempotente do navegador.
    *   `mock-profiles.ts`: Dados estáticos para fallback/demo.
    *   `utils.ts`: Helpers gerais (cn para classes Tailwind, formatadores).
*   `/hooks`: **Custom Hooks**. Lógica reutilizável de frontend (ex: `use-mobile.tsx`, `use-toast.ts`).
*   `/supabase`: **Infraestrutura de Banco**.
    *   `schema.sql`: Definições das tabelas e políticas de segurança (RLS).
    *   `seed.sql`: Dados iniciais para popular o banco.
*   `/public`: **Assets Estáticos**. Imagens, ícones e SVGs servidos diretamente.

---

## 3. 🔌 Conexão & Fluxo de Dados

O projeto possui dois modos explícitos e independentes:

```env
NEXT_PUBLIC_REMOTE_DATA_ENABLED=false
NEXT_PUBLIC_REMOTE_MEDIA_ENABLED=false
```

### Modo local

*   Autenticação, perfis e configuração da interface usam LocalStorage.
*   Fotos, stories, vídeos e áudio podem ser mantidos como Data URLs no navegador.
*   `mock-profiles.ts` continua disponível como conteúdo de demonstração.
*   `DashboardLocalGuard` protege as rotas por papel sem depender do Supabase.

### Modo remoto

1.  O navegador autentica com Supabase Auth.
2.  `proxy.ts` valida o token com `getClaims()` e sincroniza cookies SSR.
3.  Server Components e Route Handlers identificam o ator autenticado.
4.  Dados estruturados são lidos e gravados na tabela `profiles`.
5.  Uploads passam por `/api/media`; o arquivo vai para o Google Drive e os metadados para `profile_media`.
6.  A página pública recebe URLs `/api/media/<uuid>`, que aplicam autorização antes do streaming.

Credenciais administrativas do Supabase e credenciais do Google Drive existem
somente no servidor. A UI nunca recebe secret key, service role, refresh token
ou chave privada.

### Migração entre modos

O painel administrativo associa contas por e-mail normalizado, cria contas
ausentes, migra perfis e mídias e preserva os originais no IndexedDB antes de
atualizar o cache local. A operação é idempotente e não apaga automaticamente
os dados locais.

---

## 4. 🔄 Lógica de Negócio Principal

### Autenticação
*   Gerenciada via **Supabase Auth** no modo remoto ou `LocalAuth` no modo local.
*   Suporte a E-mail/Senha e OAuth (Google).
*   `GET /api/auth/me` é o contrato de sincronização da sessão remota com a UI.
*   O Proxy usa `getClaims()`; código de servidor não confia em `getSession()` para proteger dados.
*   Layouts específicos aplicam RBAC para Admin, Modelo e Cliente.
*   Plano de usuário opcional em `LocalAuth` (ex.: `vip`) para testes de recursos premium.
*   No modo remoto, o admin atualiza o plano por `PATCH /api/admin/users/[id]`.

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

O modo demo é controlado pelas flags remotas, não apenas pela presença de
credenciais:

*   Com as duas flags em `false`, nenhum perfil ou arquivo é publicado remotamente.
*   As credenciais podem permanecer configuradas sem alterar o comportamento local.
*   A ausência de configuração pública do Supabase faz o Proxy seguir sem criar sessão remota.
*   Dados mockados e dados persistidos localmente continuam disponíveis para desenvolvimento.
*   Para ativar produção remota, configure as credenciais, altere as duas flags para `true`, reinicie o servidor e valide `/api/media/health`.

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

---

## 8. 📅 Sistema de Agendamento (Novo)

Funcionalidade de interface para facilitar a reserva de horários entre clientes e modelos.

*   **Interface:** Botão dinâmico no perfil da modelo que utiliza o componente `Calendar` (baseado em `react-day-picker`) dentro de um `Popover`.
*   **Localização:** Integrado ao [model-profile.tsx](file:///d%3A/spicy3/spicy3/components/model-profile.tsx).
*   **Internacionalização:** Suporte total ao português brasileiro (pt-BR) via `date-fns`.
*   **Estado:** A data selecionada é mantida no estado local do componente de perfil para visualização imediata.
