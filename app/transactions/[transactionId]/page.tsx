// app/transactions/[transactionId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '../../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Transaction } from '../../../types'
import { Box, Typography, Button, Divider } from '@mui/material'
import { v4 as uuidv4 } from 'uuid'

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const transactionId = params.transactionId as string

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  // We'll store a local unique key for each item so we can avoid index as the key
  const [itemKeys, setItemKeys] = useState<string[]>([])

  useEffect(() => {
    async function fetchTransaction() {
      setLoading(true)
      try {
        const docRef = doc(db, 'transactions', transactionId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<Transaction, 'id'>
          const loadedTx: Transaction = { id: docSnap.id, ...data }
          setTransaction(loadedTx)

          // Generate stable local keys for each item
          if (loadedTx.items) {
            const newKeys = loadedTx.items.map(() => uuidv4())
            setItemKeys(newKeys)
          }
        }
      } catch (error) {
        console.error('Error fetching transaction:', error)
      }
      setLoading(false)
    }
    fetchTransaction()
  }, [transactionId])

  if (loading) {
    return <Typography>Loading transaction...</Typography>
  }

  if (!transaction) {
    return <Typography>Transaction not found.</Typography>
  }

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <Typography variant='h5' mb={2}>
        Transaction Details
      </Typography>

      <Typography>
        <strong>ID:</strong> {transaction.id}
      </Typography>
      <Typography>
        <strong>Date:</strong> {transaction.date}
      </Typography>
      <Typography>
        <strong>Type:</strong> {transaction.type}
      </Typography>
      <Typography>
        <strong>Business Partner ID:</strong> {transaction.businessPartnerId ?? 'N/A'}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant='h6'>Items</Typography>
      {transaction.items && transaction.items.length > 0 ? (
        transaction.items.map((item, index) => (
          <Box key={itemKeys[index]} sx={{ mb: 2 }}>
            <Typography>
              <strong>Product Code:</strong> {item.productCode}
            </Typography>
            <Typography>
              <strong>Batch ID:</strong> {item.batchId || 'N/A'}
            </Typography>
            <Typography>
              <strong>Boxes:</strong> {item.boxes}
            </Typography>
            <Typography>
              <strong>Loose Units:</strong> {item.looseUnits}
            </Typography>
            <Typography>
              <strong>Unit Price:</strong> {item.unitPrice ?? 'N/A'}
            </Typography>
            <Typography>
              <strong>Total Value:</strong> {item.totalValue ?? 'N/A'}
            </Typography>
            <Divider sx={{ mt: 1 }} />
          </Box>
        ))
      ) : (
        <Typography>No items in this transaction.</Typography>
      )}

      <Typography sx={{ mt: 2 }}>
        <strong>Notes:</strong> {transaction.notes ?? 'No notes.'}
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Button variant='contained' onClick={() => router.push('/transactions')}>
        Back to Transactions
      </Button>
    </Box>
  )
}
