// app/theme.ts
'use client' // because we use MUI in client components

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2' // or your brand color
    },
    secondary: {
      main: '#9c27b0'
    }
  }
  // Add other customizations if needed
})

export default theme
