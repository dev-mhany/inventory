'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '../../../../lib/firebase'
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  getDocs,
  addDoc
} from 'firebase/firestore'
import { Transaction, TransactionType, Product } from '../../../../types'
import { Box, Typography, TextField, MenuItem, Button, IconButton } from '@mui/material'
import { useAuth } from '../../../providers/AuthProvider'
import { v4 as uuidv4 } from 'uuid'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

interface TransactionItemInput {
  id: string
  batchNumber: string
  expirationDate?: string
  productCode: string
  boxes: number
  looseUnits: number
  unitPrice?: number
}

interface BatchData {
  id?: string
  batchNumber: string
  productCode: string
  expirationDate?: string
  boxCount: number
  looseUnits: number
}

export default function EditTransactionPage() {
  const router = useRouter()
  const params = useParams()
  const transactionId = params.transactionId as string
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [transaction, setTransaction] = useState<Transaction | null>(null)

  const [date, setDate] = useState('')
  const [type, setType] = useState<TransactionType>('import')
  const [businessPartnerId, setBusinessPartnerId] = useState('')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<TransactionItemInput[]>([])

  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<BatchData[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Load the transaction
        const txRef = doc(db, 'transactions', transactionId)
        const txSnap = await getDoc(txRef)
        if (!txSnap.exists()) {
          setTransaction(null)
          setLoading(false)
          return
        }
        const txData = txSnap.data() as Omit<Transaction, 'id'>
        const loadedTx: Transaction = { id: txSnap.id, ...txData }
        setTransaction(loadedTx)

        // Populate form fields
        setDate(loadedTx.date ?? '')
        setType(loadedTx.type)
        setBusinessPartnerId(loadedTx.businessPartnerId ?? '')
        setNotes(loadedTx.notes ?? '')

        // Convert transaction items to our editable format
        const mappedItems: TransactionItemInput[] = loadedTx.items.map(item => ({
          id: uuidv4(),
          batchNumber: item.batchId,
          productCode: String(item.productCode),
          expirationDate: '',
          boxes: item.boxes,
          looseUnits: item.looseUnits,
          unitPrice: item.unitPrice ?? 0
        }))
        setItems(mappedItems)

        // Load products
        const prodSnap = await getDocs(collection(db, 'products'))
        const prodData: Product[] = []
        prodSnap.forEach(docSnap => {
          const d = docSnap.data()
          prodData.push({
            id: docSnap.id,
            code: d.code,
            nameAr: d.nameAr,
            nameEn: d.nameEn,
            images: d.images || [],
            boxCapacity: d.boxCapacity,
            defaultPurchasePrice: d.defaultPurchasePrice,
            defaultSellingPrice: d.defaultSellingPrice,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          })
        })

        // Load batches
        const batchSnap = await getDocs(collection(db, 'batches'))
        const batchData: BatchData[] = []
        batchSnap.forEach(docSnap => {
          const b = docSnap.data() as Omit<BatchData, 'id'>
          batchData.push({
            id: docSnap.id,
            batchNumber: b.batchNumber,
            productCode: b.productCode,
            expirationDate: b.expirationDate,
            boxCount: b.boxCount,
            looseUnits: b.looseUnits
          })
        })

        setProducts(prodData)
        setBatches(batchData)
      } catch (err) {
        console.error('Error fetching transaction data:', err)
      }
      setLoading(false)
    }
    fetchData()
  }, [transactionId])

  if (user?.role !== 'editor') {
    return (
      <Box mt={5}>
        <Typography color='error'>
          You do not have permission to edit transactions.
        </Typography>
      </Box>
    )
  }

  if (loading) {
    return <Typography>Loading transaction...</Typography>
  }

  if (!transaction) {
    return <Typography>Transaction not found.</Typography>
  }

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: uuidv4(),
        batchNumber: '',
        expirationDate: '',
        productCode: '',
        boxes: 0,
        looseUnits: 0,
        unitPrice: 0
      }
    ])
  }

  const handleItemChange = (
    index: number,
    field: keyof TransactionItemInput,
    rawValue: string
  ) => {
    const newItems = [...items]
    const currentItem = newItems[index]

    if (field === 'boxes' || field === 'looseUnits') {
      const numVal = parseInt(rawValue, 10)
      currentItem[field] = isNaN(numVal) ? 0 : numVal
    } else if (field === 'unitPrice') {
      const floatVal = parseFloat(rawValue)
      currentItem.unitPrice = isNaN(floatVal) ? 0 : floatVal
    } else {
      // string fields
      currentItem[field] = rawValue
      // Reset batch if user changes product in export mode
      if (field === 'productCode' && type === 'export') {
        currentItem.batchNumber = ''
      }
    }

    newItems[index] = currentItem
    setItems(newItems)
  }

  const handleUpdate = async () => {
    try {
      if (!date) {
        alert('Please select a date.')
        return
      }

      // Convert items for Firestore
      const finalItems = items.map(item => {
        const totalUnits = item.boxes + item.looseUnits
        const totalValue = item.unitPrice != null ? item.unitPrice * totalUnits : null
        return {
          batchId: item.batchNumber,
          productCode: item.productCode,
          boxes: item.boxes,
          looseUnits: item.looseUnits,
          unitPrice: item.unitPrice ?? null,
          totalValue
        }
      })

      // If you need to revert old transaction effect on inventory, do it here
      for (const item of items) {
        await handleBatchUpdateOrCreate(item)
      }

      await updateDoc(doc(db, 'transactions', transactionId), {
        date,
        type,
        businessPartnerId: businessPartnerId ?? null, // replaced || with ??
        items: finalItems,
        notes: notes ?? '',
        updatedAt: serverTimestamp()
      })

      alert('Transaction updated successfully.')
      router.push('/transactions')
    } catch (err) {
      console.error('Error updating transaction:', err)
      alert('Failed to update transaction.')
    }
  }

  const handleDelete = async () => {
    const confirmed = confirm('Are you sure you want to delete this transaction?')
    if (!confirmed) return
    try {
      // Revert old inventory if needed, then remove doc
      await deleteDoc(doc(db, 'transactions', transactionId))
      alert('Transaction deleted successfully.')
      router.push('/transactions')
    } catch (err) {
      console.error('Error deleting transaction:', err)
      alert('Failed to delete transaction.')
    }
  }

  const handleBatchUpdateOrCreate = async (item: TransactionItemInput) => {
    const existingBatch = batches.find(
      b =>
        b.batchNumber === item.batchNumber && String(b.productCode) === item.productCode
    )
    const totalUnits = item.boxes + item.looseUnits

    if (type === 'export') {
      // Must subtract from existing
      if (!existingBatch?.id) {
        throw new Error(
          `Batch ${item.batchNumber} not found for product ${item.productCode}!`
        )
      }
      const stockInBatch = existingBatch.boxCount + existingBatch.looseUnits
      if (totalUnits > stockInBatch) {
        throw new Error(
          `Not enough stock in batch ${item.batchNumber} to export ${totalUnits} units!`
        )
      }
      const newTotal = stockInBatch - totalUnits
      await updateDoc(doc(db, 'batches', existingBatch.id), {
        boxCount: newTotal,
        looseUnits: 0
      })
    } else {
      // import
      if (!item.batchNumber) {
        throw new Error('No batch number provided for import.')
      }
      // Possibly update or create batch
      if (!existingBatch) {
        // new
        const newDoc = await addDoc(collection(db, 'batches'), {
          batchNumber: item.batchNumber,
          productCode: item.productCode,
          expirationDate: item.expirationDate ?? null,
          boxCount: item.boxes,
          looseUnits: item.looseUnits
        })
        setBatches(prev => [
          ...prev,
          {
            id: newDoc.id,
            batchNumber: item.batchNumber,
            productCode: item.productCode,
            expirationDate: item.expirationDate,
            boxCount: item.boxes,
            looseUnits: item.looseUnits
          }
        ])
      } else if (existingBatch.id) {
        const updatedBoxCount = existingBatch.boxCount + item.boxes
        const updatedLooseUnits = existingBatch.looseUnits + item.looseUnits
        await updateDoc(doc(db, 'batches', existingBatch.id), {
          expirationDate: existingBatch.expirationDate ?? item.expirationDate ?? null,
          boxCount: updatedBoxCount,
          looseUnits: updatedLooseUnits
        })
      }
    }
  }

  const columns =
    type === 'import' ? '2fr 2fr 2fr 2fr 1fr 1fr 1fr' : '2fr 2fr 2fr 1fr 1fr 1fr'

  return (
    <Box sx={{ maxWidth: 700, margin: 'auto', mt: 4 }}>
      <Typography variant='h5' mb={2}>
        Edit Transaction (ID: {transactionId})
      </Typography>

      <TextField
        label='Date'
        type='date'
        fullWidth
        margin='normal'
        value={date}
        onChange={e => setDate(e.target.value)}
      />
      <TextField
        select
        label='Type'
        fullWidth
        margin='normal'
        value={type}
        onChange={e => setType(e.target.value as TransactionType)}
      >
        <MenuItem value='import'>Import</MenuItem>
        <MenuItem value='export'>Export</MenuItem>
      </TextField>
      <TextField
        label='Business Partner ID'
        fullWidth
        margin='normal'
        value={businessPartnerId}
        onChange={e => setBusinessPartnerId(e.target.value)}
      />

      <Box mt={2}>
        <Typography variant='subtitle1'>Transaction Items</Typography>
        {items.map((item, idx) => {
          const relevantBatches = batches.filter(
            b => String(b.productCode) === item.productCode
          )

          return (
            <Box
              key={item.id}
              sx={{ display: 'grid', gridTemplateColumns: columns, gap: 2, mt: 2 }}
            >
              <TextField
                select
                label='Product'
                value={item.productCode}
                onChange={e => handleItemChange(idx, 'productCode', e.target.value)}
              >
                <MenuItem value=''>-- Select Product --</MenuItem>
                {products.map(p => (
                  <MenuItem key={p.code} value={String(p.code)}>
                    {p.nameEn} ({p.code})
                  </MenuItem>
                ))}
              </TextField>

              <IconButton
                color='primary'
                onClick={() => window.open('/products/new', '_blank')}
                sx={{ alignSelf: 'center' }}
              >
                <AddCircleOutlineIcon />
              </IconButton>

              {type === 'import' ? (
                <>
                  <TextField
                    label='Batch #'
                    value={item.batchNumber}
                    onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                  />
                  <TextField
                    label='Expiration'
                    type='date'
                    value={item.expirationDate ?? ''}
                    onChange={e =>
                      handleItemChange(idx, 'expirationDate', e.target.value)
                    }
                  />
                </>
              ) : (
                <TextField
                  select
                  label='Batch #'
                  value={item.batchNumber}
                  onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                >
                  <MenuItem value=''>-- Select Batch --</MenuItem>
                  {relevantBatches.map(b => (
                    <MenuItem key={b.batchNumber} value={b.batchNumber}>
                      {b.batchNumber}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                label='Boxes'
                type='number'
                value={item.boxes}
                onChange={e => handleItemChange(idx, 'boxes', e.target.value)}
              />
              <TextField
                label='Loose Units'
                type='number'
                value={item.looseUnits}
                onChange={e => handleItemChange(idx, 'looseUnits', e.target.value)}
              />
              <TextField
                label='Unit Price'
                type='number'
                value={item.unitPrice ?? ''}
                onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
              />
            </Box>
          )
        })}
        <Button variant='text' onClick={addItem} sx={{ mt: 1 }}>
          + Add Another Item
        </Button>
      </Box>

      <TextField
        label='Notes'
        fullWidth
        multiline
        rows={3}
        margin='normal'
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      <Button variant='contained' fullWidth sx={{ mt: 2 }} onClick={handleUpdate}>
        Save Changes
      </Button>
      <Button
        variant='outlined'
        color='error'
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleDelete}
      >
        Delete Transaction
      </Button>
    </Box>
  )
}
