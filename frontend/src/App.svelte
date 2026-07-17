<script lang="ts">
  import Display from "./routes/Display.svelte";
  import Settings from "./routes/Settings.svelte";
  import Hub from "./routes/Hub.svelte";

  const path = window.location.pathname;
</script>

{#if path === "/settings"}
  <Settings />
{:else if path === "/display"}
  <Display />
{:else}
  <Hub />
{/if}
