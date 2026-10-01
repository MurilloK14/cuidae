'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitTriagem } from '@/lib/triagem/actions'
import { 
  Thermometer, 
  Pill, 
  Heart, 
  Camera, 
  Upload, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  X
} from 'lucide-react'
import Image from 'next/image'

export default function TriagemPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // State
  const [sintomaPrincipal, setSintomaPrincipal] = useState('')
  const [duracao, setDuracao] = useState('')
  const [intensidade, setIntensidade] = useState(5)
  
  const [temFebre, setTemFebre] = useState('')
  const [temDor, setTemDor] = useState('')
  const [localDor, setLocalDor] = useState('')
  const [tomaMedicamento, setTomaMedicamento] = useState('')
  const [qualMedicamento, setQualMedicamento] = useState('')
  const [condicoesCronicas, setCondicoesCronicas] = useState<string[]>([])
  const [estaGravida, setEstaGravida] = useState('')

  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [descricaoFoto, setDescricaoFoto] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A foto deve ter no máximo 5MB')
        return
      }
      setFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFoto = () => {
    setFoto(null)
    setFotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleCondicao = (condicao: string) => {
    if (condicao === 'Nenhuma') {
      setCondicoesCronicas(['Nenhuma'])
      return
    }
    
    setCondicoesCronicas(prev => {
      const semNenhuma = prev.filter(c => c !== 'Nenhuma')
      if (semNenhuma.includes(condicao)) {
        return semNenhuma.filter(c => c !== condicao)
      }
      return [...semNenhuma, condicao]
    })
  }

  const nextStep = () => {
    if (step === 1 && (sintomaPrincipal.length < 10 || !duracao)) {
      alert('Por favor, preencha o sintoma (mín. 10 caracteres) e a duração.')
      return
    }
    if (step === 2 && (!temFebre || !temDor || !tomaMedicamento || condicoesCronicas.length === 0 || !estaGravida)) {
      alert('Por favor, responda todas as perguntas.')
      return
    }
    setStep(prev => Math.min(prev + 1, 4))
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
    window.scrollTo(0, 0)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMsg('')
    
    try {
      const formData = new FormData()
      formData.append('sintoma_principal', sintomaPrincipal)
      formData.append('duracao', duracao)
      formData.append('intensidade', intensidade.toString())
      formData.append('tem_febre', temFebre)
      formData.append('tem_dor', temDor)
      formData.append('local_dor', localDor)
      formData.append('toma_medicamento', tomaMedicamento)
      formData.append('qual_medicamento', qualMedicamento)
      formData.append('tem_condicao_cronica', JSON.stringify(condicoesCronicas))
      formData.append('esta_gravida', estaGravida)
      
      if (foto) {
        formData.append('foto', foto)
        formData.append('descricao_foto', descricaoFoto)
      }

      const triagemId = await submitTriagem(formData)
      router.push(`/triagem/resultado/${triagemId}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar triagem. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  const inputClass = "w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2b85ff] focus:border-[#2b85ff] bg-white text-slate-900"
  const radioLabelClass = "flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-['Inter']">
      <div className="max-w-3xl mx-auto">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
            <span>Passo {step} de 4</span>
            <span>
              {step === 1 && 'Sintoma Principal'}
              {step === 2 && 'Perguntas de Acompanhamento'}
              {step === 3 && 'Foto (Opcional)'}
              {step === 4 && 'Confirmação'}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-[#2b85ff] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 animate-fade-in-up">
          
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#091426] mb-6 flex items-center gap-3">
                <Thermometer className="w-6 h-6 text-[#2b85ff]" />
                Sintoma Principal
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  O que você está sentindo? (Min 10 caracteres)
                </label>
                <textarea 
                  value={sintomaPrincipal}
                  onChange={e => setSintomaPrincipal(e.target.value)}
                  placeholder="Descreva o que está sentindo..."
                  className={`${inputClass} min-h-[120px] resize-y`}
                  maxLength={500}
                />
                <div className="text-right text-xs text-slate-500 mt-1">{sintomaPrincipal.length}/500</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Há quanto tempo começaram os sintomas?
                </label>
                <select 
                  value={duracao}
                  onChange={e => setDuracao(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  <option value="Hoje">Hoje</option>
                  <option value="1-3 dias">1-3 dias</option>
                  <option value="4-7 dias">4-7 dias</option>
                  <option value="Mais de 1 semana">Mais de 1 semana</option>
                  <option value="Mais de 1 mês">Mais de 1 mês</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex justify-between">
                  <span>Intensidade do desconforto</span>
                  <span className="font-bold text-[#2b85ff]">{intensidade}/10</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={intensidade}
                  onChange={e => setIntensidade(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #22c55e, #eab308, #ef4444)`
                  }}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>Leve (1)</span>
                  <span>Moderada (5)</span>
                  <span>Muito Forte (10)</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-[#091426] mb-6 flex items-center gap-3">
                <Pill className="w-6 h-6 text-[#2b85ff]" />
                Perguntas de Acompanhamento
              </h2>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Teve febre?</label>
                <div className="flex gap-4">
                  {['Sim', 'Não', 'Não sei'].map(opt => (
                    <label key={opt} className={radioLabelClass}>
                      <input type="radio" name="febre" value={opt} checked={temFebre === opt} onChange={e => setTemFebre(e.target.value)} className="w-4 h-4 text-[#2b85ff]" />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Está com dor?</label>
                <div className="flex gap-4">
                  {['Sim', 'Não'].map(opt => (
                    <label key={opt} className={radioLabelClass}>
                      <input type="radio" name="dor" value={opt} checked={temDor === opt} onChange={e => setTemDor(e.target.value)} className="w-4 h-4 text-[#2b85ff]" />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {temDor === 'Sim' && (
                  <div className="mt-2 animate-fade-in-up">
                    <input type="text" placeholder="Onde é a dor?" value={localDor} onChange={e => setLocalDor(e.target.value)} className={inputClass} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Tomou algum medicamento?</label>
                <div className="flex gap-4">
                  {['Sim', 'Não'].map(opt => (
                    <label key={opt} className={radioLabelClass}>
                      <input type="radio" name="medicamento" value={opt} checked={tomaMedicamento === opt} onChange={e => setTomaMedicamento(e.target.value)} className="w-4 h-4 text-[#2b85ff]" />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {tomaMedicamento === 'Sim' && (
                  <div className="mt-2 animate-fade-in-up">
                    <input type="text" placeholder="Qual medicamento?" value={qualMedicamento} onChange={e => setQualMedicamento(e.target.value)} className={inputClass} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Tem alguma condição crônica?</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {['Diabetes', 'Hipertensão', 'Asma', 'Cardiopatia', 'Nenhuma'].map(cond => (
                    <label key={cond} className={radioLabelClass}>
                      <input 
                        type="checkbox" 
                        checked={condicoesCronicas.includes(cond)} 
                        onChange={() => toggleCondicao(cond)}
                        className="w-4 h-4 text-[#2b85ff] rounded" 
                      />
                      <span className="text-sm">{cond}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Está grávida?</label>
                <div className="flex flex-wrap gap-4">
                  {['Sim', 'Não', 'Não se aplica'].map(opt => (
                    <label key={opt} className={radioLabelClass}>
                      <input type="radio" name="gravidez" value={opt} checked={estaGravida === opt} onChange={e => setEstaGravida(e.target.value)} className="w-4 h-4 text-[#2b85ff]" />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#091426] flex items-center gap-3">
                  <Camera className="w-6 h-6 text-[#2b85ff]" />
                  Foto (Opcional)
                </h2>
                <button onClick={nextStep} className="text-sm text-[#2b85ff] hover:underline font-medium">
                  Pular esta etapa
                </button>
              </div>
              
              <div 
                className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => !fotoPreview && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
                
                {fotoPreview ? (
                  <div className="relative inline-block">
                    <img src={fotoPreview} alt="Preview" className="max-h-64 rounded-xl object-contain" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFoto(); }}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-[#eef5ff] rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-[#2b85ff]" />
                    </div>
                    <div>
                      <p className="text-slate-700 font-medium">Clique para enviar ou arraste uma foto</p>
                      <p className="text-slate-500 text-sm mt-1">JPEG, PNG ou WebP até 5MB</p>
                    </div>
                  </div>
                )}
              </div>

              {foto && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descrição da foto (opcional)
                  </label>
                  <textarea 
                    value={descricaoFoto}
                    onChange={e => setDescricaoFoto(e.target.value)}
                    placeholder="Ex: Foto da mancha no meu braço..."
                    className={inputClass}
                    maxLength={200}
                  />
                  <div className="text-right text-xs text-slate-500 mt-1">{descricaoFoto.length}/200</div>
                </div>
              )}
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#091426] flex items-center gap-3">
                  <Check className="w-6 h-6 text-[#2b85ff]" />
                  Confirmação
                </h2>
                <button onClick={() => setStep(1)} className="text-sm text-[#2b85ff] hover:underline font-medium">
                  Voltar e editar
                </button>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-5">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wider">Sintoma</h3>
                  <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-100">{sintomaPrincipal}</p>
                  <div className="flex gap-4 mt-3">
                    <span className="bg-white px-3 py-1 rounded-full border border-slate-100 text-sm">
                      <span className="text-slate-500">Duração:</span> {duracao}
                    </span>
                    <span className="bg-white px-3 py-1 rounded-full border border-slate-100 text-sm">
                      <span className="text-slate-500">Intensidade:</span> {intensidade}/10
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wider mt-4">Perguntas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-sm">
                      <span className="text-slate-500">Febre:</span> {temFebre}
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-sm">
                      <span className="text-slate-500">Dor:</span> {temDor} {temDor === 'Sim' && localDor && `(${localDor})`}
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-sm">
                      <span className="text-slate-500">Medicamento:</span> {tomaMedicamento} {tomaMedicamento === 'Sim' && qualMedicamento && `(${qualMedicamento})`}
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-sm">
                      <span className="text-slate-500">Gravidez:</span> {estaGravida}
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-sm sm:col-span-2">
                      <span className="text-slate-500">Condições Crônicas:</span> {condicoesCronicas.join(', ')}
                    </div>
                  </div>
                </div>

                {foto && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wider mt-4">Foto Anexada</h3>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-start gap-4">
                      {fotoPreview && <img src={fotoPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />}
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{foto.name}</p>
                        {descricaoFoto && <p className="text-xs text-slate-500 mt-1">{descricaoFoto}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
            {step > 1 ? (
              <button 
                onClick={prevStep}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 transition-colors font-medium disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
                Voltar
              </button>
            ) : (
              <div></div> // Empty div to keep Next button on the right
            )}

            {step < 4 ? (
              <button 
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#091426] hover:bg-[#1a2c4e] text-white font-medium transition-colors"
              >
                Próximo
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2b85ff] hover:bg-blue-700 text-white font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Enviar Triagem
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
