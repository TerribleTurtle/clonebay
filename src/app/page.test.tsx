import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Home from './page'

test('renders the Dashboard', () => {
  render(<Home />)
  expect(screen.getByText(/EVE Fleet Command/i)).toBeDefined()
})
