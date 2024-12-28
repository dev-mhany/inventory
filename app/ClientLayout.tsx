'use client'

import { ReactNode } from 'react'
import { ThemeProvider, CssBaseline, Box } from '@mui/material'
import AuthProvider from './providers/AuthProvider'
import theme from './theme'

// This file is a CLIENT component (explicit "use client" directive).
export default function ClientLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Box sx={{ p: 2 }}>{children}</Box>
      </AuthProvider>
    </ThemeProvider>
  )
}
