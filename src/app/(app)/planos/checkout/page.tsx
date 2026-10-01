'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Lock, Tag } from 'lucide-react'
import { processPayment } from '@/lib/planos/actions'
import { validateCPF } from '@/lib/constants'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plano = searchParams.get('plano') || searchParams.get('tipo') || 'premium'
  const preco = plano === 'premium' ? 'R$ 79,90/mês' : plano === 'intermediaria' ? 'Sob demanda' : 'R$ 39,90'
  const planoNome = plano === 'premium' ? 'Premium' : plano === 'intermediaria' ? 'Intermediário' : 'Consulta Avulsa'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const maskCard = (val: string) => val.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19)
  const maskDate = (val: string) => val.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/').slice(0, 5)
  const maskCpf = (val: string) => val.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')

  const [form, setForm] = useState({
    nome: '',
    numero: '',
    validade: '',
    cvv: '',
    cpf: '',
    cupom: ''
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    
    if (form.numero.replace(/\D/g, '').length !== 16) return setError('Número de cartão inválido')
    if (form.cvv.length < 3) return setError('CVV inválido')
    if (form.validade.length !== 5) return setError('Validade inválida')
    if (form.cpf.replace(/\D/g, '').length !== 11) return setError('CPF inválido')

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('plano', plano)
      const res = await processPayment(formData)
      if (res.success) {
        router.push(`/planos/sucesso?plano=${res.plano}`)
      } else {
        setError('Erro ao processar pagamento.')
      }
    } catch (err) {
      setError('Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#091426] mb-2">Finalizar Assinatura</h1>
        <p className="text-slate-600">Complete seus dados para assinar o plano {planoNome}</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mb-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#091426]">Plano Selecionado</h2>
            <p className="text-slate-500">{planoNome}</p>
          </div>
          <div className="text-2xl font-bold text-slate-900">{preco}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome no Cartão</label>
              <input type="text" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff]" placeholder="Como impresso no cartão" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número do Cartão</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" required value={form.numero} onChange={e => setForm({...form, numero: maskCard(e.target.value)})} className="w-full rounded-xl border border-slate-200 pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff]" placeholder="0000 0000 0000 0000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Validade</label>
                <input type="text" required value={form.validade} onChange={e => setForm({...form, validade: maskDate(e.target.value)})} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff]" placeholder="MM/AA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CVV</label>
                <input type="text" required maxLength={4} value={form.cvv} onChange={e => setForm({...form, cvv: e.target.value.replace(/\D/g, '')})} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff]" placeholder="123" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CPF do Titular</label>
              <input type="text" required value={form.cpf} onChange={e => setForm({...form, cpf: maskCpf(e.target.value)})} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff]" placeholder="000.000.000-00" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cupom de Desconto (Opcional)</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" value={form.cupom} onChange={e => setForm({...form, cupom: e.target.value})} className="w-full rounded-xl border border-slate-200 pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff]" placeholder="Ex: SAUDE10" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-[#091426] hover:bg-[#1a2c4e] text-white font-medium rounded-full flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
            {loading ? 'Processando...' : `Pagar ${preco}`}
          </button>

          <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1 mt-4">
            <Lock className="w-3 h-3" /> Pagamento seguro e criptografado
          </p>
        </form>
      </div>
    </div>
  )
}
