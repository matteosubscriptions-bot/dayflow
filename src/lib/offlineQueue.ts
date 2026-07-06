"use client";

// Coda offline in IndexedDB: le registrazioni fatte senza connessione
// vengono salvate qui e sincronizzate (POST /api/notes) al ritorno online.

const DB_NAME = "filo-offline";
const STORE = "outbox";

export interface QueuedNote {
  id?: number;
  audioBase64: string | null;
  audioMime: string | null;
  audioDuration: number | null;
  transcript: string;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueNote(note: Omit<QueuedNote, "id">): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(note);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function pendingCount(): Promise<number> {
  const db = await openDb();
  const count = await new Promise<number>((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return count;
}

async function takeAll(): Promise<QueuedNote[]> {
  const db = await openDb();
  const items = await new Promise<QueuedNote[]>((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedNote[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

async function remove(id: number): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** Invia tutte le note in coda. Ritorna quante ne restano. */
export async function flushQueue(): Promise<number> {
  const items = await takeAll();
  for (const item of items) {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: item.transcript,
          audioBase64: item.audioBase64,
          audioMime: item.audioMime,
          audioDuration: item.audioDuration,
          source: "RECORDING",
          createdAt: item.createdAt,
        }),
      });
      if (!res.ok) break; // riprova al prossimo giro
      if (item.id != null) await remove(item.id);
    } catch {
      break; // ancora offline
    }
  }
  return pendingCount();
}
