// app/(auth)/sign-up/page.tsx
'use client'

import { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '../../../lib/firebase'
import { useRouter } from 'next/navigation'
import { Box, TextField, Button, Typography, MenuItem, Select } from '@mui/material'
import { UserRole } from '../../../types'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('viewer')
  const [error, setError] = useState('')

  const handleSignUp = async () => {
    setError('')
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      if (userCred.user) {
        await updateProfile(userCred.user, { displayName })
        localStorage.setItem('userRole', role)

        const userRef = doc(db, 'users', userCred.user.uid)
        await setDoc(userRef, {
          email,
          displayName,
          role,
          createdAt: serverTimestamp()
        })

        router.push('/')
      }
    } catch (err: unknown) {
      console.error('Sign-up error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred.')
      }
    }
  }

  return (
    <Box sx={{ maxWidth: 400, margin: 'auto', mt: 10 }}>
      <Typography variant='h5' mb={3}>
        Sign Up
      </Typography>
      <TextField
        label='Display Name'
        fullWidth
        margin='normal'
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
      />
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
      <Typography variant='body2' mt={2}>
        Select Role:
      </Typography>
      <Select fullWidth value={role} onChange={e => setRole(e.target.value as UserRole)}>
        <MenuItem value='viewer'>Viewer</MenuItem>
        <MenuItem value='editor'>Editor</MenuItem>
      </Select>
      {error && (
        <Typography color='error' mt={1}>
          {error}
        </Typography>
      )}
      <Button variant='contained' fullWidth sx={{ mt: 2 }} onClick={handleSignUp}>
        Sign Up
      </Button>
    </Box>
  )
}
