/* =========================================================
   Análise de foto de refeição — contrato para o futuro.
   Nesta versão NÃO há IA: o NoopAnalyzer não retorna nada.
   Qualquer implementação deve:
     - pedir consentimento antes de enviar a foto;
     - exibir a estimativa como sugestão editável;
     - nunca usar a estimativa para calcular dose de insulina.
   ========================================================= */
import type { FoodPhotoAnalysis } from '@/types/models';

export interface FoodPhotoAnalyzer {
  readonly available: boolean;
  analyze(photo: Blob): Promise<FoodPhotoAnalysis | null>;
}

export const foodPhotoAnalyzer: FoodPhotoAnalyzer = {
  available: false,
  async analyze() { return null; },
};
