/* =========================================================
   Sincronização — contrato para o backend futuro.
   Hoje o app usa LocalOnlySync (nada sai do aparelho).
   Uma implementação Supabase deverá:
     1. autenticar o usuário (conta opcional);
     2. enviar registros com syncStatus 'local' | 'pending';
     3. baixar alterações remotas desde `lastPulledAt`;
     4. resolver conflitos por `updatedAt` (último vence) ou
        marcar 'conflict' para o usuário decidir;
     5. criptografar campos sensíveis antes do envio.
   ========================================================= */
import type { StoreName } from '@/database/db';

export interface SyncResult { pushed: number; pulled: number; conflicts: number; at: string; }

export interface SyncAdapter {
  readonly id: string;
  readonly enabled: boolean;
  /** Sessão atual (null = uso anônimo, só local). */
  getSession(): Promise<{ userId: string; email?: string } | null>;
  push(stores: StoreName[]): Promise<Pick<SyncResult, 'pushed' | 'conflicts'>>;
  pull(stores: StoreName[], since?: string): Promise<Pick<SyncResult, 'pulled' | 'conflicts'>>;
}

export class LocalOnlySync implements SyncAdapter {
  readonly id = 'local-only';
  readonly enabled = false;
  async getSession() { return null; }
  async push() { return { pushed: 0, conflicts: 0 }; }
  async pull() { return { pulled: 0, conflicts: 0 }; }
}

/*
 * Esboço para a terceira etapa (não ativo):
 *
 * export class SupabaseSync implements SyncAdapter {
 *   constructor(private client: SupabaseClient) {}
 *   readonly id = 'supabase'; readonly enabled = true;
 *   async getSession() { const { data } = await this.client.auth.getSession(); ... }
 *   async push(stores) { for each store: select where syncStatus in ('local','pending') → upsert → mark 'synced' }
 *   async pull(stores, since) { select where updated_at > since → merge }
 * }
 */

export const syncAdapter: SyncAdapter = new LocalOnlySync();
