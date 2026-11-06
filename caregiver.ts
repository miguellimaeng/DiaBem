/* =========================================================
   Compartilhamento com cuidador — arquitetura futura.
   Princípios:
     - nada é compartilhado por padrão;
     - o usuário escolhe CATEGORIAS e um prazo;
     - acesso somente leitura; revogável a qualquer momento;
     - exige backend + conta (terceira etapa).
   ========================================================= */
import type { ShareCategory } from '@/types/models';

export const SHARE_CATEGORY_LABEL: Record<ShareCategory, string> = {
  glucose: 'Glicose', weight: 'Peso', meals: 'Refeições', insulin: 'Insulina', medications: 'Medicamentos',
  activity: 'Atividade física', mood: 'Como estou', exams: 'Exames', appointments: 'Consultas', emergency: 'Dados de emergência',
};

export const DEFAULT_SHARED_CATEGORIES: ShareCategory[] = []; // vazio de propósito

export function canShare(granted: ShareCategory[], category: ShareCategory) {
  return granted.includes(category);
}
