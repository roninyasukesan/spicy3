# 📋 Próximas Atualizações Recomendadas - Spicy3 MVP

**Data da Análise:** 10/06/2026
**Status do Projeto:** MVP em desenvolvimento avançado

---

## Atualização de Status - 15/06/2026

Este arquivo preserva o planejamento elaborado em 10/06/2026. O estado atual
dos itens P0 mudou após o commit
`0624fe4 feat: complete remote infrastructure migration`.

### Concluído

- [x] Proteção dos dashboards por papel nos modos local e remoto.
- [x] Sessão SSR do Supabase com validação por `getClaims()`.
- [x] Contrato `GET /api/auth/me` para sincronizar sessão e UI.
- [x] Modos local/remoto controlados por flags explícitas.
- [x] Perfis e usuários remotos no Supabase.
- [x] Fotos, stories de imagem/vídeo e áudio no Google Drive.
- [x] Streaming autorizado por `/api/media/[id]`.
- [x] CRUD administrativo de usuários e alteração de plano.
- [x] Migração do LocalStorage com backup no IndexedDB e reexecução idempotente.
- [x] Migração real de 18 mídias pertencentes a Laura e Nicole.

### Permanece pendente

- [ ] Limite anti-spam por plano no chat.
- [ ] Auditoria administrativa persistente.
- [ ] Rate limiting nas rotas críticas.
- [ ] UI para exportar ou restaurar o backup do IndexedDB.
- [ ] Upload em partes ou fila para arquivos grandes.
- [ ] Observabilidade, moderação e monetização real.

A descrição técnica atual está em
[`REMOTE-INFRASTRUCTURE-MIGRATION.md`](REMOTE-INFRASTRUCTURE-MIGRATION.md).
A seção P0 #4 abaixo deve ser lida como histórico da proposta original, não
como trabalho ainda não iniciado.

---

## 🎯 Resumo Executivo

