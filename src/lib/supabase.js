import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  // Warn instead of throw so the app gracefully falls back to static data
  // in development without crashing the whole module graph.
  console.warn(
    '[VerdeBliss] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'All DB calls will fail and product data will use the static fallback in constants/products.js.'
  )
}

export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseKey  ?? 'placeholder-anon-key'
)
