# MVP Roadmap e Checklist de Funcionalidades

## Progresso consolidado - 15/06/2026

O commit `0624fe4` concluiu a base remota que não existia na versão original
deste roadmap:

- [x] Modos local e remoto selecionados por configuração explícita.
- [x] Supabase Auth com sessão SSR.
- [x] RBAC para admin, modelo e cliente.
- [x] Perfis remotos e identificadores públicos.
- [x] Administração remota de usuários e planos.
- [x] Google Drive para fotos, stories, vídeos e áudio.
- [x] Migração do LocalStorage sem remoção automática dos dados locais.
- [x] Backup da migração no IndexedDB.
- [x] Health check e build de produção validados.

As prioridades ainda abertas concentram-se em chat remoto, anti-spam,
observabilidade, moderação, auditoria, pagamentos e conformidade.

Detalhes:
[`REMOTE-INFRASTRUCTURE-MIGRATION.md`](REMOTE-INFRASTRUCTURE-MIGRATION.md).

## Objetivo
- Entregar um MVP funcional com potencial competitivo: usuário entra, descobre, contata/compra, paga/assina, e recebe suporte.
- Priorizar fluxos que geram valor rapidamente e sustentam conversão.

## Princípios
- Foco no essencial, reduzir escopo ao que impacta conversão.
- Segurança e confiabilidade mínimas (LGPD, moderação básica, auditoria).
- Observabilidade: medir o que importa (onboarding, busca, conversão, erros).

---

## Plano de Hoje (prioridades e testes)

### P1 — Acesso e RBAC (crítico)
- [x] Adicionar guarda de acesso no dashboard (layout de proteção)
- [x] Revisar login/logout e eventos de sessão
- [ ] Revisar cadastro e recuperação de senha remotos
- Testes:
  - [x] Sem login: acesso a `/dashboard/*` é bloqueado
  - [x] Com cliente/modelo/admin: acesso liberado às rotas correspondentes
  - [x] Login e logout atualizam o acesso imediatamente

### P2 — Busca e CTA (crítico)
- [ ] Validar filtros: estado, cidade, preço, serviços, características, “online agora”
- [ ] Garantir CTA funcional na página de detalhe (iniciar chat/contato)
- Testes:
  - [ ] Aplicar filtros combinados e obter resultados consistentes
  - [ ] Abrir detalhe e acionar CTA sem erro

### P3 — Chat/Contato (alto)
- [ ] Envio/recebimento estáveis com indicadores básicos
- [ ] Limite anti‑spam local para plano “free” (ex.: 10 msgs/contato/dia)
- Testes:
  - [ ] Conversa entre usuários mock (cliente ↔ modelo)
  - [ ] Mensagens novas aparecem em tempo real quando possível
  - [ ] Limite de mensagens respeitado por plano

### P4 — Monetização (alto)
- [ ] Página de planos clara com botão “Assinar VIP”
- [ ] Ativação local do plano (sem Stripe) para validar fluxo
- [ ] Registrar eventos de conversão (analytics)
- Testes:
  - [ ] Alterar plano para VIP libera recursos premium
  - [ ] Eventos de conversão são registrados

### Processo de Avaliação e Rollback
- Critérios:
  - [ ] Fluxos críticos (P1–P3) passam em teste manual e funcionais em dev
  - [ ] Sem erros visíveis no console e sem regressões
- Rollback:
  - [ ] Alterações por etapas e commits pequenos (aplicar revert se necessário)
  - [ ] Guardar snapshots de configuração sensível (env, regras)

---

## Etapa 1 — Fundamentos Críticos (Alta prioridade)

### Autenticação e Acesso
- [ ] Cadastro, login e recuperação de senha funcionando
- [ ] Verificação de e‑mail
- [ ] RBAC mínimo (cliente/admin) com proteção às rotas privadas
- Arquivos relacionados: [layout.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/layout.tsx), [cadastro/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/cadastro/page.tsx), [recuperar-senha/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/recuperar-senha/page.tsx)

### Perfis e Conteúdo Básico
- [ ] Criação/edição de perfil
- [ ] Upload controlado (fotos/documentos) com política de tamanho e tipo
- Arquivos relacionados: [profiles.ts](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/lib/db/profiles.ts), [storage.ts](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/lib/db/storage.ts)

### Proteções Essenciais
- [ ] Rate limiting em ações críticas (login, mensagens)
- [ ] Auditoria mínima (quem alterou, quando)

### Critérios de Aceitação
- [ ] Usuário consegue criar conta, confirmar e acessar dashboard privado
- [ ] Perfis persistem com campos obrigatórios validados

---

## Etapa 2 — Descoberta e Detalhe (Alta prioridade)

### Busca e Filtros Essenciais
- [ ] Filtros por categoria, preço, localização, disponibilidade
- [ ] Resultados paginados ou carregamento incremental
- Arquivo relacionado: [search-filters.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/search-filters.tsx)

