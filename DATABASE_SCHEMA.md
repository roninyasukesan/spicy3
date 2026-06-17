# Arquitetura de Banco de Dados

Este documento descreve o estado atual da persistência remota do Spicy.
O PostgreSQL do Supabase armazena identidades, perfis e metadados. Os arquivos
binários de mídia são armazenados no Google Drive.

## Separação de responsabilidades

| Componente | Responsabilidade |
| --- | --- |
| Supabase Auth | Identidade, senha, sessão e metadados de autorização. |
| `profiles` | Papel, plano e dados públicos/estruturados do perfil. |
| `profile_media` | Metadados e regras de acesso das mídias. |
| Google Drive | Conteúdo binário de fotos, vídeos e áudio. |
| Next.js API | Autorização, upload, streaming e operações administrativas. |
| LocalStorage | Modo demo e cache compatível durante a transição. |
| IndexedDB | Backup dos perfis locais antes da migração. |

O navegador não recebe `SUPABASE_SECRET_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, credenciais OAuth do Google nem chave privada de
service account.

## Tabela `profiles`

O schema é consolidado por
`supabase/migrations/20260612212133_profiles_backend.sql` e migrações
posteriores.

Campos principais:

| Campo | Uso |
| --- | --- |
| `id` | UUID principal, normalmente igual ao usuário do Supabase Auth. |
| `user_id` | Compatibilidade com schemas que separam perfil e usuário. |
| `public_id` | UUID público usado nas URLs; não expõe o e-mail. |
| `email` | Associação administrativa e migração por e-mail normalizado. |
| `role` | `admin`, `model` ou `client`. |
| `plan_tier` | `free`, `gold` ou `diamond`; a UI apresenta `gold` como `vip`. |
| `display_name`, `phone`, `city`, `age`, `bio` | Dados básicos do perfil. |
| `services`, `fetishes`, `exclusions` | Listas de atributos e serviços. |
| `characteristics` | Características flexíveis em JSONB. |
| `gallery_items`, `stories`, `voice_url` | Representação compatível com a UI. |
| `is_verified` | Estado de verificação administrativa. |
| `created_at`, `updated_at` | Auditoria temporal básica. |

Índices relevantes:

- `profiles_public_id_idx`: identificador público único.
- `profiles_email_idx`: e-mail único, sem diferenciar maiúsculas de minúsculas.
- `profiles_user_id_idx`: busca do perfil pelo usuário autenticado.

## Tabela `profile_media`

Criada por `supabase/migrations/20260610_profile_media.sql`.

| Campo | Uso |
| --- | --- |
| `id` | UUID público usado em `/api/media/<id>`. |
| `profile_id` | Perfil proprietário. |
| `drive_file_id` | Identificador único do arquivo no Google Drive. |
| `file_name`, `mime_type`, `size_bytes` | Metadados do arquivo. |
| `media_type` | `photo`, `story`, `video`, `audio` ou `document`. |
| `position` | Ordem dentro da galeria ou stories. |
| `visibility` | `public`, `subscriber` ou `private`. |
| `is_cover` | Define a foto de capa. |
| `is_blurred` | Solicita desfoque na interface. |
| `status` | `processing`, `ready` ou `failed`. |
| `expires_at` | Expiração opcional, usada por conteúdo temporário. |
| `created_at`, `updated_at` | Datas de criação e alteração. |

Restrições e índices:

- Um único `drive_file_id` por registro.
- Uma única capa por perfil.
- Índice por perfil, tipo e posição.
- Índice por visibilidade e status.
- Tamanho e posição não podem ser negativos.

## Segurança e RLS

As tabelas expostas pela Data API possuem RLS habilitado.

### `profiles`

- Leitura pública dos campos do perfil.
- Escrita do proprietário validada por `auth.uid()`.
- Campos sensíveis como papel, plano e verificação são administrados pelo
  servidor.

### `profile_media`

- Leitura anônima somente quando a mídia está pública, pronta e não expirada.
- Proprietário e administrador podem ler mídias não públicas.
- Inserção, atualização e exclusão exigem propriedade ou papel administrativo.
- As funções `is_admin()` e `owns_profile(uuid)` não são executáveis por
  usuários anônimos.

RLS e privilégios SQL são camadas diferentes. As migrations concedem
explicitamente os `GRANT` necessários para `anon` e `authenticated`, além de
definir as políticas de linha.

## Migrações relacionadas

```text
supabase/migrations/20260610_profile_media.sql
supabase/migrations/20260612212133_profiles_backend.sql
supabase/migrations/20260613053834_fix_profiles_rls_recursion.sql
supabase/migrations/20260613060816_auth_profile_sync.sql
```

## Fluxo de mídia

```text
Browser
  -> Next.js /api/media
  -> validação da sessão e do perfil
  -> Google Drive (arquivo)
  -> Supabase profile_media (metadados)
  -> /api/media/<uuid> (streaming autorizado)
```

Arquivos protegidos não recebem link público no Google Drive.

## Próximos passos

1. Criar uma trilha `admin_audit_log` para operações administrativas.
2. Adicionar rate limiting a uploads, exclusões e criação de usuários.
3. Definir retenção e recuperação do backup de migração.
4. Implementar upload em partes para arquivos grandes.
5. Migrar chat e favoritos locais para persistência remota completa.

Consulte
[`docs/REMOTE-INFRASTRUCTURE-MIGRATION.md`](docs/REMOTE-INFRASTRUCTURE-MIGRATION.md)
para o processo de importação dos dados locais.
