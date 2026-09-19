import React, { useState, useRef, useEffect } from 'react';

export default function ChatbotMVP() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Olá! Sou o assistente de triagem do SaúdePraTodos. Como posso ajudar você hoje?',
      options: ['🤒 Sintomas Gerais', '🔎 Analisar mancha na pele/olho']
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Faz o scroll automático para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Função para simular o bot digitando e respondendo
  const simulateBotResponse = (text, delay = 1500, options = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'bot', text, options }
      ]);
    }, delay);
  };

  // Lida com o clique nas opções (Triagem)
  const handleOptionClick = (option) => {
    // Adiciona a escolha do usuário na tela
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', text: option }
    ]);

    // Lógica da Árvore de Decisão
    if (option === '🤒 Sintomas Gerais') {
      simulateBotResponse(
        'Com base na nossa triagem da camada gratuita, recomendamos que você procure a UBS mais próxima para uma avaliação clínica.',
        1500
      );
    } 
    else if (option === '🔎 Analisar mancha na pele/olho') {
      simulateBotResponse(
        'Por favor, envie uma foto nítida da mancha ou alteração para que nossa IA possa analisar.',
        1500
      );
    }
    else if (option === 'Sim, agendar teleconsulta') {
      simulateBotResponse('Encaminhando você para um de nossos dermatologistas parceiros. Aguarde um momento...');
    }
  };

  // Lida com o upload da imagem (A Falsa IA)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      // Mostra a foto enviada pelo usuário
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'user', image: imageUrl }
      ]);
      
      // Simula a IA "pensando" (3 segundos)
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        simulateBotResponse(
          '🔍 Imagem analisada! Notei uma pequena alteração. Como você está no plano intermediário, recomendamos avaliação médica.',
          500,
          ['Sim, agendar teleconsulta', 'Não, obrigado']
        );
      }, 3000); // 3 segundos de atraso
    }
  };

  return (
    <div style={styles.container}>
      {/* Cabeçalho */}
      <div style={styles.header}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>SaúdePraTodos (MVP)</h2>
        <span style={{ fontSize: '12px', color: '#e2e8f0' }}>🟢 Online</span>
      </div>

      {/* Área de Mensagens */}
      <div style={styles.chatArea}>
        {messages.map((msg) => (
          <div key={msg.id} style={msg.sender === 'bot' ? styles.botMessageRow : styles.userMessageRow}>
            <div style={msg.sender === 'bot' ? styles.botBubble : styles.userBubble}>
              {msg.text && <p style={{ margin: 0 }}>{msg.text}</p>}
              {msg.image && <img src={msg.image} alt="Upload" style={styles.uploadedImage} />}
            </div>
            
            {/* Renderiza botões se houver opções na mensagem */}
            {msg.options && msg.sender === 'bot' && (
              <div style={styles.optionsContainer}>
                {msg.options.map((opt, index) => (
                  <button key={index} onClick={() => handleOptionClick(opt)} style={styles.optionButton}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={styles.botMessageRow}>
            <div style={styles.botBubble}>
              <p style={{ margin: 0, fontStyle: 'italic', color: '#4b5563' }}>Analisando...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de Input (Falsa) e Upload */}
      <div style={styles.inputArea}>
        <input 
          type="text" 
          placeholder="Digite ou escolha uma opção..." 
          style={styles.textInput} 
          disabled // Desabilitado para forçar o uso dos botões no MVP
        />
        <button 
          onClick={() => fileInputRef.current.click()} 
          style={styles.uploadButton}
          title="Enviar foto"
        >
          📷
        </button>
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImageUpload} 
        />
      </div>
    </div>
  );
}

// Estilos inline (pode passar para um arquivo CSS se preferir)
const styles = {
  container: {
    maxWidth: '400px',
    margin: '40px auto',
    height: '600px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'sans-serif'
  },
  header: {
    backgroundColor: '#0ea5e9',
    color: '#fff',
    padding: '16px',
    textAlign: 'center',
  },
  chatArea: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  botMessageRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  userMessageRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  botBubble: {
    backgroundColor: '#fff',
    color: '#1e293b',
    padding: '12px 16px',
    borderRadius: '16px 16px 16px 0',
    maxWidth: '80%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  userBubble: {
    backgroundColor: '#0ea5e9',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '16px 16px 0 16px',
    maxWidth: '80%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
    marginLeft: '8px'
  },
  optionButton: {
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    border: '1px solid #bae6fd',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px',
    transition: 'background 0.2s'
  },
  uploadedImage: {
    maxWidth: '100%',
    borderRadius: '8px',
    marginTop: '8px'
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
    padding: '12px',
    borderRadius: '24px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    backgroundColor: '#f1f5f9'
  },
  uploadButton: {
    backgroundColor: '#0ea5e9',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    cursor: 'pointer',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};