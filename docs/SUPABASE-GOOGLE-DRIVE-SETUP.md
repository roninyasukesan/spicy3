# Supabase + Google Drive Media Setup

This document configures the first remote media flow:

`model dashboard -> Next.js API -> Google Drive -> Supabase metadata -> public profile`

## 1. Supabase

Configure the public keys and the server-only service role key:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
# Legacy fallbacks:
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_REMOTE_DATA_ENABLED=false
```

Apply the migration:

```text
supabase/migrations/20260612212133_profiles_backend.sql
supabase/migrations/20260610_profile_media.sql
```

The migration creates `profile_media`, indexes, cover constraints and RLS
policies. Ownership checks support both profile layouts currently present in
the repository: `profiles.id = auth.users.id` and
`profiles.user_id = auth.users.id`.

Never expose `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` through a
`NEXT_PUBLIC_*` variable.

## 2. Google Drive

1. Enable Google Drive API in Google Cloud.
2. Choose service account or OAuth authentication.
3. Create a root folder for application media.
4. Configure one of the authentication modes below.

### Option A: service account

Recommended with a Shared Drive:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_ID=
```

`GOOGLE_DRIVE_ID` is optional when the root folder is not in a Shared Drive,
but Shared Drive is recommended because service accounts do not have personal
Drive storage quota.

Add the service account as a member of the Shared Drive with permission to
manage content.

### Option B: OAuth user account

Use this mode to store files in the Drive account that authorized the refresh
token:

```env
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_ID=
```

The OAuth consent must include the
`https://www.googleapis.com/auth/drive` scope and offline access. When both
authentication modes are complete, the application gives precedence to the
service account.

For a long-lived server integration, move the OAuth app from testing to
production before issuing the final refresh token. Testing-mode refresh tokens
for this scope can expire after seven days.

The Google Drive connector used by development agents is a separate
integration. It can inspect files during development, but it does not expose
OAuth credentials to the deployed Next.js application.

The application creates one child folder per profile and never makes protected
files publicly shareable.

## 3. Enable the first flow

Keep remote media disabled until the migration and credentials are available:

```env
NEXT_PUBLIC_REMOTE_MEDIA_ENABLED=false
```

After configuration, change it to:

```env
NEXT_PUBLIC_REMOTE_DATA_ENABLED=true
NEXT_PUBLIC_REMOTE_MEDIA_ENABLED=true
```

Before enabling uploads, open:

```text
GET /api/media/health
```

The endpoint returns only safe readiness flags. A `200` response with
`ready: true` confirms access to `profile_media` and write access to the
configured Drive folder. A `503` response identifies which integration still
needs configuration without exposing credentials. The request requires a
valid Supabase session.

`NEXT_PUBLIC_REMOTE_DATA_ENABLED` publishes accounts and profile fields in
Supabase. `NEXT_PUBLIC_REMOTE_MEDIA_ENABLED` sends photos to `/api/media`,
stores the files in Drive and creates the matching `profile_media` rows.
When either flow is disabled, the interface explicitly reports local-only
storage instead of claiming that the data is visible to every user.

## 4. API routes

- `GET /api/media?profileId=<uuid>` lists media visible to the requester.
- `POST /api/media` uploads a file.
- `GET /api/media/<id>` streams a file after access validation.
- `PATCH /api/media/<id>` updates visibility, cover, blur or position.
- `DELETE /api/media/<id>` deletes the Drive file and database row.
- `PATCH /api/media/reorder` persists ordering.
- `GET /api/media/health` validates Supabase and Google Drive readiness.

Mutating requests require a valid Supabase session. The API accepts the SSR
cookie session and a Bearer access token during the migration period.

## 5. Current scope

Implemented:

- Supabase browser, server and admin clients.
- Session refresh through `proxy.ts`.
- Google Drive client with service account and OAuth refresh-token support.
- Media migration and RLS.
- Upload, listing, streaming, update, delete and reorder routes.
- Remote photo upload from the model dashboard.
- Remote photo loading in the public profile.
- Admin account creation and deletion through Supabase Admin Auth.
- Profile field persistence through authenticated server routes.
- Random public UUIDs that do not expose model email addresses.
- End-to-end OAuth Drive validation: health check, upload, metadata row,
  authenticated stream and deletion.

Still pending:

- Remote stories, videos and audio in the dashboards.
- Remote delete, blur, cover and reorder controls in dashboard UI.
- Import of existing LocalAuth/Base64 data.
