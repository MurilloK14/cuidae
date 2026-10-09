# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Cidadão brasileiro comum que está com algum sintoma de saúde e não sabe se deve ir ao posto de saúde (UBS), UPA 24h ou hospital. Situação típica: dor, febre, mal-estar — a pessoa não tem conhecimento clínico para avaliar a urgência e não quer perder horas na fila do lugar errado.

Usuário secundário (futuro): profissionais de saúde e gestores municipais que queiram otimizar o fluxo de pacientes na rede pública.

## Product Purpose

Cuidaê usa inteligência artificial para fazer triagem de sintomas e conectar o cidadão à unidade de saúde certa (UBS, UPA 24h, hospital municipal) na rede pública do SUS. O produto resolve o problema de não saber para onde ir: classifica a urgência (Verde / Amarelo / Vermelho, protocolo Manchester simplificado), mapeia as unidades de saúde mais próximas em tempo real, calcula rota, e oferece teleconsulta quando a avaliação não exige presença física.

Sucesso = o cidadão chega ao lugar certo, na hora certa, sem esperar na fila errada.

## Positioning

Diferente de pesquisar sintomas no Google (informação genérica, sem direcionamento local) ou ligar para o Disque Saúde 136 (humano, fila telefônica, sem geolocalização):

1. A IA cruza sintomas com dados reais de unidades de saúde próximas (UBS, UPA) e entrega a rota exata.
2. Além da triagem, oferece teleconsulta e agendamento direto com unidades parceiras.
3. É gratuito na camada base, funciona no navegador sem necessidade de instalar app, e é acessível de qualquer celular.

## Operating Context

- O cidadão acessa pelo celular (maioria) ou computador, geralmente quando está sentindo algo e precisa decidir rápido.
- A triagem leva menos de 2 minutos: relato de sintomas em linguagem natural → classificação de urgência → encaminhamento com mapa e rota.
- O dashboard guarda histórico de triagens e lembretes de saúde (vacinas, consultas, retornos, exames).
- Planos de assinatura: Gratuita (triagem e mapeamento), Intermediária e Premium (funcionalidades expandidas como teleconsulta e acompanhamento contínuo).

## Capabilities and Constraints

**Funcionalidades confirmadas:**
- Triagem multi-etapa com IA (sintomas → classificação de urgência → recomendação).
- Upload de documentação visual (foto de sintomas, max 5MB, Supabase Storage).
- Classificação: `verde` (Baixa → UBS), `amarelo` (Moderada → UBS ou teleconsulta), `vermelho` (Alta → UPA/SAMU).
- Mapeamento de UBSs e UPAs municipais com geolocalização.
- Autenticação com email/senha e Google OAuth via Supabase Auth.
- Dashboard com histórico de triagens e lembretes.
- Planos e checkout (gratuita / intermediária / premium).
- Página dedicada /como-funciona com FAQ.

**Restrições técnicas:**
- Next.js 14 App Router, React 18, TypeScript.
- Supabase (Auth, Database, Storage) com Row Level Security.
- Tailwind CSS 3 com fonte Inter.
- Three.js para modelos 3D decorativos (coração anatômico).

**Fatos abertos (não decididos):**
- Integração real com APIs de unidades de saúde municipais (atualmente usa dados de exemplo).
- Modelo de IA para triagem clínica (atualmente usa heurísticas no server action).
- Parceria formal com secretarias de saúde.

## Brand Commitments

- **Nome oficial:** Cuidaê (SaúdeIA era provisório e deve ser substituído progressivamente).
- **Logo:** `/images/cuidae-logo-trimmed.png`
- **Favicon:** `/images/cuidae-icon.png`
- **Idioma:** Português Brasileiro (pt-BR) em toda a interface.
- **Tom de voz:** Acessível, direto, acolhedor, sem jargões médicos desnecessários. Transmite confiança clínica sem ser frio ou burocrático.

## Evidence on Hand

- Landing page funcional com seções completas (Hero, Como Funciona, Benefícios, Hospitais, Missão, Impacto, CTA final).
- Fluxo de triagem multi-etapa funcional com upload de foto.
- Dados de exemplo de 4 unidades de saúde locais (UBS Jardim Saúde, UPA 24h Vergueiro, UBS Vila Mariana, Hospital Municipal Jabaquara).
- Modelo 3D de coração anatômico interativo (Three.js).
- Nenhum dado real de API municipal ou parceria formal documentada.
- Nenhum testimonial ou estudo de caso real.

## Product Principles

1. **Clareza sobre completude:** O cidadão deve entender exatamente o que fazer em menos de 2 minutos — o sistema mostra o caminho certo, não todas as opções possíveis.
2. **Confiança sem dependência:** A triagem orienta, mas nunca substitui o médico. O sistema é transparente sobre ser uma ferramenta de encaminhamento, não diagnóstico.
3. **Acesso universal:** Funciona no navegador de qualquer celular, sem app, sem cadastro obrigatório para a triagem básica, gratuito na camada base.
4. **Privacidade como padrão:** Conformidade com LGPD, dados de saúde criptografados, sem comercialização de informações pessoais.
5. **Localidade real:** O valor está no cruzamento com a rede municipal concreta — não em informação genérica, mas no posto específico a 800m da casa do cidadão.

## Accessibility & Inclusion

- Público-alvo inclui pessoas com baixa alfabetização digital — a linguagem deve ser simples e a navegação óbvia.
- Mobile-first: maioria dos acessos pelo celular, muitas vezes com conexão instável.
- Conformidade com WCAG 2.1 AA como meta mínima.
