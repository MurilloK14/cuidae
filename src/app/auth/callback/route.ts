import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

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
    const cookieStore = cookies()
    const redirectUrl = `${origin}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
          response.cookies.set({
            name,
            value,
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options })
          response.cookies.set({
            name,
            value: '',
            ...options,
            path: '/',
            maxAge: 0,
          })
        },
      },
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session) {
      // Garante que o perfil do usuário Google seja criado automaticamente na tabela profiles
      const user = data.session.user
      if (user) {
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            nome_completo: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            cidade: user.user_metadata?.cidade || 'Não informada',
            uf: user.user_metadata?.uf || 'PE',
            camada: 'gratuita',
          },
          { onConflict: 'id' }
        )
      }

      // Copia todos os cookies existentes na store para a resposta de redirect
      cookieStore.getAll().forEach((c) => {
        response.cookies.set(c.name, c.value, {
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      })

      return response
    }

    console.error('[OAuth Callback] Erro ao trocar código por sessão:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=Falha+na+autenticacao+Google`)
}
