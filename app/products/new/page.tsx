// app/products/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '../../../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Box, TextField, Button, Typography } from '@mui/material'
import { useAuth } from '../../providers/AuthProvider'

// Updated to ensure we reject with an Error
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    // Reject with a proper Error
    reader.onerror = () => {
      reject(new Error('Failed to read file.'))
    }
    reader.readAsDataURL(file)
  })
}

export default function NewProductPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [code, setCode] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [boxCapacity, setBoxCapacity] = useState(1)
  const [defaultPurchasePrice, setDefaultPurchasePrice] = useState<number | undefined>(
    undefined
  )
  const [defaultSellingPrice, setDefaultSellingPrice] = useState<number | undefined>(
    undefined
  )
  const [error, setError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  if (user?.role !== 'editor') {
    return (
      <Box mt={5}>
        <Typography color='error'>You do not have permission to add products.</Typography>
      </Box>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleAddProduct = async () => {
    setError('')
    try {
      if (!code || !nameAr || !nameEn) {
        setError('Please fill in all required fields (code, nameAr, nameEn).')
        return
      }

      const base64Images: string[] = []
      for (const file of selectedFiles) {
        const base64String = await fileToBase64(file)
        base64Images.push(base64String)
      }

      const docRef = await addDoc(collection(db, 'products'), {
        code,
        nameAr,
        nameEn,
        images: base64Images,
        boxCapacity,
        defaultPurchasePrice: defaultPurchasePrice ?? null,
        defaultSellingPrice: defaultSellingPrice ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      router.push(`/products/${docRef.id}`)
    } catch (err: unknown) {
      console.error('Error adding product:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to add product. Unknown error.')
      }
    }
  }

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <Typography variant='h5' mb={2}>
        Add New Product
      </Typography>
      <TextField
        label='Code'
        fullWidth
        margin='normal'
        value={code}
        onChange={e => setCode(e.target.value)}
      />
      <TextField
        label='Arabic Name (nameAr)'
        fullWidth
        margin='normal'
        value={nameAr}
        onChange={e => setNameAr(e.target.value)}
      />
      <TextField
        label='English Name (nameEn)'
        fullWidth
        margin='normal'
        value={nameEn}
        onChange={e => setNameEn(e.target.value)}
      />
      <TextField
        label='Box Capacity'
        type='number'
        fullWidth
        margin='normal'
        value={boxCapacity}
        onChange={e => setBoxCapacity(parseInt(e.target.value, 10))}
      />
      <TextField
        label='Default Purchase Price'
        type='number'
        fullWidth
        margin='normal'
        value={defaultPurchasePrice ?? ''}
        onChange={e => setDefaultPurchasePrice(parseFloat(e.target.value) || undefined)}
      />
      <TextField
        label='Default Selling Price'
        type='number'
        fullWidth
        margin='normal'
        value={defaultSellingPrice ?? ''}
        onChange={e => setDefaultSellingPrice(parseFloat(e.target.value) || undefined)}
      />

      <Box mt={2}>
        <Typography variant='body1'>Upload Images (optional):</Typography>
        <input type='file' multiple onChange={handleFileChange} accept='image/*' />
      </Box>

      {error && (
        <Typography color='error' mt={2}>
          {error}
        </Typography>
      )}
      <Button variant='contained' fullWidth sx={{ mt: 3 }} onClick={handleAddProduct}>
        Add Product
      </Button>
    </Box>
  )
}
