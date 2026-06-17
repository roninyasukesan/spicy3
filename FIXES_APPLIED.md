# Correções de Inconsistências e Riscos Aplicadas

---

## 📅 [15/06/2026] - Infraestrutura Remota e Migração de Dados

### 1. Persistência remota ambígua ✅
- **Problema:** Dados locais e remotos podiam ser acionados sem uma regra única.
- **Correção:** Uso centralizado de `NEXT_PUBLIC_REMOTE_DATA_ENABLED` e `NEXT_PUBLIC_REMOTE_MEDIA_ENABLED`.
- **Arquivos:** `lib/remote-mode.ts`, `lib/profile-client.ts`, `lib/media-client.ts`.

### 2. Sessão remota não sincronizada com a UI local ✅
- **Problema:** A sessão Supabase e o estado usado pelos componentes podiam divergir.
- **Correção:** Adicionados `GET /api/auth/me`, `DashboardAuthBridge`, logout Supabase e atualização imediata do cache local.
- **Arquivos:** `app/api/auth/me/route.ts`, `components/dashboard-auth-bridge.tsx`, `components/header.tsx`, `components/login-form.tsx`.

### 3. Dashboards sem proteção uniforme por papel ✅
- **Problema:** A proteção estava concentrada em um layout genérico.
- **Correção:** Layouts específicos de admin, modelo e cliente passaram a validar sessão e papel. O modo local recebeu uma guarda equivalente.
- **Arquivos:** `app/dashboard/*/layout.tsx`, `components/dashboard-local-guard.tsx`.

### 4. Migração podia perder metadados ou duplicar mídias ✅
- **Problema:** Uma execução parcial poderia reenviar arquivos e sobrescrever ordem ou desfoque.
- **Correção:** Backup prévio no IndexedDB, reaproveitamento por tipo/MIME/tamanho e merge em que os metadados locais têm precedência.
- **Arquivos:** `lib/local-infrastructure-migration.ts`, `lib/media-client.ts`.

### 5. Stories, vídeos e áudio não participavam do fluxo remoto ✅
- **Correção:** `syncRemoteProfileMedia` passou a sincronizar fotos, stories e áudio, com suporte a imagem e vídeo.
- **Arquivos:** `lib/media-client.ts`, dashboards e componentes de perfil.

### 6. Plano VIP divergente do banco ✅
- **Problema:** A UI usa `vip`, enquanto o banco usa `gold`.
- **Correção:** Os contratos administrativos convertem `vip` para `gold` na persistência e retornam o modelo esperado pela interface.
- **Arquivos:** `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts`.

### 7. Erros de tipagem bloqueavam o build ✅
- **Correção:** Ajustadas tipagens do chat, favoritos, calendário, stories e componentes de perfil.
- **Resultado:** ESLint, TypeScript e build de produção aprovados.

Consulte [`docs/REMOTE-INFRASTRUCTURE-MIGRATION.md`](docs/REMOTE-INFRASTRUCTURE-MIGRATION.md) para o fluxo completo e os resultados da migração.

---

## 📅 [03/06/2026] - Atualização de Arquitetura e Restauração de UI

### 1. Atualização para Next.js 16.2.7 ✅
- **Estado Anterior:** O projeto operava em versões instáveis de desenvolvimento (Next.js 16.1.x), com modelo de cache implícito e performance de dev limitada.
- **Mudança:** Atualizado Next.js para **16.2.7** e React para **19.2.6**. Ativado `cacheComponents: true` (cache explícito) no `next.config.mjs`.
- **Arquivos:** `package.json`, `next.config.mjs`.

### 2. Otimização para Agentes de IA ✅
- **Mudança:** Criação do arquivo `AGENTS.md` com diretrizes para agentes de IA e ativação de **Browser Log Forwarding**.
- **Arquivos:** `AGENTS.md`.

### 3. Restauração do Estado Original com Perfis Adicionados ✅
- **Estado Anterior:** Alterações experimentais haviam descaracterizado a UI (cores, logo e modais) e havia risco de perda dos novos perfis de modelos ao restaurar a branch `main`.
- **Mudança:** Restaurada UI da `main`. Atualizado `lib/local-auth.ts` para incluir os 14 novos perfis de `lib/mock-profiles.ts`.
- **Arquivos:** `lib/local-auth.ts`, `components/header.tsx`, `components/login-form.tsx`, `components/landing-featured-models-section.tsx`.

### 4. Ajustes de Identidade Visual ✅
- **Mudança:** Logo branca com ícone vermelho, botões de ação e login em vermelho (#dc2626).
- **Arquivos:** `components/header.tsx`, `components/login-form.tsx`, `components/model-details-modal.tsx`.

---

## 📅 [23/01/2026] - Correções de Inconsistências e Riscos (Histórico Original)

### 1. AgeVerificationModal não renderizado no layout ✅
- **Problema:** O componente `AgeVerificationModal` estava importado em `layout.tsx`, mas nunca era renderizado.
- **Solução:** Adicionado ao `RootLayout` dentro do `ThemeProvider`.
- **Arquivo:** `app/layout.tsx`.

### 2. Handlers ausentes no ModelDetailsModal ✅
- **Problema:** Funções `handleChat` e `handleVideoCall` não estavam implementadas.
- **Solução:** Adicionada lógica de verificação de assinatura e redirecionamento.
- **Arquivo:** `components/model-details-modal.tsx`.

### 3. Tipagem incompleta do LocalUser ✅
- **Problema:** O tipo `LocalUser` não incluía `plan` nem `subscribedModelIds`.
- **Solução:** Atualizada a definição do tipo.
- **Arquivo:** `lib/local-auth.ts`.

### 4. Erro de Hidratação no Login ✅
- **Problema:** Inconsistência entre servidor e cliente ao renderizar o estado de carregamento.
- **Solução:** Uso de `useEffect` para garantir que o estado só mude no cliente.
- **Arquivo:** `components/login-form.tsx`.

---

## Próximos Passos Recomendados
1. Implementar lógica real de videochamada via WebRTC.
2. Testar fluxo completo de assinatura com Asaas em sandbox.
3. Validar estabilidade do servidor Next.js 16 com Turbopack em produção.
