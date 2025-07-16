import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Allow Next.js build to succeed locally / in preview when env vars are absent.
// We create a "stub" client with placeholder credentials that will never be used
// in production (because proper env vars are set) but prevents the build-time
// error "supabaseUrl is required" thrown by `createClient`.

const FALLBACK_URL = "https://stub.supabase.co"; // must include *.supabase.co
const FALLBACK_KEY = "stub-anon-key";

const url = SUPABASE_URL && SUPABASE_URL.length > 0 ? SUPABASE_URL : FALLBACK_URL;
const key = SUPABASE_PUBLISHABLE_KEY && SUPABASE_PUBLISHABLE_KEY.length > 0 ? SUPABASE_PUBLISHABLE_KEY : FALLBACK_KEY;

if (url === FALLBACK_URL) {
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL not set – using fallback stub during build");
}

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase/client";

export const supabase = createClient<Database>(url, key); 