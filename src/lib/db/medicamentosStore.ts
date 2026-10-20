import fs from 'fs';
import path from 'path';
import type { MedicamentoItem, CategoriaMedicamento, ProgramaDispensacao } from '../types';

const DB_PATH = path.resolve(process.cwd(), 'data/medicamentos.json');

/**
 * Fórmula de Haversine para cálculo de distância em km
 */
export function calcularDistanciaKm(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function carregarDoArquivo(): MedicamentoItem[] {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as MedicamentoItem[];
  } catch (err) {
    console.error('Erro ao ler data/medicamentos.json:', err);
    return [];
  }
}

/**
 * Retorna todos os medicamentos cadastrados
 */
export async function getAllMedicamentos(): Promise<MedicamentoItem[]> {
  return carregarDoArquivo();
}

/**
 * Busca medicamento pelo ID único
 */
export async function getMedicamentoById(id: string): Promise<MedicamentoItem | null> {
  const lista = carregarDoArquivo();
  return lista.find((m) => m.id === id) || null;
}

export interface SearchMedicamentosParams {
  query?: string;
  categoria?: CategoriaMedicamento | string;
  programa?: ProgramaDispensacao | string;
  lat?: number | null;
  lng?: number | null;
}

/**
 * Busca e filtra medicamentos com suporte a busca textual, categoria, programa e geolocalização
 */
export async function searchMedicamentos(params: SearchMedicamentosParams = {}): Promise<MedicamentoItem[]> {
  const { query, categoria, programa, lat, lng } = params;
  let lista = carregarDoArquivo();

  // Filtro de Categoria
  if (categoria && categoria !== 'Todos') {
    const catLower = categoria.toLowerCase();
    lista = lista.filter((m) => m.categoria.toLowerCase() === catLower);
  }

  // Filtro de Programa
  if (programa && programa !== 'Todos') {
    const progLower = programa.toLowerCase();
    lista = lista.filter((m) => m.programa.toLowerCase().includes(progLower));
  }

  // Busca Textual (Nome, Princípio Ativo, Indicação)
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    lista = lista.filter(
      (m) =>
        m.nome.toLowerCase().includes(q) ||
        m.principio_ativo.toLowerCase().includes(q) ||
        m.indicacao.toLowerCase().includes(q) ||
        m.forma_farmaceutica.toLowerCase().includes(q)
    );
  }

  // Se latitude e longitude forem passadas, calcula a distância estimada para cada unidade
  if (lat != null && lng != null) {
    lista = lista.map((m) => ({
      ...m,
      unidades_disponiveis: m.unidades_disponiveis
        .map((u) => {
          const dist = calcularDistanciaKm(lat, lng, u.latitude, u.longitude);
          return {
            ...u,
            distancia_km: dist != null ? dist : u.distancia_km
          };
        })
        .sort((a, b) => (a.distancia_km || 999) - (b.distancia_km || 999))
    }));
  }

  return lista;
}

/**
 * Estatísticas para contadores e filtros
 */
export async function getEstatisticasMedicamentos() {
  const lista = carregarDoArquivo();
  const porCategoria: Record<string, number> = {};
  const porPrograma: Record<string, number> = {};

  for (const m of lista) {
    porCategoria[m.categoria] = (porCategoria[m.categoria] || 0) + 1;
    porPrograma[m.programa] = (porPrograma[m.programa] || 0) + 1;
  }

  return {
    total: lista.length,
    porCategoria,
    porPrograma
  };
}
