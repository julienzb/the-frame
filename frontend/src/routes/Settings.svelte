<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { GalleryItem, Store } from "../lib/GalleryTypes";

  let ws: WebSocket;

  let store = $state<Store | null>(null);
  let activeId = $derived<string | null>(store?.settings.activeGalleryItemId ?? null);
  let galleryItemList = $derived<GalleryItem[] | null>(store?.gallery ?? null);

  async function loadActiveItem() {
    try {
      const response = await fetch("/api/gallery/active");
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const activeItem = (await response.json()) as GalleryItem | null;
      activeId = activeItem ? activeItem.id : null;
    } catch (err) {
      console.error("Failed to load active item:", err);
    }
  }

  async function loadGalleryItems() {
    try {
      const response = await fetch("/api/gallery");
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      galleryItemList = (await response.json()) as GalleryItem[];
    } catch (err) {
      console.error("Failed to load gallery items:", err);
    }
  }

  async function setActiveItem(id: string | null) {
    // optimistic update
    activeId = id;

    try {
      const response = await fetch("/api/gallery/active", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error ?? `Request failed with status ${response.status}`);
      }
    } catch (err) {
      console.error("Failed to update active gallery item:", err);
    }
  }

  async function uploadFile(event: Event & { currentTarget: HTMLInputElement }) {
    const { files } = event.currentTarget;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await fetch("api/gallery/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
    } catch (err) {
      console.error("Failed to upload file", err);
    }
  }

  async function setOffset(top: number | null, bottom: number | null) {
    try {
      const response = await fetch("/api/settings/offset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ top, bottom }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error ?? `Request failed with status ${response.status}`);
      }
    } catch (err) {
      console.error("Failed to update offset:", err);
    }
  }

  function handleBlur(type: "top" | "bottom") {
    return (e: FocusEvent) => {
      const input = (e.currentTarget as HTMLInputElement).valueAsNumber;
      setOffset(type === "top" ? input : null, type === "bottom" ? input : null);
    };
  }

  function handleKeyDown(type: "top" | "bottom") {
    return (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      const input = (e.currentTarget as HTMLInputElement).valueAsNumber;
      setOffset(type === "top" ? input : null, type === "bottom" ? input : null);
    };
  }

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
    loadActiveItem();
    loadGalleryItems();
  });
</script>

<wrapper>
  {#if store}
    <h1>The Frame</h1>
    <section class="settings">
      <h2>Settings</h2>
      <div class="settings-section">
        <div class="setting">
          <p>Offset Top</p>
          <input
            type="number"
            bind:value={store.settings.offsetTop}
            onblur={handleBlur("top")}
            onkeydown={handleKeyDown("top")}
          />
          <p>px</p>
        </div>
        <div class="setting">
          <p>Offset Bottom</p>
          <input
            type="number"
            bind:value={store.settings.offsetBottom}
            onblur={handleBlur("bottom")}
            onkeydown={handleKeyDown("bottom")}
          />
          <p>px</p>
        </div>
      </div>
    </section>
    <section class="gallery">
      <h2>Gallery</h2>
      <input type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.webm" onchange={(e) => uploadFile(e)} />
      <div class="grid">
        {#each galleryItemList as gi (gi.id)}
          <div class="grid-item">
            <input
              type="checkbox"
              bind:checked={() => activeId === gi.id, (checked) => setActiveItem(checked ? gi.id : null)}
            />
            {#if gi.type === "image"}
              <img src={`/media/${gi.id}${gi.ext}`} alt={gi.displayname} />
            {:else}
              <video src={`/media/${gi.id}${gi.ext}`} autoplay loop muted></video>
            {/if}
            <div class="metadata">
              <div class="tags">
                <p class={["type", gi.type]}>{gi.type}</p>
                <p class="ext">{gi.ext.replace(".", "")}</p>
              </div>
              <p class="filename">{gi.displayname}</p>
              <p class="id">{gi.id}</p>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</wrapper>

<style>
  p {
    margin: 0;
  }
  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .setting {
    display: flex;
    gap: 4px;
    align-items: baseline;
  }
  .setting p {
    width: 144px;
  }
  .setting input {
    width: 40px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    padding: 4px 8px;
    background-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 1);
  }

  wrapper {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 12px;
  }
  section {
    padding: 24px;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 200px));
    gap: 1rem;
  }

  .grid-item {
    padding: 4px;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.05);
  }

  .metadata {
    margin: 12px 8px 8px 8px;
  }

  img,
  video {
    border-radius: 4px;
    max-width: 100%;
    height: auto;
    display: block;
    aspect-ratio: 1/1;
    object-fit: cover;
    object-position: center;
  }

  .tags {
    display: flex;
    gap: 4px;
    margin: 0 0 2px 0;
  }

  .type,
  .ext {
    font-size: 66%;
    line-height: 100%;
    font-weight: bold;
    text-transform: uppercase;

    border-radius: 4px;
    padding: 2px 4px;
    background-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 1);
  }

  .image {
    background-color: rgba(255, 217, 0, 0.2);
    color: rgb(255, 217, 0);
  }
  .video {
    background-color: rgba(120, 208, 255, 0.2);
    color: rgba(120, 208, 255, 1);
  }
  .filename {
    font-weight: bold;
  }
</style>
