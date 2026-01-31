<script lang="ts">
  let count = $state(0);

  function increment() {
    count += 1;
  }

  function decrement() {
    count -= 1;
  }

  function reset() {
    count = 0;
  }
</script>

<div class="counter-container">
  <h2>Counter Example</h2>
  <div class="counter-display">
    <p>Count: <span class="count-value">{count}</span></p>
  </div>
  <div class="button-group">
    <button onclick={decrement}>-</button>
    <button onclick={reset}>Reset</button>
    <button onclick={increment}>+</button>
  </div>
</div>

<style>
  .counter-container {
    border: 2px solid #646cff;
    border-radius: 8px;
    padding: 2rem;
    margin: 2rem auto;
    max-width: 400px;
  }

  .counter-display {
    margin: 1.5rem 0;
  }

  .count-value {
    font-size: 2em;
    font-weight: bold;
    color: #646cff;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  button {
    min-width: 60px;
  }
</style>
