import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    // Garante redirecionamento consistente em localhost e em produção com proxy (ex: Vercel)
    const targetOrigin = isLocalEnv
      ? origin
      : (forwardedHost ? `https://${forwardedHost}` : origin)

    const targetPath = next.startsWith('/') ? next : `/${next}`
    const redirectUrl = `${targetOrigin}${targetPath}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session) {
      // Garante que o perfil do usuário Google seja criado automaticamente na tabela profiles
      const user = data.session.user
      if (user) {
        try {
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
        } catch (profileErr) {
          console.warn('[OAuth Callback] Aviso ao criar perfil inicial:', profileErr)
        }
      }

      return response
    }

    console.error('[OAuth Callback] Erro ao trocar código por sessão:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=Falha+na+autenticacao+Google`)
}
