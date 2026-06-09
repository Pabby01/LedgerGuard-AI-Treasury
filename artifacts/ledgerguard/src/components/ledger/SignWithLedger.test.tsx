import React from 'react'
import { render, screen } from '@testing-library/react'
import SignWithLedger from './SignWithLedger'

describe('SignWithLedger', () => {
  it('renders derivation input and button', () => {
    render(<SignWithLedger txId={1} fromAddress={'11111111111111111111111111111111'} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
