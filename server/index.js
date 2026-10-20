import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import triageRoutes from './routes/triage.js';
import unidadesRoutes from './routes/unidades.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas de triagem
app.use('/api/triage', triageRoutes);

// Rotas de unidades de saúde
app.use('/api/unidades', unidadesRoutes);

// Tratamento de erro global
app.use((err, _req, res, _next) => {
  console.error('Erro no servidor:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

export default app;
export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🏥 SaúdePraTodos API rodando em http://localhost:${PORT}`);
  });
}
