import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import ComingSoonPage from './page'

test('renders the coming soon heading', () => {
  render(<ComingSoonPage />)
  expect(screen.getByText(/coming soon/i)).toBeDefined()
  expect(screen.getByRole('status')).toBeDefined()
})
