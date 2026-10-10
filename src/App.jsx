import { useState, useRef, useEffect } from 'react';
import { fetchBoasVindas, enviarSintomas, enviarImagem } from './services/api.js';
import './App.css';

let nextId = 1;

export default function App() {
  const [camada, setCamada] = useState('Gratuito');
  const [mensagens, setMensagens] = useState([]);
  const [inputTexto, setInputTexto] = useState('');
  const [resultadoTriagem, setResultadoTriagem] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [localizacao, setLocalizacao] = useState(null);
  const [locStatus, setLocStatus] = useState('solicitando'); // solicitando | ativa | negada

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Solicita geolocalização ao abrir o app
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocStatus('negada');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalizacao({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('ativa');
      },
      () => {
        setLocStatus('negada');
      }
    );
  }, []);

  // Busca a mensagem de boas-vindas
  const iniciarChat = async () => {
    setResultadoTriagem(null);
    try {
      const data = await fetchBoasVindas();
      setMensagens([{ id: nextId++, remetente: 'bot', texto: data.texto }]);
    } catch {
      setMensagens([{
        id: nextId++,
        remetente: 'bot',
        texto: 'Olá! Sou o assistente virtual do SaúdePraTodos. Descreva o que está sentindo ou envie uma foto de uma mancha/alteração na pele.'
      }]);
    }
  };

  useEffect(() => {
    iniciarChat();
  }, []);

  const resetChat = () => {
    iniciarChat();
  };

  // Rolagem automática
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, isTyping]);

  // Processa a resposta da API (triagem + mapa)
  const processarResposta = (data) => {
    setMensagens((prev) => [
      ...prev,
      { id: nextId++, remetente: 'bot', texto: data.texto }
    ]);

    if (data.triagem) {
      setResultadoTriagem({ ...data.triagem, mapa: data.mapa || null });
    }
  };

  // Enviar mensagem de texto
  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    if (!inputTexto.trim()) return;

    const textoEnviado = inputTexto;
    setMensagens((prev) => [
      ...prev,
      { id: nextId++, remetente: 'usuario', texto: textoEnviado }
    ]);
    setInputTexto('');
    setIsTyping(true);

    try {
      const data = await enviarSintomas(textoEnviado, camada, localizacao);
      processarResposta(data);
    } catch (err) {
      setMensagens((prev) => [
        ...prev,
        { id: nextId++, remetente: 'bot', texto: `⚠️ Erro: ${err.message}. Tente novamente.` }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Envio de foto com efeito de "IA trabalhando"
  const handleEnviarFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setMensagens((prev) => [
      ...prev,
      { id: nextId++, remetente: 'usuario', imagem: imageUrl }
    ]);

    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setMensagens((prev) => [...prev, { id: nextId++, remetente: 'bot', texto: '📷 Recebi sua imagem. Iniciando escaneamento dermatológico e análise de coloração...' }]);

    await new Promise(resolve => setTimeout(resolve, 1500));
    setMensagens((prev) => [...prev, { id: nextId++, remetente: 'bot', texto: '⚙️ Extraindo padrões e cruzando com o banco de dados clínico...' }]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const data = await enviarImagem(file, camada, localizacao);
      processarResposta(data);
    } catch (err) {
      setMensagens((prev) => [
        ...prev,
        { id: nextId++, remetente: 'bot', texto: `⚠️ Erro ao analisar imagem: ${err.message}` }
      ]);
    } finally {
      setIsTyping(false);
      URL.revokeObjectURL(imageUrl);
    }

    e.target.value = '';
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
        <div className="header-top">
          <h1>🏥 SaúdePraTodos</h1>
          <div className="header-actions">
            <span
              className={`loc-badge ${locStatus}`}
              title={locStatus === 'ativa' ? 'Localização ativa' : 'Localização desativada'}
            >
              {locStatus === 'ativa' ? '📍' : locStatus === 'solicitando' ? '⏳' : '📍❌'}
            </span>
            <button onClick={resetChat} className="reset-btn" title="Nova Consulta">
              🔄
            </button>
          </div>
        </div>
        <div className="layer-selector">
          {['Gratuito', 'Intermediário', 'Premium'].map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => setCamada(tipo)}
              className={`layer-btn ${camada === tipo ? 'active' : ''}`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </header>

      {/* ÁREA DO CHAT */}
      <main className="chat-area">
        {mensagens.map((msg) => (
          <div key={msg.id} className={`msg-row ${msg.remetente === 'bot' ? 'bot' : 'user'}`}>
            <div className={`msg-bubble ${msg.remetente === 'bot' ? 'bot' : 'user'}`}>
              {msg.texto && <p>{msg.texto}</p>}
              {msg.imagem && <img src={msg.imagem} alt="Sintoma enviado pelo usuário" />}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="msg-row bot">
            <div className="msg-bubble bot">
              <p className="typing-indicator">Analisando...</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* ÁREA DE INPUT */}
      <form onSubmit={handleEnviarMensagem} className="input-area">
        <input
          type="text"
          value={inputTexto}
          onChange={(e) => setInputTexto(e.target.value)}
          placeholder="Descreva seu sintoma..."
          className="text-input"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="camera-btn"
          title="Enviar foto"
          aria-label="Enviar foto do sintoma"
        >
          📷
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleEnviarFoto}
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        <button type="submit" className="send-btn">
          Enviar
        </button>
      </form>

      {/* RESULTADO DA TRIAGEM */}
      {resultadoTriagem && (
        <section className="result-section">
          <h3>📋 Encaminhamento</h3>
          <p><strong>Diagnóstico:</strong> {resultadoTriagem.recomendacao}</p>
          {resultadoTriagem.especialidade && (
            <p><strong>Especialidade:</strong> {resultadoTriagem.especialidade}</p>
          )}
          <p><strong>Direcionamento:</strong> {resultadoTriagem.local}</p>
          <p>
            <strong>Prioridade:</strong>{' '}
            <span className={`priority-badge ${resultadoTriagem.prioridade?.toLowerCase()}`}>
              {resultadoTriagem.prioridade}
            </span>
          </p>
          {resultadoTriagem.orientacao && (
            <p><strong>Orientação:</strong> {resultadoTriagem.orientacao}</p>
          )}

          {/* LINK DO MAPA */}
          {resultadoTriagem.mapa && (
            <a
              href={resultadoTriagem.mapa.url}
              target="_blank"
              rel="noopener noreferrer"
              className="maps-link"
            >
              {resultadoTriagem.mapa.label}
            </a>
          )}
        </section>
      )}
    </div>
  );
}