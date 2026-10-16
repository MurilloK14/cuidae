import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const defaultUrl = 'https://xidnjvhbiaistpmftwnk.supabase.co'
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http'))
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : defaultUrl
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Allow Next internals, static files, and API routes to pass through immediately
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = [
    '/',
    '/login',
    '/cadastro',
    '/recuperar-senha',
    '/redefinir-senha',
    '/admin/login',
    '/como-funciona',
    '/hospital',
    '/hospital/painel',
    '/hospital/login',
    '/unidades',
    '/triagem',
    '/agendamento',
    '/planos',
  ]
  const isHospitalRoute = pathname === '/hospital' || pathname.startsWith('/hospital/')
  const isPublicRoute = isHospitalRoute || publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  const isAuthRoute = ['/login', '/cadastro'].includes(pathname)

  // Redirect unauthenticated users away from protected routes, preserving any session cookies
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.startsWith('/admin') ? '/admin/login' : '/login'
    const redirectRes = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie)
    })
    return redirectRes
  }

  // Redirect authenticated users away from auth pages, preserving session cookies
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectRes = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie)
    })
    return redirectRes
  }

  return supabaseResponse
}
