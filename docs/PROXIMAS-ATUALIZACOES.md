# 📋 Próximas Atualizações Recomendadas - Spicy3 MVP

**Data da Análise:** 25/01/2026  
**Status do Projeto:** MVP em desenvolvimento avançado

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

## 🔥 Prioridade Alta (P1) - Próximas 2 Semanas

### 4. Integração Stripe para Monetização Real
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

### 5. Observabilidade: Analytics de Produto
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

### 6. Monitoramento de Erros com Sentry
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

### 7. Fluxo Completo de Administração e Moderação
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

### 8. SEO e Performance
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

### 9. LGPD e Conformidade Legal
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

### 10. Paginação e Performance na Busca
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

### 11. Busca Avançada
- [ ] Salvamento de buscas favoritas
- [ ] Alertas por email quando novos perfis correspondem aos filtros
- [ ] Ranking por relevância (algoritmo baseado em engajamento, qualidade, proximidade)
- [ ] Busca por mapa (integração com Google Maps)

### 12. Chat Avançado
- [ ] Templates de mensagens rápidas
- [ ] Agendamento de encontros direto no chat (calendário)
- [ ] Anexos de imagem (com moderação automática)
- [ ] Tradutor automático para conversas internacionais

### 13. Programa de Indicação
- [ ] Link único de indicação por usuário
- [ ] Bônus/desconto para indicador e indicado
- [ ] Dashboard de indicações no perfil

### 14. Sistema de Reviews e Reputação
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
   - 📋 Planejamento da integração Stripe (P1 #4)
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

**Última atualização:** 25/01/2026 18:04