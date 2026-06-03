import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import Home from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));

test('renders the Dashboard', () => {
  render(<Home />)
  expect(screen.getByText(/NO CLONES CONNECTED/i)).toBeDefined()
})
