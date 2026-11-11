import { createClient } from '@supabase/supabase-js'

// Remplace ces valeurs par tes propres clés récupérées dans ton tableau de bord Supabase 
// (Section Project Settings > API)
const SUPABASE_URL = 'https://rbtjhiiuopbjueoxiuql.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_GbjjbQJNkPbu76H4jptExQ_SM9cb3Mm'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
