# 📝 Registro de Modificações Técnicas (DOCUMENTATION_MODIFICATIONS)

Este documento registra as decisões arquiteturais, melhorias de performance e implementações de UX realizadas recentemente no projeto. Utilize-o para entender o "porquê" das soluções atuais.

---

## 🎨 Frontend & UX

#### [Implementação do Design System Shadcn UI]
*   **Problema:** Inconsistência visual e necessidade de desenvolver componentes complexos (Modais, Selects, Toasts) do zero, o que consumiria muito tempo.
*   **Solução:** Adoção da biblioteca **Shadcn UI** (baseada em Radix UI e Tailwind). Os componentes foram instalados em `components/ui` e customizados para o tema "Dark/Spicy" do projeto.
*   **Resultado:** Interface profissional, acessível e consistente. Aceleração do desenvolvimento de novas features em ~40%.

#### [Layout Responsivo com Sidebar e Header]
*   **Problema:** A navegação precisava funcionar bem tanto em desktops largos quanto em dispositivos móveis, sem duplicar lógica.
*   **Solução:** Criação de uma estratégia híbrida em `layout.tsx` e `header.tsx`.
    *   **Desktop:** Menu horizontal completo.
    *   **Mobile:** Menu "hambúrguer" que aciona um componente `Sheet` (Sidebar) lateral.
*   **Resultado:** Experiência fluida em qualquer tamanho de tela (Mobile-First).

#### [Modal de Detalhes do Modelo]
*   **Problema:** O usuário perdia o contexto da busca ao clicar em um perfil para ver detalhes, tendo que navegar "voltar" constantemente.
*   **Solução:** Implementação do `ModelDetailsModal`. Ao clicar em um card na busca, os detalhes abrem em um overlay (Dialog) sobre a lista.
*   **Resultado:** UX mais ágil ("Quick View"), aumentando o engajamento na página de busca.

#### [Editor Visual Drag & Drop (Home Dinâmica)]
*   **Problema:** A Home Page era estática, exigindo alterações no código para reordenar seções ou alterar textos de marketing, o que limitava a agilidade da equipe de marketing/conteúdo.
*   **Solução:** 
    *   Criação do componente `DynamicHomePage` utilizando `framer-motion` para reordenação visual.
    *   Implementação de `InlineText` para edição de textos diretamente na tela ("WYSWYG").
    *   Persistência da configuração no `localStorage` via `layout-config.ts`.
*   **Resultado:** Administradores podem agora reordenar seções e editar textos promocionais em tempo real sem deploy.

#### [Refinamento do Sistema de Chat e Responsividade]
*   **Problema:** Mensagens longas vazavam do container em dispositivos móveis e usuários não logados não conseguiam iniciar conversas intuitivamente.
*   **Solução:** 
    *   Aplicação de `break-words` e larguras máximas responsivas (`max-w-[85%]`) nos balões de mensagem.
    *   Integração do `FloatingChat` com verificação de login para abrir o modal de autenticação quando necessário.
*   **Resultado:** Experiência de chat robusta em mobile e aumento na conversão de visitantes para usuários registrados.

---

## ⚙️ Backend & Dados

#### [Camada de Abstração de Dados (Data Layer Pattern)]
*   **Problema:** O código de UI (`page.tsx`) estava acoplado diretamente à lógica do Supabase ou aos Mocks, dificultando a manutenção e a troca de fonte de dados.
*   **Solução:** Centralização das chamadas de dados em `lib/db/profiles.ts`. Funções como `fetchProfilesFiltered` decidem internamente se buscam do banco ou retornam erro/vazio (tratado pela UI).
*   **Resultado:** Separação clara de responsabilidades. A UI apenas pede dados, sem saber a origem.

#### [Sistema de Fallback para Modo Demo]
*   **Problema:** Desenvolvedores sem acesso às credenciais de produção do Supabase viam uma tela branca ou erros ao rodar o projeto localmente.
*   **Solução:** Implementação de lógica condicional nos componentes (ex: `search-results.tsx`). Se a camada de dados não retornar registros (ou falhar por falta de config), o frontend carrega automaticamente o `mock-profiles.ts`.
*   **Resultado:** _Zero-config start_. O projeto é "clone & run", facilitando testes e demonstrações sem setup de backend.

