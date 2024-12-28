// app/transactions/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { db } from '../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { Transaction } from '../../types'
import { Box, Typography, Button, List, ListItem, ListItemText } from '@mui/material'
import { useRouter } from 'next/navigation'

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      try {
        const querySnap = await getDocs(collection(db, 'transactions'))
        const txData: Transaction[] = []
        querySnap.forEach(docSnap => {
          const data = docSnap.data() as Omit<Transaction, 'id'>
          txData.push({ id: docSnap.id, ...data })
        })
        setTransactions(txData)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      }
      setLoading(false)
    }
    fetchTransactions()
  }, [])

  const handleNew = () => {
    router.push('/transactions/new')
  }

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Transactions
      </Typography>
      <Button variant='contained' onClick={handleNew}>
        Add New Transaction
      </Button>

      {loading ? (
        <Typography variant='body1' mt={2}>
          Loading transactions...
        </Typography>
      ) : (
        <List sx={{ mt: 2 }}>
          {transactions.map(tx => (
            <ListItem
              key={tx.id}
              sx={{ cursor: 'pointer' }}
              onClick={() => router.push(`/transactions/${tx.id}/edit`)}
            >
              <ListItemText
                primary={`${tx.date} - ${tx.type.toUpperCase()} (ID: ${tx.id})`}
                secondary={tx.notes ?? 'No notes'}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}
