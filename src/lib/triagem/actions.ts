'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitTriagem(formData: FormData) {
  const supabase = createClient()
  
  // Extract user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Usuário não autenticado')
  }

  // Fetch user profile for regional snapshot
  const { data: profile } = await supabase
    .from('profiles')
    .select('cidade, uf')
    .eq('id', user.id)
    .single()

  // Extract fields
  const sintoma_principal = (formData.get('sintoma_principal') as string)?.trim()
  const duracao = formData.get('duracao') as string
  const intensidade = parseInt(formData.get('intensidade') as string, 10) || 5
  
  const tem_febre = formData.get('tem_febre') as string
  const tem_dor = formData.get('tem_dor') as string
  const local_dor = formData.get('local_dor') as string
  const toma_medicamento = formData.get('toma_medicamento') as string
  const qual_medicamento = formData.get('qual_medicamento') as string
  
  const tem_condicao_cronica = JSON.parse(formData.get('tem_condicao_cronica') as string || '[]')
  const esta_gravida = formData.get('esta_gravida') as string
  
  const foto = formData.get('foto') as File | null
  const descricao_foto = formData.get('descricao_foto') as string

  // Handle photo upload if present
  let foto_storage_path: string | null = null
  if (foto && foto.size > 0) {
    const fileExt = foto.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('triagem-fotos')
      .upload(fileName, foto)

    if (!uploadError && uploadData) {
      foto_storage_path = uploadData.path
    }
  }

  // Triage classification logic (mock for frontend/MVP; FastAPI/Infermedica handles this in backend)
  let nivel_urgencia: 'verde' | 'amarelo' | 'vermelho' = 'verde'
  let recomendacao: 'ubs' | 'upa' | 'teleconsulta' | 'esperar' = 'teleconsulta'

  if (intensidade >= 8 || (tem_febre === 'Sim' && ['4-7 dias', 'Mais de 1 semana', 'Mais de 1 mês'].includes(duracao))) {
    nivel_urgencia = 'vermelho'
    recomendacao = 'upa'
  } else if (intensidade >= 5 || tem_febre === 'Sim') {
    nivel_urgencia = 'amarelo'
    recomendacao = 'ubs'
  } else if (intensidade < 3) {
    nivel_urgencia = 'verde'
    recomendacao = 'esperar'
  }

  const explicacaoMap: Record<string, string> = {
    upa: 'Seus sintomas indicam uma condição que precisa de atenção urgente. Procure uma UPA ou pronto-socorro imediatamente.',
    ubs: 'Seus sintomas merecem avaliação médica. Agende uma consulta na UBS mais próxima nos próximos dias.',
    teleconsulta: 'Seus sintomas podem ser avaliados remotamente. Recomendamos agendar uma teleconsulta médica.',
    esperar: 'Seus sintomas parecem leves. Monitore sua condição e procure atendimento caso note agravamento.',
  }

  // Histórico estruturado de respostas (JSONB)
  const respostas = [
    { pergunta: 'sintoma_principal', resposta: sintoma_principal },
    { pergunta: 'duracao', resposta: duracao },
    { pergunta: 'intensidade', resposta: intensidade },
    { pergunta: 'tem_febre', resposta: tem_febre },
    { pergunta: 'tem_dor', resposta: tem_dor },
    { pergunta: 'local_dor', resposta: local_dor || null },
    { pergunta: 'toma_medicamento', resposta: toma_medicamento },
    { pergunta: 'qual_medicamento', resposta: qual_medicamento || null },
    { pergunta: 'tem_condicao_cronica', resposta: tem_condicao_cronica },
    { pergunta: 'esta_gravida', resposta: esta_gravida },
    { pergunta: 'descricao_foto', resposta: descricao_foto || null },
  ].filter(r => r.resposta !== null && r.resposta !== undefined && r.resposta !== '')

  // Insert triagem (tabela unificada v2 otimizada para FastAPI/Infermedica)
  const { data: triagem, error: triagemError } = await supabase
    .from('triagens')
    .insert({
      user_id: user.id,
      sintoma_principal,
      duracao,
      intensidade,
      respostas,
      nivel_urgencia,
      recomendacao,
      explicacao: explicacaoMap[recomendacao],
      foto_storage_path,
      cidade_snapshot: profile?.cidade || 'Não informada',
      uf_snapshot: profile?.uf || 'BR',
    })
    .select('id')
    .single()

  if (triagemError || !triagem) {
    console.error('Erro ao salvar triagem:', triagemError)
    throw new Error('Erro ao criar triagem')
  }

  // Create follow-up reminder (7 days from now)
  const lembreteDate = new Date()
  lembreteDate.setDate(lembreteDate.getDate() + 7)
  
  await supabase.from('lembretes').insert({
    user_id: user.id,
    tipo: 'consulta',
    descricao: `Acompanhamento de sintomas: ${sintoma_principal.substring(0, 75)}...`,
    data_agendada: lembreteDate.toISOString().split('T')[0],
    status: 'pendente',
  })

  return triagem.id
}

export async function getTriagemResultado(triagemId: string) {
  const supabase = createClient()
  
  const { data: triagem, error: triagemError } = await supabase
    .from('triagens')
    .select('*')
    .eq('id', triagemId)
    .single()

  if (triagemError) {
    console.error('Erro ao buscar resultado da triagem:', triagemError)
    return null
  }

  return triagem
}
