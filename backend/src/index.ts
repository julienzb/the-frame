import express from 'express';
import path from 'path';
import http from 'http';
import { galleryRouter } from './gallery.js';
import { setupGallerySocket } from './gallerySocket.js';

const app = express();
const PORT = 3000;

// Static media serving [/media/12345.png]
app.use('/media', express.static(path.resolve('media')));

app.use(express.json());
app.use('/api/gallery', galleryRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.message);
  res.status(400).json({ error: err.message });
});

const server = http.createServer(app);
setupGallerySocket(server);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});