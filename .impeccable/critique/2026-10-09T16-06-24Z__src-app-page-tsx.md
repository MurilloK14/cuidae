---
target: src/app/page.tsx
total_score: 25
max_score: 28
na_heuristics: 7,9,10
p0_count: 1
p1_count: 1
target_identity: "file:C:\\Users\\muril\\Projetos\\Site Saúde\\src\\app\\page.tsx"
target_fingerprint: "sha256:a5124a592daf881b0ce41e5a29ab7bd179e2cfcc0afb254097eb8d3c415499ad"
target_path: "C:\\Users\\muril\\Projetos\\Site Saúde\\src\\app\\page.tsx"
timestamp: 2026-10-09T16-06-24Z
slug: src-app-page-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Uso excelente de animações pulse e badges "Ao vivo" para triagem em tempo real |
| 2 | Match System / Real World | 4 | Uso perfeito da terminologia do SUS (UBS, UPA) e bairros/endereços locais |
| 3 | User Control and Freedom | 3 | Modal fecha facilmente; navegação simples |
| 4 | Consistency and Standards | 3 | Padrões de UI consistentes, mas inconsistência crítica no nome da marca ("SaúdeIA" vs "Cuidaê") |
| 5 | Error Prevention | 3 | Input do chat desativa quando vazio; validação básica |
| 6 | Recognition Rather Than Recall | 4 | Cards de hospitais e unidades exibem distância, status e especialidades de forma clara |
| 7 | Flexibility and Efficiency | n/a | Superfície do tipo Persuade (Landing Page) |
| 8 | Aesthetic and Minimalist Design | 4 | Tipografia limpa (Inter) e paleta clínica acolhedora |
| 9 | Error Recovery | n/a | Superfície do tipo Persuade (Landing Page) |
| 10 | Help and Documentation | n/a | Superfície do tipo Persuade (Landing Page) |
| **Total** | | **25/28** | **Good (89%)** |

#### Design Specificity Verdict

**Avaliação LLM**: O design é altamente contextualizado para a saúde pública brasileira e o SUS. O uso de unidades locais (UBS Jardim Saúde, UPA 24h Vergueiro) e termos como Cartão SUS transmite forte relevância. Porém, há uma inconsistência grave de marca: a interface e o chat mencionam "SaúdeIA", enquanto a logo e as configurações definem a marca como "Cuidaê".

**Verificação Determinística (Detector CLI)**:
- 8 avisos de **AI Color Palette** em `CyberHeartCSS.tsx` e `MeshyHeart3D.tsx` (gradientes roxo/violeta genéricos de IA).
- 1 aviso de **Bounce Easing** em `Hero.tsx` (`animate-bounce` na seta de rolagem).

#### Overall Impression
Uma landing page persuasiva, empática e bem estruturada para a realidade da saúde pública brasileira. O maior gargalo não é a estética geral (que é limpa e moderna), mas sim a inconsistência do nome da marca e a barreira de "Cadastro" que pode assustar o usuário idoso/periférico que só precisa saber onde ir urgente.

#### What's Working
1. **Especificidade Contextual Realista**: Nomes de postos (UBS, UPA) e locais reais geram identificação e confiança imediata.
2. **Demonstração Interativa do Celular (`HowItWorks`)**: O mockup de smartphone sincronizado com os 4 passos traduz um processo complexo em algo simples e visual.
3. **Copy Empático**: Frases como "Você relata o que está sentindo" e "Menos burocracia, mais saúde" falam diretamente com a dor do cidadão na fila do SUS.

#### Priority Issues

- **[P0] Inconsistência Crítica de Marca (SaúdeIA vs Cuidaê)**
  - *Why it matters*: Um serviço de saúde precisa de 100% de credibilidade. Ver nomes diferentes na mesma página passa impressão de golpe ou site amador.
  - *Fix*: Padronizar todo o texto e componentes para o nome oficial **Cuidaê**.
  - *Suggested command*: `$impeccable clarify`

- **[P1] Frito/Barreira no CTA da Hero ("Cadastre-se grátis")**
  - *Why it matters*: Pessoas com dores ou dúvidas de saúde não querem criar conta nem memorizar senhas antes de saberem se devem ir ao posto. Dona Maria desiste ao ver "Cadastro".
  - *Fix*: Alterar o CTA principal para "Fazer Triagem Gratuita" ou "Consultar Sintomas Agora" (sem exigir login para a triagem básica).
  - *Suggested command*: `$impeccable onboard`

- **[P2] Paleta de Cores "AI Slop" nos Componentes 3D**
  - *Why it matters*: Gradientes neon de roxo/violeta em `CyberHeartCSS` e `MeshyHeart3D` gritam "código gerado por IA genérica".
  - *Fix*: Alinhar os componentes 3D e efeitos com a paleta oficial da marca (#091426 escuro, #2b85ff azul e esmeralda).
  - *Suggested command*: `$impeccable colorize`

- **[P3] Animação de Bounce Datada na Hero**
  - *Why it matters*: Easing de `animate-bounce` na indicação de rolagem parece infantil/amador em um produto de saúde.
  - *Fix*: Substituir por um indicador de pulso ou transição suave com `ease-out-expo`.
  - *Suggested command*: `$impeccable animate`

- **[P3] Uso de Jargão "Protocolo de Manchester"**
  - *Why it matters*: O cidadão comum não sabe o que é Protocolo de Manchester.
  - *Fix*: Substituir por "Classificação de Urgência" ou "Nível de Risco".
  - *Suggested command*: `$impeccable clarify`

#### Persona Red Flags

- **Dona Maria (58 anos, periférica, baixa alfabetização digital)**: O botão "Cadastre-se grátis" assusta por medo de cobrança ou burocracia. O termo "Inteligência Artificial" na Hero pode soar robótico e frio.
- **Jordan (Confuso de primeira viagem)**: Na tela do celular no "Como Funciona", lê "Protocolo de Manchester" e não entende o que significa.
- **Casey (Mobile distraído)**: Auto-play do "Como Funciona" pode passar batido enquanto ele rola rápido no ônibus.
- **Riley (Stress tester)**: Nota imediatamente a divergência entre a marca "Cuidaê" na logo e "SaúdeIA" no texto do modal.

#### Minor Observations
- O menu mobile pode ser simplificado para manter apenas os 3 links principais em telas menores.
- Os números de impacto (+12.000 atendimentos) precisam ser acompanhados de uma legenda clara para não parecerem números inventados.

#### Questions to Consider
- O termo "Inteligência Artificial" ajuda a passar tecnologia ou assusta o público mais simples que busca um atendimento humano no SUS?
- A triagem inicial deveria ser 100% anônima para eliminar qualquer barreira de entrada?
