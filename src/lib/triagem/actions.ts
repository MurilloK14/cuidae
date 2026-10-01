'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function submitTriagem(formData: FormData) {
  const supabase = createClient()
  
  // Extract user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Usuário não autenticado')
  }

  // Extract fields
  const sintoma_principal = formData.get('sintoma_principal') as string
  const duracao = formData.get('duracao') as string
  const intensidade = parseInt(formData.get('intensidade') as string, 10)
  
  const tem_febre = formData.get('tem_febre') as string
  const tem_dor = formData.get('tem_dor') as string
  const local_dor = formData.get('local_dor') as string
  const toma_medicamento = formData.get('toma_medicamento') as string
  const qual_medicamento = formData.get('qual_medicamento') as string
  
  const tem_condicao_cronica = JSON.parse(formData.get('tem_condicao_cronica') as string || '[]')
  const esta_gravida = formData.get('esta_gravida') as string
  
  const foto = formData.get('foto') as File | null
  const descricao_foto = formData.get('descricao_foto') as string

  // Insert triagem
  const { data: triagem, error: triagemError } = await supabase
    .from('triagens')
    .insert({
      user_id: user.id,
      sintoma_principal,
      duracao,
      intensidade,
    })
    .select()
    .single()

  if (triagemError || !triagem) {
    throw new Error('Erro ao criar triagem')
  }

  const triagemId = triagem.id

  // Prepare and insert respostas
  const respostas = [
    { triagem_id: triagemId, pergunta: 'sintoma_principal', resposta: sintoma_principal },
    { triagem_id: triagemId, pergunta: 'duracao', resposta: duracao },
    { triagem_id: triagemId, pergunta: 'intensidade', resposta: intensidade.toString() },
    { triagem_id: triagemId, pergunta: 'tem_febre', resposta: tem_febre },
    { triagem_id: triagemId, pergunta: 'tem_dor', resposta: tem_dor },
    { triagem_id: triagemId, pergunta: 'local_dor', resposta: local_dor || null },
    { triagem_id: triagemId, pergunta: 'toma_medicamento', resposta: toma_medicamento },
    { triagem_id: triagemId, pergunta: 'qual_medicamento', resposta: qual_medicamento || null },
    { triagem_id: triagemId, pergunta: 'tem_condicao_cronica', resposta: tem_condicao_cronica.join(', ') },
    { triagem_id: triagemId, pergunta: 'esta_gravida', resposta: esta_gravida },
  ].filter(r => r.resposta !== null && r.resposta !== undefined && r.resposta !== '')

  const { error: respostasError } = await supabase
    .from('triagem_respostas')
    .insert(respostas)

  if (respostasError) {
    console.error('Erro ao inserir respostas:', respostasError)
  }

  // Handle photo upload
  if (foto && foto.size > 0) {
    const fileExt = foto.name.split('.').pop()
    const fileName = `${triagemId}-${Math.random()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('triagem-fotos')
      .upload(fileName, foto)

    if (!uploadError && uploadData) {
      await supabase.from('triagem_fotos').insert({
        triagem_id: triagemId,
        storage_path: uploadData.path,
        descricao: descricao_foto || null,
      })
    }
  }

  // Mock classification
  let cor = 'verde'
  let recomendacao = 'teleconsulta'

  if (intensidade >= 8 || (tem_febre === 'Sim' && ['4-7 dias', 'Mais de 1 semana', 'Mais de 1 mês'].includes(duracao))) {
    cor = 'vermelho'
    recomendacao = 'upa'
  } else if (intensidade >= 5 || tem_febre === 'Sim') {
    cor = 'amarelo'
    recomendacao = 'ubs'
  } else if (intensidade < 3) {
    cor = 'verde'
    recomendacao = 'esperar'
  }

  // Build explanation text based on classification
  const explicacaoMap: Record<string, string> = {
    upa: 'Seus sintomas indicam uma condição que precisa de atenção urgente. Procure uma UPA ou pronto-socorro imediatamente.',
    ubs: 'Seus sintomas merecem avaliação médica. Agende uma consulta na UBS mais próxima nos próximos dias.',
    teleconsulta: 'Seus sintomas podem ser avaliados remotamente. Considere agendar uma teleconsulta.',
    esperar: 'Seus sintomas parecem leves. Monitore sua condição e procure atendimento se piorar.',
  }

  // Insert resultado
  await supabase.from('triagem_resultados').insert({
    triagem_id: triagemId,
    nivel_urgencia: cor,
    recomendacao,
    explicacao: explicacaoMap[recomendacao] || explicacaoMap.esperar,
  })

  // Create reminder (7 days from now)
  const lembreteDate = new Date()
  lembreteDate.setDate(lembreteDate.getDate() + 7)
  
  await supabase.from('lembretes').insert({
    user_id: user.id,
    tipo: 'consulta',
    descricao: `Acompanhamento: ${sintoma_principal.substring(0, 80)}`,
    data_lembrete: lembreteDate.toISOString().split('T')[0],
    concluido: false,
  })

  return triagemId
}

export async function getTriagemResultado(triagemId: string) {
  const supabase = createClient()
  
  const { data: triagem, error: triagemError } = await supabase
    .from('triagens')
    .select(`
      *,
      triagem_resultados (*),
      triagem_respostas (*)
    `)
    .eq('id', triagemId)
    .single()

  if (triagemError) {
    console.error('Erro ao buscar resultado:', triagemError)
    return null
  }

  return triagem
}
