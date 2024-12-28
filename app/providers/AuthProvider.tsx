// app/providers/AuthProvider.tsx
'use client'

import { ReactNode, createContext, useState, useEffect, useContext, useMemo } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth, db } from '../../lib/firebase'
import { AuthUser, UserRole } from '../../types'
import { CircularProgress, Box } from '@mui/material'
import { doc, getDoc } from 'firebase/firestore'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data()
            const role: UserRole = (data?.role as UserRole) || 'viewer'
            const userData: AuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? (data?.email as string) ?? undefined,
              displayName: data?.displayName || firebaseUser.displayName || undefined,
              photoURL: firebaseUser.photoURL ?? undefined,
              role
            }
            setAuthUser(userData)
          } else {
            const fallbackUser: AuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? undefined,
              displayName: firebaseUser.displayName ?? undefined,
              photoURL: firebaseUser.photoURL ?? undefined,
              role: 'viewer'
            }
            setAuthUser(fallbackUser)
          }
        } catch (error) {
          console.error('Error fetching user doc:', error)
          const fallbackUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? undefined,
            displayName: firebaseUser.displayName ?? undefined,
            photoURL: firebaseUser.photoURL ?? undefined,
            role: 'viewer'
          }
          setAuthUser(fallbackUser)
        }
      } else {
        setAuthUser(null)
      }
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // useMemo to avoid creating a new object every render
  const contextValue = useMemo(() => ({ user: authUser, loading }), [authUser, loading])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
