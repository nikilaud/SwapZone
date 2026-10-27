// 1. Supabase Dashboard-ში გახსენი Project Settings → API.
// 2. ჩასვი Project URL და Publishable key.
// Publishable key შეიძლება იყოს frontend-ში; service_role/secret key არასოდეს ჩასვა აქ.
export const SUPABASE_URL = "https://prizsyewdcqhnwufdhcl.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GuFwCvE42rJSfqGb3sI7kw_ncz8o7-7";

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  SUPABASE_PUBLISHABLE_KEY.length > 20 &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE_PUBLISHABLE_KEY");
