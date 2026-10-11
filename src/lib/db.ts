import type { Idea, Item, Profile } from "./types";

const DB_NAME = "acervo";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      const items = db.createObjectStore("items", { keyPath: "id" });
      items.createIndex("url", "url");
      db.createObjectStore("ideas", { keyPath: "id" });
      db.createObjectStore("profile");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function store(name: string, mode: IDBTransactionMode) {
  const db = await open();
  return db.transaction(name, mode).objectStore(name);
}

export async function getAllItems(): Promise<Item[]> {
  const all = await wrap((await store("items", "readonly")).getAll() as IDBRequest<Item[]>);
  return all.sort((a, b) => b.savedAt - a.savedAt);
}

export async function findItemByUrl(url: string): Promise<Item | undefined> {
  if (!url) return undefined;
  return wrap((await store("items", "readonly")).index("url").get(url) as IDBRequest<Item | undefined>);
}

export async function putItem(item: Item): Promise<void> {
  await wrap((await store("items", "readwrite")).put(item));
}

export async function putItems(items: Item[]): Promise<void> {
  const s = await store("items", "readwrite");
  await Promise.all(items.map((i) => wrap(s.put(i))));
}

export async function deleteItem(id: string): Promise<void> {
  await wrap((await store("items", "readwrite")).delete(id));
}

export async function getProfile(): Promise<Profile | undefined> {
  return wrap((await store("profile", "readonly")).get("main") as IDBRequest<Profile | undefined>);
}

export async function putProfile(profile: Profile): Promise<void> {
  await wrap((await store("profile", "readwrite")).put(profile, "main"));
}

export async function getAllIdeas(): Promise<Idea[]> {
  return wrap((await store("ideas", "readonly")).getAll() as IDBRequest<Idea[]>);
}

export async function replaceIdeas(ideas: Idea[]): Promise<void> {
  const s = await store("ideas", "readwrite");
  await wrap(s.clear());
  await Promise.all(ideas.map((i) => wrap(s.put(i))));
}

export async function putIdea(idea: Idea): Promise<void> {
  await wrap((await store("ideas", "readwrite")).put(idea));
}
