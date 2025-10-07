import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Les variables d\'environnement Supabase sont manquantes. Vérifiez votre fichier .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Dossier {
  id: string;
  numero_dossier: string;
  valeur_tampon: string;
  created_at: string;
  updated_at: string;
}
