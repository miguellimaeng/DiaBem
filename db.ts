/* =========================================================
   IndexedDB — camada mínima, sem dependências.
   Cada "store" tem um nome e índices declarados aqui.
   Para mudar a estrutura, aumente DB_VERSION e adicione
   a migração em `upgrade`.
   ========================================================= */

export const DB_NAME = 'diabem';
export const DB_VERSION = 3;

/** Stores de registros com data/hora (índice `at`). */
export const TIMED_STORES = ['glucose', 'meals', 'insulin', 'medicationRecords', 'activities', 'moods', 'dayEvents', 'weights'] as const;
/** Stores de cadastros. */
export const ENTITY_STORES = ['medications', 'exams', 'examResults', 'appointments', 'questions', 'caregivers', 'insulinPlan'] as const;
/** Stores de chave fixa ou simples. */
export const KV_STORES = ['profile', 'settings', 'emergency', 'favorites', 'learningProgress', 'achievements'] as const;

export type TimedStore = (typeof TIMED_STORES)[number];
export type EntityStore = (typeof ENTITY_STORES)[number];
export type KVStore = (typeof KV_STORES)[number];
export type StoreName = TimedStore | EntityStore | KVStore;
export const ALL_STORES: StoreName[] = [...TIMED_STORES, ...ENTITY_STORES, ...KV_STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

function upgrade(db: IDBDatabase, oldVersion: number) {
  if (oldVersion < 1) {
    for (const name of TIMED_STORES) {
      const s = db.createObjectStore(name, { keyPath: 'id' });
      s.createIndex('at', 'at');
      s.createIndex('syncStatus', 'syncStatus');
    }
    for (const name of ENTITY_STORES) {
      const s = db.createObjectStore(name, { keyPath: 'id' });
      s.createIndex('syncStatus', 'syncStatus');
    }
    for (const name of KV_STORES) db.createObjectStore(name, { keyPath: 'id' });
  }
  if (oldVersion < 2 && !db.objectStoreNames.contains('insulinPlan')) {
    // v2: esquema de insulina transcrito da receita
    db.createObjectStore('insulinPlan', { keyPath: 'id' }).createIndex('syncStatus', 'syncStatus');
  }
  if (oldVersion < 3 && !db.objectStoreNames.contains('weights')) {
    // v3: registros de peso
    const s = db.createObjectStore('weights', { keyPath: 'id' });
    s.createIndex('at', 'at');
    s.createIndex('syncStatus', 'syncStatus');
  }
  // if (oldVersion < 4) { ...próximas migrações... }
}

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('IndexedDB indisponível neste navegador.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => upgrade(req.result, e.oldVersion);
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => console.warn('[DiaBem] Atualização do banco aguardando outra aba fechar.');
  });
  return dbPromise;
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function tx<T>(
  stores: StoreName | StoreName[],
  mode: IDBTransactionMode,
  run: (t: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  const db = await openDB();
  const t = db.transaction(stores, mode);
  const done = new Promise<void>((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error ?? new Error('Transação abortada'));
  });
  const result = await run(t);
  await done;
  return result;
}

export const idb = {
  get<T>(store: StoreName, key: IDBValidKey) {
    return tx(store, 'readonly', (t) => promisify<T | undefined>(t.objectStore(store).get(key)));
  },
  getAll<T>(store: StoreName) {
    return tx(store, 'readonly', (t) => promisify<T[]>(t.objectStore(store).getAll()));
  },
  getRange<T>(store: TimedStore, fromISO: string, toISO: string) {
    return tx(store, 'readonly', (t) =>
      promisify<T[]>(t.objectStore(store).index('at').getAll(IDBKeyRange.bound(fromISO, toISO))),
    );
  },
  put<T>(store: StoreName, value: T) {
    return tx(store, 'readwrite', (t) => promisify(t.objectStore(store).put(value)));
  },
  bulkPut<T>(store: StoreName, values: T[]) {
    return tx(store, 'readwrite', (t) => {
      const os = t.objectStore(store);
      values.forEach((v) => os.put(v));
    });
  },
  delete(store: StoreName, key: IDBValidKey) {
    return tx(store, 'readwrite', (t) => promisify(t.objectStore(store).delete(key)));
  },
  clear(store: StoreName) {
    return tx(store, 'readwrite', (t) => promisify(t.objectStore(store).clear()));
  },
  /** Apaga o banco inteiro (exclusão de dados — LGPD). */
  async destroy() {
    if (dbPromise) { (await dbPromise).close(); dbPromise = null; }
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  },
};
