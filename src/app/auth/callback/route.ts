import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const defaultUrl = 'https://xidnjvhbiaistpmftwnk.supabase.co'
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http'))
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : defaultUrl
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const redirectUrl = `${origin}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          const cookieHeader = request.headers.get('cookie') || ''
          const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
          return match ? decodeURIComponent(match[1]) : undefined
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    })

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Garante que o perfil do usuário Google seja criado automaticamente na tabela profiles
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            nome_completo: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            cidade: user.user_metadata?.cidade || 'Não informada',
            uf: user.user_metadata?.uf || 'SP',
            camada: 'gratuita',
          },
          { onConflict: 'id' }
        )
      }

      return response
    }

    console.error('[OAuth Callback] Erro ao trocar código por sessão:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=Falha+na+autenticacao+Google`)
}

