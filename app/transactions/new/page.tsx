'use client'

import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../../../lib/firebase'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore'
import { TransactionType, Product } from '../../../types'
import { Box, Typography, Button, TextField, MenuItem, IconButton } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../providers/AuthProvider'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

interface TransactionItemInput {
  id: string
  productCode: string
  batchNumber: string
  expirationDate?: string
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

export default function NewTransactionPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [date, setDate] = useState('')
  const [type, setType] = useState<TransactionType>('import')
  const [businessPartnerId, setBusinessPartnerId] = useState('')
  const [notes, setNotes] = useState('')

  const [items, setItems] = useState<TransactionItemInput[]>([
    {
      id: uuidv4(),
      productCode: '',
      batchNumber: '',
      expirationDate: '',
      boxes: 0,
      looseUnits: 0,
      unitPrice: undefined
    }
  ])

  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<BatchData[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
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
        console.error('Error fetching products/batches:', err)
      }
    }
    fetchData()
  }, [])

  if (user?.role !== 'editor') {
    return (
      <Box mt={5}>
        <Typography color='error'>
          You do not have permission to create transactions.
        </Typography>
      </Box>
    )
  }

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: uuidv4(),
        productCode: '',
        batchNumber: '',
        expirationDate: '',
        boxes: 0,
        looseUnits: 0,
        unitPrice: undefined
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
      currentItem[field] = isNaN(floatVal) ? 0 : floatVal
    } else {
      // string fields
      currentItem[field] = rawValue
      // Reset batchNumber if user changes productCode in export mode
      if (field === 'productCode' && type === 'export') {
        currentItem.batchNumber = ''
      }
    }
    newItems[index] = currentItem
    setItems(newItems)
  }

  const handleCreateTransaction = async () => {
    try {
      if (!date) {
        alert('Please enter a date.')
        return
      }

      interface FinalItem {
        batchId: string
        productCode: string
        boxes: number
        looseUnits: number
        unitPrice: number | null
        totalValue: number | null
      }
      const finalItems: FinalItem[] = []

      for (const item of items) {
        if (!item.productCode) {
          alert('Please select a product.')
          return
        }

        if (type === 'import' && !item.batchNumber) {
          alert('Please enter a batch number for import.')
          return
        }
        if (type === 'import' && !item.expirationDate) {
          alert('Please enter an expiration date for import.')
          return
        }
        if (type === 'export' && !item.batchNumber) {
          alert('Please select an existing batch to export from.')
          return
        }

        const totalUnits = item.boxes + item.looseUnits
        const totalValue = item.unitPrice != null ? item.unitPrice * totalUnits : null

        finalItems.push({
          batchId: item.batchNumber,
          productCode: item.productCode,
          boxes: item.boxes,
          looseUnits: item.looseUnits,
          unitPrice: item.unitPrice ?? null,
          totalValue
        })
      }

      // Create/update batch docs
      for (const item of items) {
        await handleBatchUpdateOrCreate(item)
      }

      // Create transaction
      await addDoc(collection(db, 'transactions'), {
        date,
        type,
        businessPartnerId: businessPartnerId || null,
        items: finalItems,
        notes: notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      alert('Transaction created successfully!')
      router.push('/transactions')
    } catch (err) {
      console.error('Error creating transaction:', err)
      alert('Failed to create transaction.')
    }
  }

  const handleBatchUpdateOrCreate = async (item: TransactionItemInput) => {
    const existingBatch = batches.find(
      b =>
        b.batchNumber === item.batchNumber && String(b.productCode) === item.productCode
    )
    const totalUnits = item.boxes + item.looseUnits

    if (type === 'export') {
      // Must have an existing batch
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
      if (!item.batchNumber || !item.expirationDate) return
      if (!existingBatch) {
        const newDoc = await addDoc(collection(db, 'batches'), {
          batchNumber: item.batchNumber,
          productCode: item.productCode,
          expirationDate: item.expirationDate,
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
          boxCount: updatedBoxCount,
          looseUnits: updatedLooseUnits
        })
      }
    }
  }

  const gridColumns =
    type === 'import' ? '2fr 2fr 2fr 2fr 1fr 1fr 1fr' : '2fr 2fr 2fr 1fr 1fr 1fr'

  return (
    <Box sx={{ maxWidth: 900, margin: 'auto', mt: 4 }}>
      <Typography variant='h5' mb={2}>
        New Transaction
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
        <Typography variant='subtitle1' gutterBottom>
          Transaction Items
        </Typography>

        {items.map((item, idx) => {
          const relevantBatches = batches.filter(
            b => String(b.productCode) === item.productCode
          )

          return (
            <Box
              key={item.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: gridColumns,
                gap: 2,
                mt: 2
              }}
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
                    value={item.expirationDate}
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

      <Button
        variant='contained'
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleCreateTransaction}
      >
        Create Transaction
      </Button>
    </Box>
  )
}
