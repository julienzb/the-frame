<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { GalleryItem, Store } from "../lib/GalleryTypes";

  let ws: WebSocket;

  let store = $state<Store | null>(null);
  let activeItem = $derived.by<GalleryItem | null>(() => {
    if (!store) return null;
    const activeId = store.settings.activeGalleryItemId;
    const activeItem = store.gallery.find((item) => item.id === activeId) ?? null;
    return activeItem;
  });

  onMount(() => {
    ws = new WebSocket(`ws://${location.host}/ws/store`);
    ws.onopen = () => console.log("[WS] connected");
    ws.onclose = (e) => console.log("[WS] closed", e.code, e.reason);
    ws.onerror = (e) => console.error("[WS] error", e);
    ws.onmessage = (event) => {
      store = JSON.parse(event.data) as Store;
    };
  });

  onDestroy(() => {
    ws?.close();
  });
</script>

{#if activeItem}
  {#if activeItem.type === "image"}
    <img src={`/media/${activeItem.id}${activeItem.ext}`} alt={activeItem.displayname} />
  {:else}
    <video src={`/media/${activeItem.id}${activeItem.ext}`} autoplay loop muted></video>
  {/if}
{:else}
  <p>No active item set.</p>
{/if}

<style>
  img,
  video {
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    object-fit: cover;
    object-position: center;
  }
</style>