Após revisão completa dos arquivos de documentação (`mvp-roadmap.md`, `mvp-change-requests.md`, `mvp-test-report.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `DOCUMENTATION_MODIFICATIONS.md`, `FIXES_APPLIED.md`), identificamos o estado atual do projeto e definimos as próximas ações prioritárias para atingir um MVP funcional e competitivo.

### Estado Atual
✅ **Completo:** Autenticação básica, busca com filtros, chat funcional (local), Stories, perfis dinâmicos, editor visual admin  
⚠️ **Parcial:** RBAC, monetização (sem Stripe real), administração/moderação  
❌ **Pendente:** Observabilidade (analytics/Sentry), SEO avançado, integração Stripe completa

---

## 🚨 Prioridade Crítica (P0) - Semana Atual

### 1. Completar RBAC e Proteção de Rotas
**Status:** Funciona parcialmente  
**Problema:** Guarda de acesso existe no dashboard, mas falta validação em todas as rotas específicas (cliente, modelo, admin).

**Ações:**
- [ ] Revisar e fortalecer `app/dashboard/layout.tsx` com verificação de papel (role)
- [ ] Adicionar verificação específica em:
  - [ ] `/dashboard/admin/*` - Somente admin
  - [ ] `/dashboard/modelo/*` - Somente modelos
  - [ ] `/dashboard/cliente/*` - Somente clientes
- [ ] Testar fluxo completo: login → redirecionar para dashboard correto baseado no role
- [ ] Implementar página de "Acesso Negado" genérica para roles inválidos

**Critério de Aceitação:**
- Sem login: redireciona para `/cadastro`
- Com cliente: acesso apenas a `/dashboard/cliente/*`
- Com modelo: acesso apenas a `/dashboard/modelo/*`
- Com admin: acesso a todas as áreas

**Arquivos Afetados:**
- `app/dashboard/layout.tsx`
- `app/dashboard/admin/page.tsx`
- `app/dashboard/modelo/page.tsx`
- `app/dashboard/cliente/page.tsx`

---

### 2. Robustez de Autenticação sem .env
**Status:** Parcial (risco de crash)  
**Problema:** `lib/supabase.ts` usa `!` nos envs obrigatórios - sem .env configurado, o app quebra.

**Ações:**
- [ ] Modificar `lib/supabase.ts` para criar cliente Supabase apenas se as variáveis existirem
- [ ] Adicionar função `hasSupabaseConfig()` que retorna true/false
- [ ] Atualizar `login-form.tsx`, `client-signup-form.tsx`, `model-signup-form.tsx` para tentar Supabase primeiro, depois fallback para LocalAuth
- [ ] Garantir que o build (`npm run build`) funcione sem .env.local

**Critério de Aceitação:**
- Aplicação inicia sem erros mesmo sem `.env.local`
- Login/cadastro funcionam no modo demo (LocalAuth)
- Console sem erros de "undefined env var"

**Arquivos Afetados:**
- `lib/supabase.ts`
- `components/login-form.tsx`
- `components/client-signup-form.tsx`
- `components/model-signup-form.tsx`

---

### 3. Limite Anti-Spam no Chat por Plano
**Status:** Pendente  
**Problema:** Não há controle de mensagens por plano (free vs VIP), permitindo spam.

**Ações:**
- [ ] Adicionar campo `messagesSentToday` ao LocalUser
- [ ] Implementar função `canSendMessage(userId, modelId)` em `lib/local-chat.ts`:
  - Free: máximo 10 mensagens/dia por contato
  - VIP: ilimitado
- [ ] Adicionar contador visual no chat mostrando mensagens restantes (plano free)
- [ ] Exibir toast quando limite for atingido: "Faça upgrade para VIP para mensagens ilimitadas"
- [ ] Resetar contador diário (pode usar data no localStorage)

**Critério de Aceitação:**
- Usuário free bloqueado após 10 mensagens para mesma modelo no dia
- Usuário VIP sem restrições
- Feedback claro com CTA para upgrade

**Arquivos Afetados:**
- `lib/local-chat.ts`
- `lib/local-auth.ts`
- `components/chat/chat-layout.tsx`
- `components/chat/chat-messages.tsx`

---

### 4. Migrar Usuários para Supabase e Mídia para Google Drive
**Status:** Planejado (integração parcial com Supabase e persistência local ativa)
**Problema:** Usuários, perfis e mídias ainda dependem de `localStorage`. Fotos, stories e áudios são armazenados como Base64 dentro do perfil, o que limita capacidade, segurança, sincronização entre dispositivos e administração centralizada.

**Arquitetura Definida:**
- **Supabase Auth:** cadastro, login, recuperação de senha e sessão.
- **Supabase Database:** usuários, roles, perfis, assinaturas, permissões e metadados das mídias.
- **Google Drive API:** armazenamento dos arquivos de fotos, vídeos, stories, áudios e documentos.
- **Next.js API Routes:** camada segura entre o navegador, Supabase e Google Drive.
- **LocalAuth:** manter apenas como fallback de demonstração durante a migração.

**Modelo de Dados Proposto:**
- [ ] Consolidar `profiles` com `user_id`, role, status, plano e dados públicos.
- [ ] Criar tabela `profile_media` com:
  - [ ] `id`, `profile_id` e `drive_file_id`
  - [ ] `type`: `photo` | `story` | `video` | `audio` | `document`
  - [ ] `mime_type`, tamanho, posição e data de criação
  - [ ] `is_cover`, `is_blurred` e `expires_at`
- [ ] Criar índices e relacionamentos para consulta por perfil, tipo e ordem.
- [ ] Aplicar Row Level Security (RLS) para proprietário, admin e conteúdo VIP.

**Rotas de Mídia:**
- [ ] `POST /api/media/upload` - validar sessão, comprimir/validar e enviar ao Drive.
- [ ] `GET /api/media/[id]` - verificar permissão e entregar ou redirecionar a mídia.
- [ ] `DELETE /api/media/[id]` - remover do Drive e do Supabase.
- [ ] `PATCH /api/media/[id]` - atualizar capa, blur e metadados.
- [ ] `PATCH /api/media/reorder` - persistir a ordem da galeria e dos stories.

**Gestão de Usuários:**
- [ ] Substituir `getUsers()`, `addUser()`, `removeUser()` e `updateUserPlan()` locais.
- [ ] Criar rotas administrativas protegidas para listar, criar, editar, suspender e excluir usuários.
- [ ] Usar `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor.
- [ ] Registrar alterações administrativas em `admin_audit_log`.
- [ ] Sincronizar perfil público com o usuário autenticado pelo `user_id`.

**Gestão de Mídia:**
- [ ] Manter compressão de imagens no cliente antes do upload.
- [ ] Parar de salvar Data URLs/Base64 no `localStorage`.
- [ ] Salvar no Supabase somente o ID do arquivo, metadados e regras de acesso.
- [ ] Organizar arquivos do Drive por ambiente e perfil.
- [ ] Implementar exclusão coordenada entre Drive e Supabase.
- [ ] Implementar cache controlado para reduzir leituras repetidas do Drive.
- [ ] Não tornar arquivos VIP publicamente compartilháveis no Google Drive.

**Segurança:**
- [ ] Credenciais do Google e a service role do Supabase devem existir somente no servidor.
- [ ] Validar tipo MIME, tamanho máximo e proprietário em todos os uploads.
- [ ] Verificar plano VIP ou assinatura antes de liberar conteúdo protegido.
- [ ] Proibir acesso direto do navegador à conta de serviço do Google.
- [ ] Implementar rate limiting e auditoria nas rotas de upload e exclusão.

**Variáveis de Ambiente:**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_DRIVE_FOLDER_ID=
```

**Observação sobre Plugins:**
- O conector Google Drive disponível para agentes auxilia tarefas durante o desenvolvimento.
- A aplicação publicada deverá usar a Google Drive API no servidor; o plugin não substitui autenticação OAuth ou service account em produção.
- A integração Supabase será feita com `@supabase/supabase-js`, SQL migrations e API Routes.

**Estratégia de Migração:**
1. Criar schema, políticas RLS e cliente Supabase de servidor.
2. Implementar serviço e rotas da Google Drive API.
3. Migrar upload, exclusão, capa, blur e ordenação dos dashboards.
4. Migrar perfil público e listagens para consultas Supabase.
5. Migrar gestão administrativa de usuários.
6. Importar dados locais existentes quando necessário.
7. Manter fallback local temporário, atrás de configuração explícita.
8. Remover a persistência Base64 após validação completa.

**Critério de Aceitação:**
- Usuários e sessões são gerenciados pelo Supabase.
- Admin consegue administrar usuários sem depender do navegador atual.
- Mídias permanecem disponíveis após trocar de dispositivo ou limpar o navegador.
- Fotos, stories, vídeos e áudios são armazenados no Google Drive.
- Supabase contém somente dados estruturados e referências das mídias.
- Conteúdo VIP não pode ser acessado sem autorização.
- Exclusão de mídia remove o arquivo do Drive e seu registro no banco.
- O modo demo local continua disponível apenas quando explicitamente habilitado.

**Arquivos Afetados:**
- `lib/local-auth.ts`
- `lib/supabase.ts`
- `lib/db/profiles.ts`
- `lib/db/storage.ts` (substituir por serviço Google Drive)
- `lib/image-utils.ts`
- `app/api/media/*` (novo)
- `app/api/admin/users/*` (novo)
- `app/dashboard/admin/page.tsx`
- `app/dashboard/admin/editar-modelo/page.tsx`
- `app/dashboard/modelo/page.tsx`
- `components/model-profile.tsx`
- `components/profile-details-fetched.tsx`
- `supabase/migrations/*`

**Dependências Previstas:**
```bash
npm install googleapis
```

---

## 🔥 Prioridade Alta (P1) - Próximas 2 Semanas

### 5. Integração Stripe para Monetização Real
**Status:** Pendente (monetização local apenas)  
**Impacto:** Sem receita real, MVP não é viável comercialmente.

**Ações:**
- [ ] Criar conta Stripe e obter chaves de API (test mode)
- [ ] Implementar rota API `/api/checkout/create-session` com Stripe Checkout
- [ ] Criar produtos e preços no Stripe Dashboard:
  - [ ] Plano Gold - R$ 29,90/mês
  - [ ] Plano Diamond - R$ 79,90/mês
- [ ] Implementar webhook `/api/checkout/webhook` para eventos:
  - `checkout.session.completed` → ativar assinatura
  - `customer.subscription.deleted` → desativar assinatura
- [ ] Atualizar `subscription-modal.tsx` para usar Stripe Checkout real
- [ ] Atualizar página `/app/vip/page.tsx` com botões conectados ao Stripe
- [ ] Adicionar campo `stripeCustomerId` e `stripeSubscriptionId` ao perfil do usuário

**Critério de Aceitação:**
- Usuário pode assinar plano VIP com cartão de crédito
- Após pagamento bem-sucedido, recursos premium são habilitados automaticamente
- Webhook processa cancelamentos e atualiza status no DB

**Arquivos Afetados:**
- `app/api/checkout/create-session/route.ts` (novo)
- `app/api/checkout/webhook/route.ts` (novo)
- `components/subscription-modal.tsx`
- `app/vip/page.tsx`
- `lib/db/profiles.ts` (adicionar campos Stripe)

**Dependências:**
```bash
npm install stripe @stripe/stripe-js
```

---

### 6. Observabilidade: Analytics de Produto
**Status:** Pendente  
**Problema:** Não há visibilidade sobre comportamento dos usuários.

**Ações:**
- [ ] Escolher ferramenta: Google Analytics 4 ou Mixpanel ou PostHog (self-hosted)
- [ ] Implementar rastreamento de eventos-chave:
  - **Onboarding:** `signup_started`, `signup_completed`, `email_verified`
  - **Busca:** `search_performed`, `filter_applied`, `profile_viewed`
  - **Conversão:** `chat_initiated`, `subscription_started`, `payment_completed`
  - **Engajamento:** `story_viewed`, `favorite_added`, `message_sent`
- [ ] Criar wrapper de analytics em `lib/analytics.ts` para centralizar chamadas
- [ ] Adicionar eventos nos componentes críticos:
  - `search-results.tsx` → evento de busca
  - `model-details-modal.tsx` → evento de visualização de perfil
  - `chat-layout.tsx` → evento de início de conversa
  - `subscription-modal.tsx` → evento de assinatura

**Critério de Aceitação:**
- Dashboard de analytics mostrando funil de conversão completo
- Identificação de gargalos no fluxo de usuário
- Métricas atualizadas em tempo real

**Arquivos Afetados:**
- `lib/analytics.ts` (novo)
- `app/layout.tsx` (script de analytics)
- Diversos componentes (adicionar eventos)

---

### 7. Monitoramento de Erros com Sentry
**Status:** Pendente  
**Problema:** Erros em produção não são capturados nem reportados.

**Ações:**
- [ ] Criar conta no Sentry (plano free)
- [ ] Instalar SDK: `npm install @sentry/nextjs`
- [ ] Configurar `sentry.client.config.ts` e `sentry.server.config.ts`
- [ ] Adicionar DSN ao `.env.local`
- [ ] Configurar source maps para debugging (`next.config.mjs`)
- [ ] Criar alertas para erros críticos (email/Slack)

**Critério de Aceitação:**
- Erros de runtime são capturados e enviados ao Sentry
- Source maps permitem identificar linha exata do erro
- Alertas configurados para erros que afetam > 10 usuários

**Arquivos Afetados:**
- `sentry.client.config.ts` (novo)
- `sentry.server.config.ts` (novo)
- `next.config.mjs`
- `.env.local`

**Dependências:**
```bash
npm install @sentry/nextjs
```

---

### 8. Fluxo Completo de Administração e Moderação
**Status:** Parcial (UI existe, lógica incompleta)

**Ações:**
- [ ] Implementar aprovação de perfis de modelos:
  - [ ] Adicionar campo `status` ao perfil: `pending` | `approved` | `rejected`
  - [ ] Criar lista de perfis pendentes no painel admin
  - [ ] Botões "Aprovar" e "Rejeitar" com confirmação
  - [ ] Notificar modelo por email quando status mudar
- [ ] Implementar verificação de documentos:
  - [ ] Upload de RG/CNH (frente e verso) e selfie
  - [ ] Painel admin para revisar documentos
  - [ ] Marcar perfil como `verified` após aprovação
- [ ] Sistema de denúncias:
  - [ ] Botão "Denunciar" em perfis e mensagens
  - [ ] Formulário de denúncia com categorias (spam, conteúdo impróprio, etc.)
  - [ ] Fila de denúncias no painel admin
  - [ ] Ações: advertir, suspender ou banir usuário
- [ ] Auditoria:
  - [ ] Registrar todas as ações admin em tabela `admin_audit_log`
  - [ ] Campos: admin_id, action, target_user_id, reason, timestamp

**Critério de Aceitação:**
- Admin consegue aprovar/rejeitar perfis novos
- Admin consegue revisar e aprovar documentos
- Admin consegue processar denúncias e tomar ações
- Todas as ações ficam registradas para auditoria

**Arquivos Afetados:**
- `app/dashboard/admin/page.tsx`
- `lib/db/profiles.ts`
- `lib/db/verifications.ts` (novo)
- `lib/db/reports.ts` (novo)
- `supabase/full_schema.sql` (adicionar tabelas)

---

## ⚡ Prioridade Média (P2) - Próximo Mês

### 9. SEO e Performance
**Status:** Pendente

**Ações:**
- [ ] **Metadados Dinâmicos:**
  - [ ] Adicionar `generateMetadata()` em páginas dinâmicas
  - [ ] OpenGraph tags personalizadas por perfil
  - [ ] Twitter Cards
- [ ] **Sitemap:**
  - [ ] Gerar sitemap.xml automaticamente
  - [ ] Incluir perfis públicos, páginas estáticas
  - [ ] Submit ao Google Search Console
- [ ] **Schema.org (Structured Data):**
  - [ ] Schema `Person` para perfis de modelos
  - [ ] Schema `Organization` para a plataforma
- [ ] **Performance:**
  - [ ] Otimizar todas as imagens para WebP
  - [ ] Implementar lazy loading em galerias
  - [ ] Code splitting por rota
  - [ ] Preload de recursos críticos

**Critério de Aceitação:**
- Score Lighthouse > 90 (Performance, SEO, Best Practices)
- Perfis indexados no Google em até 48h
- Rich snippets aparecem nos resultados de busca

---

### 10. LGPD e Conformidade Legal
**Status:** Funciona (páginas existem, faltam consentimentos)

**Ações:**
- [ ] Implementar Consent Banner (Cookies):
  - [ ] Banner na primeira visita
  - [ ] Opções: Aceitar todos, Necessários apenas, Personalizar
  - [ ] Salvar preferências em `localStorage`
- [ ] Consentimento de dados sensíveis:
  - [ ] Checkbox obrigatório no cadastro: "Li e aceito termos"
  - [ ] Link para política de privacidade
- [ ] Direito ao esquecimento:
  - [ ] Botão "Excluir minha conta" no dashboard
  - [ ] Confirmação com senha
  - [ ] Remover todos os dados em até 30 dias (soft delete inicial)
- [ ] Fluxo de denúncia funcionando (já mencionado em P1)

**Critério de Aceitação:**
- Consent banner funcional e respeitando escolhas
- Cadastro não permite prosseguir sem aceitar termos
- Usuário consegue excluir conta facilmente

**Arquivos Afetados:**
- `components/consent-banner.tsx` (novo)
- `app/layout.tsx`
- `components/client-signup-form.tsx`
- `app/dashboard/cliente/page.tsx` (botão excluir conta)

---

### 11. Paginação e Performance na Busca
**Status:** Funciona (dados locais), falta paginação real

**Ações:**
- [ ] Implementar paginação server-side:
  - [ ] API route `/api/search` com parâmetros `page` e `limit`
  - [ ] Retornar total de resultados + página atual
- [ ] Adicionar componente de paginação em `search-results.tsx`
- [ ] Implementar "Load More" (infinite scroll) como alternativa
- [ ] Cache de resultados no cliente (React Query ou SWR)

**Critério de Aceitação:**
- Busca carrega apenas 20 resultados por vez
- Performance mantida mesmo com 1000+ perfis no banco
- UX fluida com skeleton loaders

---

## 🎨 Melhorias Incrementais (P3) - Diferenciais Competitivos

### 12. Busca Avançada
- [ ] Salvamento de buscas favoritas
- [ ] Alertas por email quando novos perfis correspondem aos filtros
- [ ] Ranking por relevância (algoritmo baseado em engajamento, qualidade, proximidade)
- [ ] Busca por mapa (integração com Google Maps)

### 13. Chat Avançado
- [ ] Templates de mensagens rápidas
- [ ] Agendamento de encontros direto no chat (calendário)
- [ ] Anexos de imagem (com moderação automática)
- [ ] Tradutor automático para conversas internacionais

### 14. Programa de Indicação
- [ ] Link único de indicação por usuário
- [ ] Bônus/desconto para indicador e indicado
- [ ] Dashboard de indicações no perfil

### 15. Sistema de Reviews e Reputação
- [ ] Clientes podem avaliar modelos após interação
- [ ] Sistema de badges (verificado, top rated, respondedor rápido)
- [ ] Média de avaliação visível no card

---

## 📊 Métricas de Sucesso do MVP

### Onboarding
- Taxa de conclusão de cadastro: > 60%
- Taxa de verificação de email: > 40%
- Tempo médio para primeiro perfil visualizado: < 2min

### Busca e Descoberta
- Taxa de clique em perfil (CTR): > 20%
- Busca com resultado útil (1+ perfil): > 90%
- Média de filtros aplicados por busca: 2-3

### Conversão
- Taxa de início de conversa: > 10% dos visitantes
- Taxa de resposta de modelos: > 50%
- Taxa de conversão para assinatura paga: > 2%

### Engajamento
- Sessões por usuário/semana: > 3
- Tempo médio na plataforma: > 10min
- Taxa de retorno D7: > 30%

### Qualidade Técnica
- Erros por sessão: < 0.5
- Tempo de carregamento (p95): < 3s
- Uptime: > 99.5%

---

## 🔄 Próximos Passos Imediatos (Esta Semana)

1. **Segunda-feira:** 
   - ✅ Revisar documentação (completo)
   - 🔧 Implementar RBAC completo (P0 #1)

2. **Terça-feira:** 
   - 🔧 Robustez de autenticação sem .env (P0 #2)
   - 🔧 Testes de fluxo de login/cadastro/recuperação

3. **Quarta-feira:** 
   - 🔧 Limite anti-spam no chat (P0 #3)
   - 🔧 Testes de limites por plano

4. **Quinta-feira:** 
   - 📋 Planejamento da migração Supabase + Google Drive (P0 #4)
   - 📋 Planejamento da integração Stripe (P1 #5)
   - 📋 Criar conta e configurar produtos

5. **Sexta-feira:** 
   - 🧪 Testes completos de regressão
   - 📝 Atualizar documentação com progresso
   - 🚀 Deploy de hotfixes se necessário

---

## 📦 Dependências Técnicas Pendentes

```bash
# Para monetização
npm install stripe @stripe/stripe-js

# Para observabilidade
npm install @sentry/nextjs

# Para analytics (escolher uma)
npm install @vercel/analytics
# ou
npm install mixpanel-browser
# ou
npm install posthog-js

# Para performance
npm install next-pwa (PWA support)
npm install sharp (otimização de imagens)

# Para armazenamento de mídia no Google Drive
npm install googleapis
```

---

## 🎯 Definição de "MVP Pronto para Lançamento"

Checklist obrigatório antes de ir para produção:

- [ ] **Etapas 1-4 do Roadmap completas** (Autenticação + Busca + Chat + Monetização)
- [ ] **RBAC funcionando** sem brechas de segurança
- [ ] **Stripe integrado** e testado em modo sandbox
- [ ] **Observabilidade básica** (analytics + Sentry)
- [ ] **Páginas legais** (Termos, Privacidade, Consentimentos)
- [ ] **Moderação ativa** (aprovação de perfis e denúncias)
- [ ] **Performance validada** (Lighthouse > 80)
- [ ] **Testes de segurança** básicos (OWASP Top 10)
- [ ] **Backup configurado** (banco de dados + storage)
- [ ] **Plano de escalabilidade** documentado

---

## 📞 Contato e Aprovações

Todas as mudanças listadas neste documento devem seguir o processo **Human-in-the-Middle** descrito em `mvp-change-requests.md`. Nenhuma implementação deve ocorrer sem aprovação explícita.

**Documento gerado automaticamente baseado em:** 
- mvp-roadmap.md
- mvp-change-requests.md
- mvp-test-report.md
- ARCHITECTURE.md
- DATABASE_SCHEMA.md
- DOCUMENTATION_MODIFICATIONS.md
- FIXES_APPLIED.md

**Última atualização:** 10/06/2026
