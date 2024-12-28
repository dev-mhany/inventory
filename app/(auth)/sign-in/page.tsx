// app/(auth)/sign-in/page.tsx
'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../../lib/firebase'
import { useRouter } from 'next/navigation'
import { Box, TextField, Button, Typography } from '@mui/material'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSignIn = async () => {
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // On success, go to the new landing page
      router.push('/')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unknown error occurred.')
      }
    }
  }

  return (
    <Box sx={{ maxWidth: 400, margin: 'auto', mt: 10 }}>
      <Typography variant='h5' mb={3}>
        Sign In
      </Typography>
      <TextField
        label='Email'
        fullWidth
        margin='normal'
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <TextField
        label='Password'
        type='password'
        fullWidth
        margin='normal'
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && (
        <Typography color='error' mt={1}>
          {error}
        </Typography>
      )}
      <Button variant='contained' fullWidth sx={{ mt: 2 }} onClick={handleSignIn}>
        Sign In
      </Button>
    </Box>
  )
}
