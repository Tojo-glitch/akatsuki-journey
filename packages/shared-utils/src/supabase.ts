import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  const meta = import.meta as unknown as { env?: Record<string, string> };
  return meta.env?.[key] || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const supabaseSync = {
  isConfigured: (): boolean => !!supabase,

  uploadChartImage: async (base64Data: string, filename: string): Promise<string> => {
    if (!supabase) return base64Data;
    try {
      const match = base64Data.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (!match) return base64Data;

      const mimeType = match[1];
      const byteCharacters = atob(match[2]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const filePath = `charts/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error } = await supabase.storage.from('nostoi-charts').upload(filePath, blob, {
        contentType: mimeType,
        upsert: true
      });

      if (error) throw error;
      const { data } = supabase.storage.from('nostoi-charts').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.warn('Supabase storage fallback to local:', err);
      return base64Data;
    }
  }
};
