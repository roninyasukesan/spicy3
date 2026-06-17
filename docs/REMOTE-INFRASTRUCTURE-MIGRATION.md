# Migração da Infraestrutura Remota

## Resumo

A migração concluída no commit `0624fe4` tornou a infraestrutura remota
opcional e preservou o modo local existente. O sistema agora pode operar em
dois modos:

- **Local:** autenticação, perfis e mídias permanecem no navegador.
- **Remoto:** Supabase gerencia autenticação e dados estruturados; Google Drive
  armazena os arquivos de mídia; o Next.js controla autorização e streaming.

A ativação é explícita:

```env
NEXT_PUBLIC_REMOTE_DATA_ENABLED=true
NEXT_PUBLIC_REMOTE_MEDIA_ENABLED=true
```

As flags devem permanecer `false` quando o ambiente remoto não estiver
configurado.

## Componentes Implementados

### Autenticação e autorização

- Sessão SSR do Supabase sincronizada por cookies.
- `proxy.ts` usa `supabase.auth.getClaims()` para validar o JWT e atualizar os
  cookies da sessão.
- `GET /api/auth/me` fornece à interface o usuário autenticado, papel e plano.
- Layouts específicos protegem os dashboards de admin, modelo e cliente.
- No modo local, `DashboardLocalGuard` aplica as mesmas regras de papel.
- Login e logout atualizam a sessão Supabase e o cache local usado pela UI.

### Perfis e usuários

- Perfis remotos são identificados por UUID público, sem expor o e-mail na URL.
- Usuários locais e remotos são associados por e-mail normalizado.
- Contas remotas ausentes podem ser criadas durante a migração quando a conta
  local possui nome, e-mail e senha válida.
- O painel administrativo lista, cria e exclui usuários remotos.
- `PATCH /api/admin/users/[id]` atualiza o plano do cliente.
- O plano `vip` da interface é persistido como `gold` no banco.

### Mídias

- Fotos, stories de imagem, stories de vídeo e áudio usam o mesmo fluxo remoto.
- O arquivo é enviado ao Google Drive e seus metadados são salvos em
  `profile_media`.
- A aplicação entrega o conteúdo por `GET /api/media/[id]`, após validar acesso.
- Capa, desfoque, visibilidade, posição, exclusão e reordenação são persistidos.
- Arquivos protegidos não são publicados diretamente pelo Google Drive.

## Processo de Migração Local

O componente `LocalInfrastructureMigration`, disponível no painel
administrativo, executa o seguinte processo:

1. Lê apenas usuários e perfis realmente persistidos no LocalStorage.
2. Carrega os usuários existentes no Supabase.
3. Associa contas pelo e-mail em minúsculas e sem espaços laterais.
4. Cria contas ausentes que possuem credenciais locais válidas.
5. Preserva o perfil local original no IndexedDB.
6. Reutiliza arquivos remotos compatíveis em execuções interrompidas.
7. Envia as mídias locais restantes ao Google Drive.
8. Atualiza o perfil no Supabase.
9. Substitui no cache local os Data URLs por URLs `/api/media/<uuid>`.
10. Exibe um relatório parcial; a falha de um perfil não interrompe os demais.

O backup local usa:

```text
Database: spicy-local-migration-backups
Object store: profiles
Chave: e-mail normalizado
```

O backup é criado antes da substituição das mídias locais e não é apagado
automaticamente.

## Idempotência

Uma nova execução não deve duplicar arquivos. Para retomar uma migração, o
sistema procura uma mídia remota ainda não utilizada com:

- mesmo tipo de mídia;
- mesmo MIME type;
- mesmo tamanho em bytes.

As mídias já referenciadas por `/api/media/<uuid>` também são mantidas. Dados
remotos que não existem no perfil local são preservados quando a migração usa
`preserveExisting: true`.

## Resultado da Migração Executada

Em 14 de junho de 2026, os dados recuperáveis do navegador foram migrados:

| Perfil | Fotos | Stories de imagem | Vídeos locais | Total |
| --- | ---: | ---: | ---: | ---: |
| Laura | 8 | 5 | 0 | 13 |
| Nicole | 2 | 3 | 0 | 5 |
| **Total** | **10** | **8** | **0** | **18** |

Não havia vídeos locais armazenados nos perfis recuperados. O suporte para
vídeos foi implementado e permanece disponível para novos stories e futuras
migrações.

As execuções de confirmação não criaram novas mídias. A ordem das fotos, os
stories e quatro marcações de desfoque do perfil da Laura foram preservados.

## Contratos HTTP

| Método e rota | Responsabilidade |
| --- | --- |
| `GET /api/auth/me` | Retorna sessão, papel e plano atuais. |
| `GET /api/profiles` | Lista perfis conforme o modo remoto. |
| `GET /api/profiles/[id]` | Carrega um perfil por identificador público. |
| `GET /api/media` | Lista mídias visíveis de um perfil. |
| `POST /api/media` | Envia uma mídia para Drive e Supabase. |
| `GET /api/media/[id]` | Autoriza e transmite o arquivo. |
| `PATCH /api/media/[id]` | Atualiza metadados da mídia. |
| `DELETE /api/media/[id]` | Exclui arquivo e metadados. |
| `PATCH /api/media/reorder` | Persiste a ordem das mídias. |
| `GET /api/media/health` | Valida Supabase e Google Drive. |
| `PATCH /api/admin/users/[id]` | Atualiza o plano de um cliente. |

## Validação Realizada

- ESLint: aprovado.
- TypeScript com `--noEmit --incremental false`: aprovado.
- `git diff --check`: aprovado.
- Build de produção do Next.js 16.2.7: aprovado.
- Health check anônimo: `401`.
- Health check autenticado: `200` com `ready: true`.
- Supabase e Google Drive: configurados e acessíveis.
- Login, logout e proteção por papel: validados nos modos local e remoto.
- Criação, alteração de plano e exclusão de usuários remotos: validadas.
- Streaming das 18 mídias migradas: validado.
- Página pública: ordem, carregamento e desfoque validados.
- Reexecução da migração: validada sem duplicação.

## Pendências Conhecidas

- Criar uma interface para exportar ou restaurar o backup do IndexedDB.
- Implementar upload em partes ou fila em segundo plano para arquivos grandes.
- Adicionar rate limiting e trilha de auditoria às operações administrativas.
- Migrar o chat local para uma infraestrutura remota completa.
- Manter migrations futuras com `GRANT` explícito para tabelas expostas pela
  Data API, além das políticas RLS.

## Documentos Relacionados

- [Configuração do Supabase e Google Drive](SUPABASE-GOOGLE-DRIVE-SETUP.md)
- [Arquitetura do projeto](../ARCHITECTURE.md)
- [Banco de dados](../DATABASE_SCHEMA.md)
- [Registro de modificações](../DOCUMENTATION_MODIFICATIONS.md)
