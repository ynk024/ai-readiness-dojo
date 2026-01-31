import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Counter from '../src/lib/Counter.svelte';

describe('Counter', () => {
  it('should render with initial count of 0', () => {
    render(Counter);
    expect(screen.getByText(/Count:/)).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('should have increment, decrement, and reset buttons', () => {
    render(Counter);
    expect(screen.getByText('+')).toBeTruthy();
    expect(screen.getByText('-')).toBeTruthy();
    expect(screen.getByText('Reset')).toBeTruthy();
  });

  it('should increment count when + button is clicked', async () => {
    const { component } = render(Counter);
    const incrementBtn = screen.getByText('+');
    
    await incrementBtn.click();
    expect(screen.getByText('1')).toBeTruthy();
    
    await incrementBtn.click();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('should decrement count when - button is clicked', async () => {
    const { component } = render(Counter);
    const decrementBtn = screen.getByText('-');
    
    await decrementBtn.click();
    expect(screen.getByText('-1')).toBeTruthy();
    
    await decrementBtn.click();
    expect(screen.getByText('-2')).toBeTruthy();
  });

  it('should reset count to 0 when Reset button is clicked', async () => {
    const { component } = render(Counter);
    const incrementBtn = screen.getByText('+');
    const resetBtn = screen.getByText('Reset');
    
    // Increment a few times
    await incrementBtn.click();
    await incrementBtn.click();
    await incrementBtn.click();
    expect(screen.getByText('3')).toBeTruthy();
    
    // Reset
    await resetBtn.click();
    expect(screen.getByText('0')).toBeTruthy();
  });
});
