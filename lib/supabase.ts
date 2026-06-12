import { createBrowserClient } from "@supabase/ssr"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""

export function hasSupabaseConfig() {
  return Boolean(url && key);
}

function makeMock(): any {
  return {
    auth: {
      async getSession() {
        return { data: { session: null } };
      },
      async signInWithPassword() {
        return { data: { user: null, session: null }, error: { message: 'Supabase não configurado' } };
      },
      async signUp() {
        return { data: { user: null, session: null }, error: { message: 'Supabase não configurado' } };
      },
    },
    from() {
      const chain = {
        select() {
          return { data: null, error: { message: 'Supabase não configurado' } };
        },
        eq() {
          return chain;
        },
        single() {
          return { data: null, error: { message: 'Supabase não configurado' } };
        },
        maybeSingle() {
          return { data: null, error: { message: 'Supabase não configurado' } };
        },
        upsert() {
          return { data: null, error: { message: 'Supabase não configurado' } };
        },
        order() {
          return chain;
        },
        limit() {
          return chain;
        },
      };
      return chain;
    },
    channel() {
      const c = {
        on() {
          return c;
        },
        subscribe() {
          return c;
        },
      };
      return c;
    },
    removeChannel() {},
  };
}

let client: any = null

function getClient() {
  if (!client) {
    client = hasSupabaseConfig() ? createBrowserClient(url, key) : makeMock()
  }
  return client
}

export const supabase: any = new Proxy(
  {},
  {
    get(_target, property) {
      const value = getClient()[property]
      return typeof value === "function" ? value.bind(getClient()) : value
    },
  }
)
