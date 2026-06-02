import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Page from './page'

test('renders the landing page heading', () => {
  render(<Page />)
  expect(screen.getByRole('heading', { level: 1, name: 'EVE Online Unified Multibox Command Center' })).toBeDefined()
})
