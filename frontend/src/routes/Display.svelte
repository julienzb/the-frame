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

  $effect(() => {
    document.documentElement.style.setProperty("--offset-bottom", `${store?.settings.offsetBottom ?? 0}px`);
    document.documentElement.style.setProperty("--offset-top", `${store?.settings.offsetTop ?? 0}px`);
  });
</script>

<div class="wrapper">
  {#if activeItem}
    {#if activeItem.type === "image"}
      <img src={`/media/${activeItem.id}${activeItem.ext}`} alt={activeItem.displayname} />
    {:else}
      <video src={`/media/${activeItem.id}${activeItem.ext}`} autoplay loop muted></video>
    {/if}
  {:else}
    <p>No active item set.</p>
  {/if}
</div>

<style>
  :root {
    --offset-bottom: 0px;
    --offset-top: 0px;
  }

  img,
  video {
    position: fixed;
    top: 50%;
    left: 50%;
    display: block;
    margin: 0;
    padding: 0;
    height: calc(100svw - var(--offset-bottom) - var(--offset-top));
    width: 100svh;
    overflow: hidden;
    object-fit: cover;
    object-position: center;
    transform: translate(calc(-50% + (var(--offset-bottom) - var(--offset-top)) / 2), -50%) rotate(90deg);
  }
</style>
