<script lang="ts">
  import Counter from './lib/Counter.svelte';
</script>

<main>
  <h1>AI Readiness Dojo</h1>
  <p>A monorepo demonstrating AI-readiness best practices</p>
  <Counter />
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
