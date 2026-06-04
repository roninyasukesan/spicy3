# AI Agents in Spicy Models

This project is optimized for AI agents. 

## Agent Tools
- **Next.js 16.2 AI Native Features**: Enabled.
- **Browser Log Forwarding**: Active. Errors in the browser are forwarded to the terminal.
- **Turbopack**: Stable default bundler.

## Architecture
- **Framework**: Next.js 16.2.7 (App Router)
- **UI**: React 19.2.6
- **Styling**: Tailwind CSS 4.3.0
- **Database**: Supabase / Local Storage (Auth/Chat)

## Guidelines for Agents
1. **Explicit Caching**: Use `"use cache"` directive for components or functions that should be cached.
2. **Dynamic by Default**: All routes are dynamic by default in Next.js 16.
3. **Local First**: Prioritize `lib/local-auth.ts` and `lib/local-chat.ts` for demo functionality.
