# Arquitetura de Banco de Dados (Recomendada)

Para a plataforma **Spicy**, a escolha ideal é um banco de dados **Relacional (SQL)**, especificamente **PostgreSQL**.

Atualmente, o projeto já está preparado para utilizar o **Supabase**, que oferece PostgreSQL como serviço, além de Autenticação e Storage (arquivos).

## Por que PostgreSQL/Supabase?

1.  **Dados Estruturados & Flexibilidade:** O PostgreSQL permite misturar colunas rígidas (email, senha) com dados flexíveis (JSONB para características físicas que podem mudar) e Arrays (para listas de fetiches/serviços), o que já estamos usando no código.
2.  **Geolocalização (PostGIS):** Essencial para a funcionalidade "Perto de mim" ou busca por raio de distância.
3.  **Segurança (RLS):** "Row Level Security" permite definir regras direto no banco (ex: "só o próprio usuário pode editar seu perfil").
4.  **Ecossistema Integrado:** O Supabase já entrega o Banco + Storage (para as fotos) + Auth em um único pacote.

## Esquema de Dados Proposto (ERD)

### 1. Tabela `profiles` (Já iniciada)
Armazena os dados públicos das modelos e clientes.
*   `id` (UUID, PK) - Link com `auth.users`
*   `type` (Enum) - 'model' | 'client' | 'admin'
*   `slug` (String, Unique) - Para URLs amigáveis (`/perfil/nome-tal`)
*   `display_name` (String)
*   `bio`, `city`, `neighborhood` (Strings)
*   `location` (Geography) - Latitude/Longitude para busca por mapa
*   `price_range` (String)
*   `services` (Array<String>) - Ex: ['Massagem', 'Jantar']
*   `fetishes` (Array<String>)
*   `stats` (JSONB) - Altura, cor dos olhos, etc.
*   `is_verified` (Boolean) - Se enviou documentos
*   `plan_tier` (Enum) - 'free' | 'gold' | 'diamond' (destaque)

### 2. Tabela `media_gallery` (Nova)
Gerencia as fotos e vídeos do perfil, separando conteúdo público de privado.
*   `id` (UUID)
*   `profile_id` (FK)
*   `url` (String) - Caminho no Storage
*   `type` (Enum) - 'image' | 'video'
*   `is_private` (Boolean) - Se é conteúdo pago/assinante
*   `blur_level` (Int) - Para prévias de conteúdo adulto

### 3. Tabela `reviews` (Nova)
Avaliações e depoimentos.
*   `id` (UUID)
*   `model_id` (FK)
*   `author_id` (FK)
*   `rating` (Int 1-5)
*   `comment` (Text)
*   `created_at` (Timestamp)

### 4. Tabela `conversations` & `messages` (Chat)
*   `conversations`: Link entre dois usuários (`participant_a`, `participant_b`).
*   `messages`: Conteúdo do chat, timestamps de leitura.

### 5. Tabela `verifications` (Admin)
Fila para aprovação de documentos.
*   `user_id` (FK)
*   `document_front_url` (String)
*   `document_back_url` (String)
*   `selfie_verification` (String)
*   `status` (Enum) - 'pending' | 'approved' | 'rejected'

---

## Próximos Passos para Implementação

1.  Criar o projeto no Supabase (painel online).
2.  Rodar as migrações SQL para criar essas tabelas.
3.  Atualizar o `lib/supabase.ts` com as chaves reais.
4.  Substituir as chamadas de `localStorage` em `local-auth.ts` por chamadas ao Supabase.
