import express from "express";
import path from "path";
import http from "http";
import fs from "fs";
import { fileURLToPath } from "url";
import { settingsRouter } from "./settings.js";
import { setupSettingsSocket } from "./settingsSocket.js";

const app = express();
const PORT = 3000;

// Create static file path [backend/dist/index.js -> ../../frontend/dist]
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
const mediaDir = path.resolve(__dirname, "../media");
const dataDir = path.resolve(__dirname, "../data");
const storeFile = path.join(dataDir, "store.json");

(function initialize() {
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
    console.log(`Created media directory at ${mediaDir}`);
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory at ${dataDir}`);
  }

  if (!fs.existsSync(storeFile)) {
    const defaultStore = {
      gallery: [],
      settings: { activeGalleryItemId: null, offsetTop: 0, offsetBottom: 0 },
    };
    fs.writeFileSync(storeFile, JSON.stringify(defaultStore, null, 2));
    console.log(`Created default store.json at ${storeFile}`);
  }
})();

(function routes() {
  // Static media serving [/media/12345.png]
  app.use("/media", express.static(mediaDir));

  // Gallery API
  app.use(express.json());
  app.use("/api", settingsRouter);

  // Serving static frontend files
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/media")) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.message);
    res.status(400).json({ error: err.message });
  });
})();

const server = http.createServer(app);
setupSettingsSocket(server);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
