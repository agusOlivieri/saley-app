import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// Reemplazar con las variables de entorno reales en el entorno de build
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
