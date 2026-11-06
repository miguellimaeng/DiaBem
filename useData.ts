/* Hook reativo: executa uma consulta e repete quando os dados mudam. */
import { useEffect, useRef, useState } from 'react';
import { onDataChange } from '@/database/repositories';
import type { StoreName } from '@/database/db';

export function useData<T>(query: () => Promise<T>, deps: unknown[], stores?: StoreName[]): { data: T | undefined; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const q = useRef(query);
  q.current = query;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    q.current()
      .then((d) => { if (alive) { setData(d); setLoading(false); } })
      .catch((e) => { console.error('[DiaBem] consulta falhou', e); if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  useEffect(() => onDataChange((s) => { if (!stores || stores.includes(s)) setTick((t) => t + 1); }), [stores?.join(',')]);

  return { data, loading, reload: () => setTick((t) => t + 1) };
}
