// app/page.tsx
'use client'

import { Box, Typography, Button, Paper } from '@mui/material'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 5 }}>
      <Typography variant='h3' gutterBottom textAlign='center'>
        Inventory Management System
      </Typography>
      <Typography variant='h6' gutterBottom textAlign='center' sx={{ mb: 4 }}>
        Welcome! Please choose an option below:
      </Typography>

      {/* Replace Grid with Box */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 3
        }}
      >
        {/* Sign In */}
        <Box>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant='h5' gutterBottom>
              Already have an account?
            </Typography>
            <Button variant='contained' onClick={() => router.push('/sign-in')}>
              Sign In
            </Button>
          </Paper>
        </Box>

        {/* Sign Up */}
        <Box>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant='h5' gutterBottom>
              Need an account?
            </Typography>
            <Button variant='outlined' onClick={() => router.push('/sign-up')}>
              Sign Up
            </Button>
          </Paper>
        </Box>

        {/* Products */}
        <Box>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant='h5' gutterBottom>
              Manage Products
            </Typography>
            <Button variant='contained' onClick={() => router.push('/products')}>
              Go to Products
            </Button>
          </Paper>
        </Box>

        {/* Transactions */}
        <Box>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant='h5' gutterBottom>
              Manage Transactions
            </Typography>
            <Button variant='contained' onClick={() => router.push('/transactions')}>
              Go to Transactions
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}
