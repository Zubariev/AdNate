    // environment.d.ts
    declare namespace NodeJS {
        interface ProcessEnv {
          readonly VITE_SUPABASE_URL: string;
          readonly VITE_SUPABASE_ANON_KEY: string;
          readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
          readonly DATABASE_URL: string;
        }
      }