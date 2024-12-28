// app/dashboard/layout.tsx
'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from '../providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { Box, Typography } from '@mui/material'

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in')
    }
  }, [user, loading, router])

  if (!user) {
    // Could render a loading spinner or something
    return null
  }

  return (
    <Box>
      <Typography variant='h5' mb={2}>
        Dashboard
      </Typography>
      <Box sx={{ borderTop: '1px solid #ccc', pt: 2 }}>{children}</Box>
    </Box>
  )
}