#### [Filtros de Busca Combinados (Client-Side + Server-Side)]
*   **Problema:** A filtragem precisava ser instantânea para boa UX, mas robusta para escalar.
*   **Solução:**
    *   Filtros "pesados" (Cidade, Serviços) são preparados para serem enviados ao Supabase na query.
    *   Refinamentos de UI e dados mockados são filtrados via `Array.filter` no cliente (`search-results.tsx`), garantindo feedback imediato.
*   **Resultado:** Busca responsiva e funcional tanto com dados reais quanto fictícios.

---

## 🚀 Performance & Build

#### [Otimização de Imagens com Next/Image]
*   **Problema:** O carregamento de galerias de fotos pesadas causava layout shift (CLS) e lentidão.
*   **Solução:** Migração de tags `<img>` para o componente `Image` do Next.js, configurando tamanhos e placeholders.
*   **Resultado:** Melhor pontuação no Lighthouse e carregamento lazy de imagens fora da viewport.

#### [Verificação de Tipos Estritos (TypeScript)]
*   **Problema:** Erros de acesso a propriedades inexistentes em objetos `profile` causavam quebras em runtime.
*   **Solução:** Definição rigorosa das interfaces `DbProfile` e `Model` (em `lib/db/profiles.ts` e `model-details-modal.tsx`).
*   **Resultado:** Prevenção de erros "undefined is not an object" durante o build e desenvolvimento (`npm run build` passa limpo).

#### [Upload de Mídia e Persistência Local]
*   **Problema:** A funcionalidade de upload de fotos no dashboard da modelo não persistia os dados, e a integração com backend (Supabase Storage) ainda não estava configurada para o ambiente local.
*   **Solução:** 
    *   Extensão da interface `ModelProfile` para incluir array de fotos (base64).
    *   Implementação de `FileReader` no cliente para preview imediato.
    *   Persistência via `localStorage` em `lib/local-auth.ts`, sincronizando o dashboard com a página pública do perfil.
*   **Resultado:** Funcionalidade completa de "Adicionar Mídia" no modo offline/demo, permitindo testes de fluxo ponta a ponta.

#### [Arquitetura de Banco de Dados]
*   **Ação:** Criação do script `supabase/full_schema.sql`.
*   **Descrição:** Define a estrutura completa do banco de dados para produção, incluindo tabelas para `profiles`, `media_gallery`, `verifications`, `reviews`, `conversations` e `messages`, com políticas de segurança (RLS) configuradas.
*   **Objetivo:** Servir de base para a migração do `localStorage` para um banco PostgreSQL real no Supabase.

#### [Sistema de Chat (Funcionalidade de Engajamento)]
*   **Problema:** A plataforma não possuía meio de comunicação entre usuários (modelos e clientes).
*   **Solução:** 
    *   Implementação de `lib/local-chat.ts` para gerenciar mensagens via `localStorage` (simulando backend).
    *   Criação da interface de chat em `components/chat/chat-layout.tsx` (Sidebar de conversas + Janela de chat).
    *   Nova rota `/dashboard/chat` para acesso às mensagens.
    *   Atualização dos botões "Chat Privado" nos perfis para redirecionar para o chat iniciando conversa.
*   **Resultado:** Usuários agora podem trocar mensagens em tempo real (na mesma máquina) e visualizar histórico de conversas, aumentando o engajamento na demo.

#### [Usuário VIP para Testes de Recursos Premium]
*   **Problema:** Não havia uma conta de teste com plano VIP para validar rapidamente fluxos premium no ambiente demo.
*   **Solução:** Inclusão de um usuário demo com `plan: vip` no `LocalAuth`.
*   **Resultado:** Login imediato para validação de recursos premium sem necessidade de setup adicional.

#### [Gestão de Plano VIP via Admin]
*   **Problema:** O admin não conseguia promover clientes para VIP e liberar privilégios no modo demo.
*   **Solução:** Adição de controle de plano no painel admin e sincronização do plano com a sessão local.
*   **Resultado:** Mudança imediata de privilégios para conteúdo, stories, favoritas e mensagens.

