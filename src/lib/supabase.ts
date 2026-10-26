import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Supabase URL temizleme
export function getSanitizedSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://chdjviwfsoexqhregbdr.supabase.co";
  return rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

// İstemci tarafı Supabase Client (Anon anahtarı ile)
export function getSupabaseClient(): SupabaseClient | null {
  const url = getSanitizedSupabaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || anonKey === "your-anon-key-here") {
    return null;
  }

  try {
    return createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (error) {
    console.error("Supabase client init error:", error);
    return null;
  }
}

// Sunucu tarafı Supabase Admin Client (Service Role Key - Asla istemciye gönderilmez!)
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = getSanitizedSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || serviceKey === "your-service-role-key-here") {
    return null;
  }

  try {
    return createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    console.error("Supabase admin client init error:", error);
    return null;
  }
}
