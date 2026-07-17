import { Router } from 'express';
import { upload } from './upload.js';
import { readStore, writeStore, type GalleryItem, type Store } from './store.js';
import path from 'path';

export const galleryRouter = Router();

// Upload a new file
galleryRouter.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No valid file uploaded' });
  }

  const newItem: GalleryItem = {
    id: path.parse(req.file.filename).name,
    ext: path.extname(req.file.filename),
    displayname: path.parse(req.file.originalname).name,
    type: ['.mp4', '.webm'].includes(path.extname(req.file.filename)) ? 'video' : 'image',
    createdAt: Date.now(),
  };

  const store = readStore();
  store.gallery.push(newItem);

  // If nothing is active yet, make this the active image automatically
  if (!store.settings.activeGalleryItemId) {
    store.settings.activeGalleryItemId = newItem.id;
  }

  writeStore(store);

  res.status(201).json(newItem);
});

// List all gallery items
galleryRouter.get('/', (_req, res) => {
  const store = readStore();
  res.json(store.gallery);
});

// Get the currently active item
galleryRouter.get('/active', (_req, res) => {
  const store = readStore();
  const active = store.gallery.find(
    (item) => item.id === store.settings.activeGalleryItemId
  );
  res.json(active ?? null);
});

// Update the currently active item
galleryRouter.put("/active", async (req, res) => {
  const { id } = req.body;

  const store = readStore();

  if (id != null) {
    const exists = store.gallery.some(
      (item) => item.id === id
    );

    if (!exists) {
      return res.status(404).json({ error: "Gallery item not found" });
    }
  }

  const updatedStore: Store = {
    ...store,
    settings: {
      ...store.settings,
      activeGalleryItemId: id,
    },
  };
  writeStore(updatedStore)
  const active = store.gallery.find(
    (item) => item.id === id
  );
  res.status(200).json(active ?? null);
});