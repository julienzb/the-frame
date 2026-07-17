import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

const DATA_DIR = path.resolve('data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

export interface GalleryItem {
  id: string;
  ext: string;
  displayname: string;
  type: 'image' | 'video';
  createdAt: number;
}

export interface Store {
  settings: {
    activeGalleryItemId: string | null;
  };
  gallery: GalleryItem[];
}

const defaultStore: Store = {
  settings: { activeGalleryItemId: null },
  gallery: [],
};

export const storeEvents = new EventEmitter();

export function readStore(): Store {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(STORE_PATH)) {
    writeStore(defaultStore);
    return defaultStore;
  }
  const raw = readFileSync(STORE_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function writeStore(store: Store): void {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  storeEvents.emit('change', store);
}