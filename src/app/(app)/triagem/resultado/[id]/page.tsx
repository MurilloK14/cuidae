import { getTriagemResultado } from '@/lib/triagem/actions'
import { ShieldCheck, AlertTriangle, AlertOctagon, MapPin, Phone, ExternalLink, Download, ArrowRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function TriagemResultadoPage({ params }: { params: { id: string } }) {
  const triagem = await getTriagemResultado(params.id)

  if (!triagem) {
    notFound()
  }

  const urgencia = triagem.nivel_urgencia || 'verde'
  const recomendacao = triagem.recomendacao || 'esperar'
  const explicacao = triagem.explicacao || 'Consulte um profissional de saúde para mais orientações.'

  const isVerde = urgencia === 'verde'
  const isAmarelo = urgencia === 'amarelo'
  const isVermelho = urgencia === 'vermelho'

  const bgColor = isVerde ? 'bg-emerald-50' : isAmarelo ? 'bg-amber-50' : 'bg-red-50'
  const borderColor = isVerde ? 'border-emerald-200' : isAmarelo ? 'border-amber-200' : 'border-red-200'
  const textColor = isVerde ? 'text-emerald-800' : isAmarelo ? 'text-amber-800' : 'text-red-800'
  const iconColor = isVerde ? 'text-emerald-500' : isAmarelo ? 'text-amber-500' : 'text-red-500'

  const showUnidades = recomendacao === 'ubs' || recomendacao === 'upa'
  const showTeleconsulta = recomendacao === 'teleconsulta'

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
      </div>

      {/* Urgency Banner */}
      <div className={`rounded-2xl border ${borderColor} ${bgColor} p-6 mb-8`}>
        <div className="flex items-start gap-4">
          <div className="mt-1 shrink-0">
            {isVerde && <ShieldCheck className={`w-8 h-8 ${iconColor}`} />}
            {isAmarelo && <AlertTriangle className={`w-8 h-8 ${iconColor}`} />}
            {isVermelho && <AlertOctagon className={`w-8 h-8 ${iconColor}`} />}
          </div>
          <div>
            <h1 className={`text-2xl font-bold mb-2 ${textColor}`}>
              {isVerde && 'Urgência Baixa'}
              {isAmarelo && 'Urgência Moderada'}
              {isVermelho && 'Urgência Alta — Procure Atendimento Imediato'}
            </h1>
            <p className="text-slate-700 text-lg leading-relaxed">
              {explicacao}
            </p>
          </div>
        </div>
      </div>

      {/* Symptom Context */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8">
        <p className="text-sm text-slate-400 mb-1">Sintoma relatado</p>
        <p className="text-slate-900 font-medium">{triagem.sintoma_principal}</p>
        <p className="text-xs text-slate-400 mt-2">
          {new Date(triagem.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Nearby Health Units */}
      {showUnidades && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#091426] mb-4">📍 Unidades Mais Próximas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { nome: 'UPA 24h Centro', distancia: '1,2 km', tel: '(11) 3456-7890', lat: -23.55, lng: -46.63 },
              { nome: 'UBS Jardim Saúde', distancia: '2,8 km', tel: '(11) 3456-7891', lat: -23.56, lng: -46.64 },
              { nome: 'UBS Vila Nova', distancia: '3,5 km', tel: '(11) 3456-7892', lat: -23.57, lng: -46.65 },
            ].map((unidade, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-2">{unidade.nome}</h3>
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>A {unidade.distancia} de você</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{unidade.tel}</span>
                  </div>
                </div>
                <a
                  href={`https://maps.google.com/?q=${unidade.lat},${unidade.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2b85ff] text-sm font-medium hover:underline flex items-center gap-1"
                >
                  Abrir no mapa <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teleconsulta CTA */}
      {showTeleconsulta && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-[#091426] mb-1">🩻 Agendar Teleconsulta</h2>
            <p className="text-slate-600">Fale com um médico sem sair de casa.</p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
            <span className="text-2xl font-bold text-[#091426]">R$ 39,90</span>
            <Link
              href="/planos/checkout?plano=intermediaria&tipo=avulsa"
              className="px-6 py-3 bg-[#091426] hover:bg-[#1a2c4e] text-white font-medium rounded-full text-center transition-colors flex items-center gap-2"
            >
              Agendar agora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-8">
        <button
          disabled
          className="group relative px-6 py-3 border border-slate-200 text-slate-400 font-medium rounded-full flex items-center gap-2 cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Salvar PDF
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Em breve
          </span>
        </button>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-full transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/triagem"
            className="px-6 py-3 bg-[#eef5ff] hover:bg-blue-100 text-[#2b85ff] font-medium rounded-full flex items-center gap-2 transition-colors"
          >
            Nova Triagem <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
