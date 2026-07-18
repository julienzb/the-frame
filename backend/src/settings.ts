import { Router } from "express";
import { upload } from "./upload.js";
import { readStore, writeStore, type GalleryItem, type Store } from "./store.js";
import path from "path";

export const settingsRouter = Router();

// Upload a new file
settingsRouter.post("/gallery/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No valid file uploaded" });
  }

  const newItem: GalleryItem = {
    id: path.parse(req.file.filename).name,
    ext: path.extname(req.file.filename),
    displayname: path.parse(req.file.originalname).name,
    type: [".mp4", ".webm"].includes(path.extname(req.file.filename)) ? "video" : "image",
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
settingsRouter.get("/gallery", (_req, res) => {
  const store = readStore();
  res.json(store.gallery);
});

// Get the currently active item
settingsRouter.get("/gallery/active", (_req, res) => {
  const store = readStore();
  const active = store.gallery.find((item) => item.id === store.settings.activeGalleryItemId);
  res.json(active ?? null);
});

// Update the currently active item
settingsRouter.put("/gallery/active", async (req, res) => {
  const { id } = req.body;

  const store = readStore();

  if (id != null) {
    const exists = store.gallery.some((item) => item.id === id);

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
  writeStore(updatedStore);
  const active = store.gallery.find((item) => item.id === id);
  res.status(200).json(active ?? null);
});

// Update the offset
settingsRouter.put("/settings/offset", async (req, res) => {
  const { top, bottom } = req.body;
  const store = readStore();

  console.log(top, bottom);

  if (top != null && (typeof top != "number" || !Number.isFinite(top))) {
    return res.status(404).json({ error: "Invalid input for top offset" });
  }
  if (bottom != null && (typeof bottom != "number" || !Number.isFinite(bottom))) {
    return res.status(404).json({ error: "Invalid input for bottom offset" });
  }

  const updatedStore: Store = {
    ...store,
    settings: {
      ...store.settings,
      offsetTop: top === null ? store.settings.offsetTop : top,
      offsetBottom: bottom === null ? store.settings.offsetBottom : bottom,
    },
  };
  console.log(updatedStore);
  writeStore(updatedStore);
  res.status(200).json(top ?? null);
});
