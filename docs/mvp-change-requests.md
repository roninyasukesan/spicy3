 # Solicitações de Mudança por Feature (MVP) — Human-in-the-Middle
 
 Este documento sinaliza as mudanças necessárias para atingir o MVP. Nenhuma alteração de código deve ser aplicada antes de aprovação humana explícita.
 
 ---
 
 ## Acesso e RBAC
 - Mudança necessária
   - Garantir proteção consistente nas rotas de `/dashboard/*` com sessão válida (LocalAuth ou Supabase).
 - Proposta de implementação
   - Consolidar guarda de acesso no layout do dashboard e revisar rotas específicas por papel.
   - Referência: [layout.tsx (dashboard)](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/dashboard/layout.tsx)
 - Critério de aceitação
   - Sem login: redireciona para `/cadastro`. Com cliente/modelo/admin: acesso ao dashboard correto.
 - Riscos e rollback
   - Possível bloqueio indevido; manter commits pequenos e reversíveis.
 
 ## Autenticação
 - Mudança necessária
   - Tornar robusto o fallback entre Supabase e LocalAuth sem quebrar em ausência de `.env`.
 - Proposta de implementação
   - Ajustar inicialização de Supabase para tolerância a ausência de envs.
   - Referências: [login-form.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/login-form.tsx), [client-signup-form.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/client-signup-form.tsx), [supabase.ts](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/lib/supabase.ts)
 - Critério de aceitação
   - Login/cadastro/recuperação funcionam com ou sem .env (modo demo).
 - Riscos e rollback
   - Quebra em build/SSR; validar em dev e versionar fallback.
 
 ## Perfis e Upload
 - Mudança necessária
   - Fluxo de edição de perfil e upload com validações (tamanho/tipo) e persistência.
 - Proposta de implementação
   - Criar UI simples de edição e integrar storage com regras; sanitização.
   - Referências: [profiles.ts](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/lib/db/profiles.ts), [storage.ts](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/lib/db/storage.ts)
 - Critério de aceitação
   - Edição e upload funcionam com feedback de erro e limites aplicados.
 - Riscos e rollback
   - Upload inadequado; manter validações no cliente e servidor.
 
 ## Busca e Filtros
 - Mudança necessária
   - Confirmar filtros essenciais e preparar paginação ou carregamento incremental.
 - Proposta de implementação
   - Testar filtros combinados; estruturar paginação local e preparar API.
   - Referências: [search-filters.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/search-filters.tsx), [search-results.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/search-results.tsx)
 - Critério de aceitação
   - Filtros AND com resultados consistentes e UX responsiva.
 - Riscos e rollback
   - Degradação de desempenho; começar com paginação simples.
 
 ## Detalhe e CTA
 - Mudança necessária
   - Garantir que CTA de chat/contato funcione e link de WhatsApp esteja correto.
 - Proposta de implementação
   - Validar navegação para chat com gating por plano; configurar deep link WhatsApp.
   - Referência: [model-details-modal.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/model-details-modal.tsx)
 - Critério de aceitação
   - Cliques disparam ação apropriada sem erros.
 - Riscos e rollback
   - Acesso indevido ao chat; respeitar plano/assinatura.
 
 ## Chat/Contato
 - Mudança necessária
   - Limite anti‑spam por plano (free vs VIP); confirmação de leitura e estabilidade.
 - Proposta de implementação
   - Implementar contador diário de mensagens por contato; persistência local e/ou DB; marcar leitura de forma confiável.
   - Referências: [chat-layout.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/chat/chat-layout.tsx), [chat-service.ts](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/lib/chat-service.ts), [messages.ts](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/lib/db/messages.ts), [chat.ts](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/lib/db/chat.ts)
 - Critério de aceitação
   - Fluxo estável; limites aplicados; sem erros no console.
 - Riscos e rollback
   - Bloqueio excessivo; parametrizar limites e registrar eventos.
 
 ## Monetização
 - Mudança necessária
   - Integrar Stripe Checkout e Webhook; aplicar limites por plano sistemicamente.
 - Proposta de implementação
   - Criar rota de webhook; atualizar plano/recursos; fallback local para demo.
   - Referências: [subscription-modal.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/subscription-modal.tsx), [vip/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/vip/page.tsx)
 - Critério de aceitação
   - Após pagamento, plano ativo e recursos liberados; cancelamento reflete status.
 - Riscos e rollback
   - Falhas de webhook; implementar fila/retry e logs.
 
 ## Administração e Moderação
 - Mudança necessária
   - Aprovação de conteúdos/perfis, relatórios básicos e auditoria mínima.
 - Proposta de implementação
   - Definir ações admin com trilhas de auditoria e UI simples.
   - Referência: [admin/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/dashboard/admin/page.tsx)
 - Critério de aceitação
   - Operações de aprovação/bloqueio rastreáveis e estáveis.
 - Riscos e rollback
   - Moderação excessiva; registrar motivos e permitir reversão.
 
 ## Observabilidade e Qualidade
 - Mudança necessária
   - Implantar analytics de produto, Sentry e checklist SEO/performance.
 - Proposta de implementação
   - Instrumentar eventos-chave; adicionar Sentry; configurar metadados e imagens.
   - Referência: [next.config.mjs](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/next.config.mjs)
 - Critério de aceitação
   - Dashboards com métricas de onboarding, busca, conversão e erros sob controle.
 - Riscos e rollback
   - Ruído em métricas; documentar eventos e amostrar erros.
 
 ## Legal e Conformidade
 - Mudança necessária
   - Consentimentos formais (cookies/dados), fluxo de denúncia com backend.
 - Proposta de implementação
   - Adicionar consent banner; criar endpoint de denúncia e painel de revisão.
   - Referências: [termos/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/termos/page.tsx), [privacidade/page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/privacidade/page.tsx), [age-verification-modal.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/components/age-verification-modal.tsx)
 - Critério de aceitação
   - Consentimentos registrados e denúncias tratadas com SLA básico.
 - Riscos e rollback
   - Fricção de UX; permitir recusar e ajustar granularidade.
 
 ## SEO e Crescimento
 - Mudança necessária
   - Otimizar landing, metadados, sitemap, OpenGraph e schema.org.
 - Proposta de implementação
   - Configurar metadados padrões e sitemap; otimizar imagens e copy.
   - Referência: [page.tsx](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/app/page.tsx)
 - Critério de aceitação
   - Melhor índice de descoberta e CTR em CTA principal.
 - Riscos e rollback
   - Over-otimização; validar com métricas e revisões.
 
 ---
 
 ## Processo de Aprovação (Human-in-the-Middle)
 - Cada seção deve receber: Aprovar / Solicitar Ajustes / Rejeitar.
 - Após aprovação, aplicar mudanças em PRs pequenos e testáveis.
 - Registrar resultados no [mvp-test-report.md](file:///c:/Users/hakun/Documents/Documentos/spicy3/spicy3/docs/mvp-test-report.md).
