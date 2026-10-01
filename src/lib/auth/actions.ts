'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Session } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  nome_completo: string | null
  telefone: string | null
  data_nascimento: string | null
  cidade: string | null
  uf: string | null
  camada: string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: any
}

export interface AuthActionResult {
  error: string | null
  success: boolean
}

export type AuthInput = FormData | Record<string, any>

/**
 * Utilitário auxiliar para extrair dados de FormData ou objeto simples.
 */
function extractValue(input: AuthInput, primaryKey: string, aliasKeys: string[] = []): string | undefined {
  if (typeof FormData !== 'undefined' && input instanceof FormData) {
    const val = input.get(primaryKey)
    if (val !== null && val !== undefined && typeof val === 'string') {
      return val
    }
    for (const alt of aliasKeys) {
      const altVal = input.get(alt)
      if (altVal !== null && altVal !== undefined && typeof altVal === 'string') {
        return altVal
      }
    }
    return undefined
  }

  if (input && typeof input === 'object') {
    const obj = input as Record<string, any>
    if (obj[primaryKey] !== undefined && obj[primaryKey] !== null) {
      return String(obj[primaryKey])
    }
    for (const alt of aliasKeys) {
      if (obj[alt] !== undefined && obj[alt] !== null) {
        return String(obj[alt])
      }
    }
  }

  return undefined
}

/**
 * 1. signUp
 * Cadastra um novo usuário no Supabase Auth e insere seus dados na tabela 'profiles'.
 * - Extrai: email, password, nome_completo, telefone, data_nascimento, cidade, uf
 * - Chama supabase.auth.signUp com email, password e options.data contendo os campos de perfil
 * - Após o cadastro, insere na tabela 'profiles': { id: user.id, nome_completo, telefone, data_nascimento, cidade, uf, camada: 'gratuita' }
 * - Retorna { error: string | null, success: boolean }
 * - Trata erros amigavelmente (ex.: e-mail duplicado)
 */
export async function signUp(formData: AuthInput): Promise<AuthActionResult> {
  const email = extractValue(formData, 'email')?.trim()
  const password = extractValue(formData, 'password', ['senha'])?.trim()
  const nome_completo = extractValue(formData, 'nome_completo', ['name', 'nome'])?.trim()
  const telefone = extractValue(formData, 'telefone', ['phone'])?.trim() || null
  const data_nascimento = extractValue(formData, 'data_nascimento', ['birth_date'])?.trim() || null
  const cidade = extractValue(formData, 'cidade', ['city'])?.trim() || null
  const uf = extractValue(formData, 'uf', ['state'])?.trim() || null

  if (!email || !password || !nome_completo) {
    return {
      error: 'Preencha todos os campos obrigatórios (nome completo, e-mail e senha).',
      success: false,
    }
  }

  if (password.length < 6) {
    return {
      error: 'A senha deve conter no mínimo 6 caracteres.',
      success: false,
    }
  }

  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo,
          telefone,
          data_nascimento,
          cidade,
          uf,
        },
      },
    })

    if (error) {
      const msg = error.message.toLowerCase()
      if (
        msg.includes('already registered') ||
        msg.includes('user already exists') ||
        msg.includes('user with this email already exists')
      ) {
        return { error: 'Este e-mail já está cadastrado.', success: false }
      }
      return { error: error.message || 'Erro ao realizar o cadastro.', success: false }
    }

    // Proteção contra enumeração de e-mail do Supabase
    if (data?.user?.identities && data.user.identities.length === 0) {
      return { error: 'Este e-mail já está cadastrado.', success: false }
    }

    if (data?.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        nome_completo,
        telefone,
        data_nascimento,
        cidade,
        uf,
        camada: 'gratuita',
      })

      if (profileError) {
        console.error('Erro ao inserir perfil do usuário na tabela profiles:', profileError)
      }
    }

    return { error: null, success: true }
  } catch (err: any) {
    return {
      error: err?.message || 'Erro inesperado ao realizar cadastro.',
      success: false,
    }
  }
}

/**
 * 2. signIn
 * Autentica o usuário com email e password.
 * - Extrai: email, password
 * - Chama supabase.auth.signInWithPassword
 * - Sucesso: redireciona para /dashboard
 * - Erro: retorna { error: 'Email ou senha incorretos.' }
 */
export async function signIn(formData: AuthInput): Promise<{ error: string } | void> {
  const email = extractValue(formData, 'email')?.trim()
  const password = extractValue(formData, 'password', ['senha'])

  if (!email || !password) {
    return { error: 'Email ou senha incorretos.' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Email ou senha incorretos.' }
  }

  redirect('/dashboard')
}

/**
 * 3. signOut
 * Encerra a sessão do usuário atual.
 * - Chama supabase.auth.signOut()
 * - Redireciona para /login
 */
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * 4. requestPasswordReset
 * Solicita a recuperação de senha via e-mail.
 * - Extrai: email
 * - Chama supabase.auth.resetPasswordForEmail com redirectTo apontando para a página /redefinir-senha
 * - Retorna { error: string | null, success: boolean }
 */
export async function requestPasswordReset(formData: AuthInput): Promise<AuthActionResult> {
  const email = extractValue(formData, 'email')?.trim()

  if (!email) {
    return { error: 'Por favor, informe seu e-mail.', success: false }
  }

  let origin = process.env.NEXT_PUBLIC_SITE_URL || ''
  if (!origin) {
    try {
      const headersList = headers()
      const host = headersList.get('host')
      const proto = headersList.get('x-forwarded-proto') || 'http'
      origin = headersList.get('origin') || (host ? `${proto}://${host}` : 'http://localhost:3000')
    } catch {
      origin = 'http://localhost:3000'
    }
  }

  const redirectTo = `${origin}/redefinir-senha`

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      return {
        error: error.message || 'Erro ao solicitar redefinição de senha.',
        success: false,
      }
    }

    return { error: null, success: true }
  } catch (err: any) {
    return {
      error: err?.message || 'Erro inesperado ao solicitar redefinição de senha.',
      success: false,
    }
  }
}

/**
 * 5. resetPassword
 * Atualiza a senha do usuário com a nova senha.
 * - Extrai: nova_senha
 * - Chama supabase.auth.updateUser({ password: nova_senha })
 * - Sucesso: redireciona para /login
 * - Erro: retorna { error: string }
 */
export async function resetPassword(formData: AuthInput): Promise<{ error: string } | void> {
  const nova_senha = extractValue(formData, 'nova_senha', ['senha', 'password', 'new_password'])?.trim()

  if (!nova_senha) {
    return { error: 'Por favor, informe a nova senha.' }
  }

  if (nova_senha.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({
    password: nova_senha,
  })

  if (error) {
    return { error: error.message || 'Erro ao redefinir a senha.' }
  }

  redirect('/login')
}

/**
 * 6. getSession
 * Obtém a sessão atual ativa.
 * - Chama supabase.auth.getSession()
 * - Retorna a session ou null
 */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    return session
  } catch (error) {
    console.error('Erro ao buscar sessão:', error)
    return null
  }
}

/**
 * 7. getUserProfile
 * Obtém os dados do perfil do usuário logado na tabela 'profiles'.
 * - Obtém usuário atual via supabase.auth.getUser()
 * - Consulta a tabela 'profiles' para o perfil do usuário
 * - Retorna os dados do perfil ou null
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    return profile as UserProfile
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error)
    return null
  }
}
