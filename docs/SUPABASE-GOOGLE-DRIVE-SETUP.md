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
2. Create a service account.
3. Create or select a Shared Drive.
4. Add the service account as a member with permission to manage content.
5. Create a root folder for application media.
6. Configure:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_ID=
```

`GOOGLE_DRIVE_ID` is optional when the root folder is not in a Shared Drive,
but Shared Drive is recommended because service accounts do not have personal
Drive storage quota.

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

Mutating requests require a valid Supabase session. The API accepts the SSR
cookie session and a Bearer access token during the migration period.

## 5. Current scope

Implemented:

- Supabase browser, server and admin clients.
- Session refresh through `proxy.ts`.
- Google Drive service account client.
- Media migration and RLS.
- Upload, listing, streaming, update, delete and reorder routes.
- Remote photo upload from the model dashboard.
- Remote photo loading in the public profile.
- Admin account creation and deletion through Supabase Admin Auth.
- Profile field persistence through authenticated server routes.
- Random public UUIDs that do not expose model email addresses.

Still pending:

- Remote stories, videos and audio in the dashboards.
- Remote delete, blur, cover and reorder controls in dashboard UI.
- Import of existing LocalAuth/Base64 data.
- End-to-end validation against configured Supabase and Drive projects.
