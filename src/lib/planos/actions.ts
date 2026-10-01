'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserCamada(): Promise<string> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return 'gratuita'

    const { data } = await supabase
      .from('profiles')
      .select('camada')
      .eq('id', user.id)
      .single()

    return data?.camada || 'gratuita'
  } catch (error) {
    console.error('Erro ao buscar camada:', error)
    return 'gratuita'
  }
}

export async function processPayment(formData: FormData) {
  try {
    const plano = formData.get('plano') as string
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Update profile camada
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        camada: plano,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) throw profileError

    // Insert assinatura record
    const preco_centavos = plano === 'premium' ? 7990 : 3990

    await supabase.from('assinaturas').insert({
      user_id: user.id,
      status: 'ativa',
      valor_mensalidade_centavos: preco_centavos,
    })

    return { success: true, plano }
  } catch (error) {
    console.error('Erro no pagamento:', error)
    return { success: false, error: 'Erro ao processar pagamento' }
  }
}