### Página de Detalhe com CTA
- [ ] Página de detalhe com informações úteis
- [ ] CTA claro: iniciar chat/contato/agendamento
- Arquivos relacionados: [busca/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/busca/page.tsx)

### Critérios de Aceitação
- [ ] Usuário encontra o que procura com filtros úteis
- [ ] CTA dispara o fluxo de contato sem erro

---

## Etapa 3 — Conversão: Chat/Contato (Alta prioridade)

### Chat Funcional
- [ ] Envio e recebimento de mensagens estáveis
- [ ] Indicadores básicos (online, digitando, lido)
- [ ] Limites anti‑spam por plano
- Arquivos relacionados: [chat-layout.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/chat/chat-layout.tsx), [messages.ts](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/lib/db/messages.ts), [chat.ts](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/lib/db/chat.ts)

### Critérios de Aceitação
- [ ] Conversa estável com UX básico pronto para conversão

---

## Etapa 4 — Monetização (Alta prioridade)

### Planos e Pagamentos
- [ ] Página de planos/pricing
- [ ] Checkout Stripe
- [ ] Webhook de ativação/cancelamento
- [ ] Limites por plano (mensagens, contatos, destaques)
- Arquivos relacionados: [vip/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/vip/page.tsx)

### Critérios de Aceitação
- [ ] Assinatura ativa após pagamento e recursos habilitados conforme plano

---

## Etapa 5 — Administração e Moderação (Média prioridade)

### Painel Admin
- [ ] Aprovar/recusar conteúdos e perfis
- [ ] Bloquear/desbloquear
- [ ] Relatórios básicos (conteúdo, usuários, denúncias)
- Arquivo relacionado: [admin/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/dashboard/admin/page.tsx)

### Critérios de Aceitação
- [ ] Fluxo de moderação operante e rastreável

---

## Etapa 6 — Observabilidade e Qualidade (Média prioridade)

### Analytics e Erros
- [ ] Eventos de produto (onboarding, busca, conversão)
- [ ] Monitoramento de erros (Sentry) e logs básicos

### Performance e SEO Essencial
- [ ] Otimização de imagens, cache, metadados padrão
- Arquivo relacionado: [next.config.mjs](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/next.config.mjs)

### Critérios de Aceitação
- [ ] Dashboards com métricas‑chave e erros sob controle

---

## Etapa 7 — Legal e Conformidade (Média prioridade)

### LGPD e Políticas
- [ ] Termos de uso e privacidade publicados
- [ ] Consentimentos necessários (cookies, dados sensíveis)
- [ ] Fluxo de denúncia ativo
- Arquivos relacionados: [termos/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/termos/page.tsx), [privacidade/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/privacidade/page.tsx)

### Critérios de Aceitação
- [ ] Conformidade mínima garantida e comunicada ao usuário

---

## Etapa 8 — SEO e Crescimento (Baixa‑média prioridade)

### Aquisição e Conversão
- [ ] Landing com proposta de valor, prova social e CTAs fortes
- [ ] Sitemap, OpenGraph, schema.org
- [ ] Programa de indicação/convite simples
- Arquivos relacionados: [page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/page.tsx)

### Critérios de Aceitação
- [ ] Índice básico de descoberta e melhoria de conversão

---

## Etapa 9 — Diferenciais Competitivos (Baixa prioridade, incrementais)

### Busca Superior
- [ ] Salvamento de busca e alertas
- [ ] Ranking por relevância (engajamento, qualidade, proximidade)
- Arquivo: [search-filters.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/search-filters.tsx)

### Chat que Converte
- [ ] Templates de mensagens e briefing
- [ ] Agendamento direto no chat e anexos com política segura
- Arquivo: [chat-layout.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/chat/chat-layout.tsx)

---

## Cronograma Sugerido (semanas)
- Semana 1–2: Etapas 1 e 2
- Semana 3: Etapa 3
- Semana 4: Etapa 4
- Semana 5: Etapas 5 e 6
- Semana 6: Etapas 7 e 8
- Contínuo: Etapa 9 (incremental)

## Métricas‑chave
- Taxa de conclusão de cadastro e verificação
- Busca com resultado útil (CTR em detalhe)
- Início de chat/contato e resposta
- Conversão em pagamento e retenção
- Erros por sessão e tempo de resolução

## Riscos e Mitigações
- Falhas em pagamento: testes de webhook, fila/retry
- Abusos no chat: limites, verificação e moderação
- Baixa descoberta: SEO + campanhas ICP

## Ready Checklist de Lançamento
- [ ] Etapas 1–4 completas e testadas
- [ ] Observabilidade e legal básicos ativos
- [ ] Página de planos e checkout funcionais
- [ ] Fluxos críticos com métricas e alarmes
