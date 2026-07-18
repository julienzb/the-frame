import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { readStore, storeEvents, type Store } from "./store.js";

export function setupSettingsSocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws/store" });

  wss.on("connection", (ws: WebSocket) => {
    const store = readStore();
    ws.send(JSON.stringify(store));
  });

  storeEvents.on("change", (store: Store) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(store));
    });
  });
}
