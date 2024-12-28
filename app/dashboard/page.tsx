// app/dashboard/page.tsx
'use client'

import { Box, Typography, Button } from '@mui/material'
import { useAuth } from '../providers/AuthProvider'
import { signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  return (
    <Box>
      <Typography variant='body1'>
        Hello, {user?.displayName ?? user?.email}! You are a(n){' '}
        <strong>{user?.role}</strong>.
      </Typography>
      <Box mt={2}>
        <Button variant='contained' onClick={() => router.push('/products')}>
          Go to Products
        </Button>
        <Button variant='outlined' sx={{ ml: 2 }} onClick={handleLogout}>
          Sign Out
        </Button>
      </Box>
    </Box>
  )
}
