import { useState, useRef, useEffect } from 'react';

export default function App() {
  const [camada, setCamada] = useState('Gratuito');
  const [mensagens, setMensagens] = useState([
    {
      id: 1,
      remetente: 'bot',
      texto: 'Olá! Sou o assistente virtual do SaúdePraTodos. Descreva o que está sentindo ou envie uma foto de uma mancha/alteração na pele.'
    }
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [resultadoTriagem, setResultadoTriagem] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Faz a rolagem automática do chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, isTyping]);

  const enviarMensagem = (e) => {
    e.preventDefault();
    if (!inputTexto.trim()) return;

    const textoEnviado = inputTexto;
    setMensagens((prev) => [
      ...prev, 
      { id: Date.now(), remetente: 'usuario', texto: textoEnviado }
    ]);
    setInputTexto('');
    setIsTyping(true);

    setTimeout(() => {
      processarRespostaIA(textoEnviado);
      setIsTyping(false);
    }, 1500);
  };

  // Função nova: Envio simulado de foto
  const enviarFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      
      // Adiciona a foto no chat como mensagem do usuário
      setMensagens((prev) => [
        ...prev,
        { id: Date.now(), remetente: 'usuario', imagem: imageUrl }
      ]);
      
      setIsTyping(true);

      // Simula a IA processando a imagem por 3 segundos
      setTimeout(() => {
        // Passamos a palavra "mancha" para forçar a sua lógica de pele a ativar
        processarRespostaIA('mancha');
        setIsTyping(false);
      }, 3000); 
    }
  };

  const processarRespostaIA = (sintoma) => {
    let respostaBot = '';
    let desfecho = null;

    if (sintoma.toLowerCase().includes('mancha') || sintoma.toLowerCase().includes('pele')) {
      respostaBot = 'Analisando os sintomas de alteração na pele. Com base na urgência observada, geramos o encaminhamento ideal para o seu perfil de atendimento.';
      desfecho = {
        recomendacao: 'Encaminhamento para Avaliação Dermatológica',
        local:
          camada === 'Gratuito'
            ? 'UBS Mais Próxima (Atendimento Presencial)'
            : 'Teleconsulta com Especialista (Atendimento em até 24h)',
        prioridade: 'Média'
      };
    } else {
      respostaBot = 'Obrigado pelas informações. Registrei seus sintomas no sistema e recomendo o acompanhamento adequado.';
      desfecho = {
        recomendacao: 'Orientação de Cuidados e Triagem',
        local: 'Unidade Básica de Saúde (UBS)',
        prioridade: 'Normal'
      };
    }

    setMensagens((prev) => [
      ...prev,
      { id: Date.now(), remetente: 'bot', texto: respostaBot }
    ]);
    setResultadoTriagem(desfecho);
  };

  return (
    <div style={styles.appContainer}>
      {/* HEADER E CAMADAS (Sua lógica original com um toque de design) */}
      <header style={styles.header}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>🏥 SaúdePraTodos</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {['Gratuito', 'Intermediário', 'Premium'].map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setCamada(tipo)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: camada === tipo ? '2px solid #0ea5e9' : '1px solid #ccc',
                background: camada === tipo ? '#e0f2fe' : '#fff',
                cursor: 'pointer',
                fontWeight: camada === tipo ? 'bold' : 'normal'
              }}
            >
              {tipo}
            </button>
          ))}
        </div>
      </header>

      {/* ÁREA DO CHAT (Balões de mensagem) */}
      <main style={styles.chatArea}>
        {mensagens.map((msg) => (
          <div key={msg.id} style={msg.remetente === 'bot' ? styles.botRow : styles.userRow}>
            <div style={msg.remetente === 'bot' ? styles.botBubble : styles.userBubble}>
              {msg.texto && <p style={{ margin: 0 }}>{msg.texto}</p>}
              {msg.imagem && <img src={msg.imagem} alt="Sintoma" style={{ maxWidth: '100%', borderRadius: '8px' }} />}
            </div>
          </div>
        ))}
        {isTyping && (
           <div style={styles.botRow}>
             <div style={styles.botBubble}>
               <p style={{ margin: 0, fontStyle: 'italic', color: '#666' }}>Analisando...</p>
             </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* ÁREA DE INPUT (Com botão de câmera) */}
      <form onSubmit={enviarMensagem} style={styles.inputArea}>
        <input
          type="text"
          value={inputTexto}
          onChange={(e) => setInputTexto(e.target.value)}
          placeholder="Descreva seu sintoma..."
          style={styles.textInput}
        />
        
        {/* O botão da Câmera "Falsa IA" */}
        <button type="button" onClick={() => fileInputRef.current.click()} style={styles.cameraButton} title="Enviar foto">
          📷
        </button>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={enviarFoto} 
          style={{ display: 'none' }} 
        />

        <button type="submit" style={styles.sendButton}>
          Enviar
        </button>
      </form>

      {/* RESULTADO DA TRIAGEM (Sua lógica original) */}
      {resultadoTriagem && (
        <section style={styles.resultSection}>
          <h3 style={{ marginTop: 0, color: '#0ea5e9' }}>📋 Encaminhamento</h3>
          <p><strong>Diagnóstico:</strong> {resultadoTriagem.recomendacao}</p>
          <p><strong>Direcionamento:</strong> {resultadoTriagem.local}</p>
          <p><strong>Prioridade:</strong> {resultadoTriagem.prioridade}</p>
        </section>
      )}
    </div>
  );
}

// Estilos para transformar o código num "Celular" visualmente
const styles = {
  appContainer: {
    maxWidth: '400px',
    margin: '30px auto',
    height: '750px',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    backgroundColor: '#f8fafc',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#fff',
    padding: '16px',
    textAlign: 'center',
    borderBottom: '1px solid #e2e8f0'
  },
  chatArea: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  botRow: {
    display: 'flex',
    justifyContent: 'flex-start'
  },
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  botBubble: {
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '16px 16px 16px 0',
    maxWidth: '80%',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  userBubble: {
    backgroundColor: '#0ea5e9',
    color: '#fff',
    padding: '12px',
    borderRadius: '16px 16px 0 16px',
    maxWidth: '80%'
  },
  inputArea: {
    display: 'flex',
    padding: '12px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e2e8f0',
    gap: '8px'
  },
  textInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '20px',
    border: '1px solid #ccc',
    outline: 'none'
  },
  cameraButton: {
    background: '#f1f5f9',
    border: '1px solid #ccc',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    fontSize: '18px'
  },
  sendButton: {
    background: '#0ea5e9',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    padding: '0 16px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  resultSection: {
    margin: '12px',
    padding: '16px',
    backgroundColor: '#e0f2fe',
    border: '1px solid #bae6fd',
    borderRadius: '8px'
  }
};