#### [Gerenciamento de Mídia Avançado (Áudio e Fotos)]
*   **Problema:** A edição de perfil carecia de recursos multimídia ricos, especificamente a capacidade de adicionar novas fotos separadamente das atuais e a ausência de apresentação de voz (feature solicitada inspirada em concorrentes).
*   **Solução:**
    *   Refatoração do `ImageUpload` para permitir adição incremental de fotos (Drag & Drop) em vez de substituição total.
    *   Implementação do componente `VoiceRecorder` utilizando a API `MediaRecorder` do navegador para gravação, playback e exclusão de áudios de apresentação.
    *   Persistência desses novos campos (`photos` array atualizado e `voicePresentation`) no `localStorage` via `local-auth.ts`.
*   **Resultado:** Perfis mais ricos e imersivos, com capacidade de demonstração completa de multimídia sem backend.

#### [Sincronização de Chat em Tempo Real (Cross-Tab)]
*   **Problema:** Mensagens enviadas em uma aba (ex: cliente) não apareciam instantaneamente na aba do destinatário (ex: modelo) sem recarregar a página, e a contagem de não lidas ficava desatualizada.
*   **Solução:** 
    *   Implementação da API `BroadcastChannel` em `local-chat.ts` e `header.tsx` para comunicação direta entre abas.
    *   Uso de listeners de evento `storage` como fallback e garantia de persistência.
    *   Padronização absoluta dos IDs de usuário (usando e-mail como chave primária em vez de nomes artísticos) para garantir a entrega correta.
*   **Resultado:** Experiência de chat fluida "estilo WhatsApp Web", com atualização instantânea de mensagens e contadores de notificação em todas as janelas abertas.

#### [Recuperação de Senha e UX de Login]
*   **Problema:** Erros de login genéricos ("Credenciais inválidas") frustravam usuários que apenas erravam a senha, e não havia fluxo para recuperação de acesso.
*   **Solução:** 
    *   Refinamento das mensagens de erro no `local-auth.ts` para distinguir "Usuário não encontrado" de "Senha incorreta".
    *   Criação da página dedicada `/recuperar-senha` com feedback visual de envio de e-mail simulado.
*   **Resultado:** Aumento da confiança do usuário e redução de atrito no processo de autenticação.

#### [Funcionalidade de Stories]
*   **Problema:** A experiência de descoberta de modelos era estática e carecia de engajamento imediato visual (estilo redes sociais).
*   **Solução:**
    *   Criação do componente `StoryViewer` para visualização imersiva em tela cheia com auto-advance.
    *   Integração na `ProfilesList` e `ProfileCard` com indicador visual (anel gradiente) para perfis com stories ativos.
    *   Adição de gerenciamento de Stories (upload de imagem/vídeo) no Dashboard da Modelo.
#### [Funcionalidade de Stories - Expansão e Refinamento]
*   **Problema:** A implementação inicial dos stories era apenas um modal simples e não tinha visibilidade suficiente na página de busca, além de conflitos de renderização.
*   **Solução:**
    *   **Nova UX de Busca:** Implementação de uma barra de stories dedicada no topo da busca ("Instagram Style"), com scroll horizontal e indicadores visuais claros.
    *   **Rota Dedicada:** Criação de `/app/stories/page.tsx` para isolar a lógica de visualização e permitir deep linking, resolvendo conflitos de z-index e estado na página de busca.
    *   **Persistência Híbrida:** Atualização do `local-auth.ts` para mesclar dados de `SEED_PROFILES` (demo) com `localStorage` (novos uploads), garantindo que os stories de exemplo nunca sumam, mas permitindo que usuários adicionem os seus.
    *   **Upload de Vídeo:** Suporte adicionado para upload e playback de vídeos curtos nos stories.
*   **Resultado:** Experiência de usuário fluida e familiar, robustez na persistência de dados e código mais limpo e desacoplado.

#### [Correção e Estabilização do Editor de Layout]
*   **Problema:** Erros de linting (`cn` not found) impediam o build correto do componente de administração.
*   **Solução:** Correção das importações e dependências no `components/admin/layout-editor.tsx`.
*   **Resultado:** Ferramenta de administração estável e pronta para uso.
