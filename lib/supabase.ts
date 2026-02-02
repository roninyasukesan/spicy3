import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

export const supabase: any = url && key ? createClient(url, key) : makeMock();
