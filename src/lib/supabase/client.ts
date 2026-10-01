import { createBrowserClient } from '@supabase/ssr'

const defaultUrl = 'https://xidnjvhbiaistpmftwnk.supabase.co'
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http'))
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : defaultUrl

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
