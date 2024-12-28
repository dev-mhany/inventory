// app/products/[productId]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '../../../../lib/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Product } from '../../../../types'
import { Box, TextField, Button, Typography } from '@mui/material'
import { useAuth } from '../../../providers/AuthProvider'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const { user } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)
      try {
        const docRef = doc(db, 'products', productId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<Product, 'id'>
          const loadedProduct: Product = { id: docSnap.id, ...data }
          setProduct(loadedProduct)
          setCode(String(loadedProduct.code))
          setNameAr(loadedProduct.nameAr)
          setNameEn(loadedProduct.nameEn)
          setBoxCapacity(loadedProduct.boxCapacity ?? 1)
          setDefaultPurchasePrice(loadedProduct.defaultPurchasePrice)
          setDefaultSellingPrice(loadedProduct.defaultSellingPrice)
        }
      } catch (err) {
        console.error('Error fetching product:', err)
      }
      setLoading(false)
    }
    fetchProduct()
  }, [productId])

  if (user?.role !== 'editor') {
    return (
      <Box mt={5}>
        <Typography color='error'>
          You do not have permission to edit products.
        </Typography>
      </Box>
    )
  }

  if (loading) {
    return <Typography>Loading product...</Typography>
  }

  if (!product) {
    return <Typography>Product not found.</Typography>
  }

  const handleUpdate = async () => {
    setError('')
    try {
      if (!code || !nameAr || !nameEn) {
        setError('Please fill in code, nameAr, and nameEn.')
        return
      }
      const docRef = doc(db, 'products', productId)
      await updateDoc(docRef, {
        code,
        nameAr,
        nameEn,
        boxCapacity,
        defaultPurchasePrice: defaultPurchasePrice ?? null,
        defaultSellingPrice: defaultSellingPrice ?? null,
        updatedAt: serverTimestamp()
      })
      router.push(`/products/${productId}`)
    } catch (err: unknown) {
      console.error('Error updating product:', err)
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  return (
    <Box sx={{ maxWidth: 500, margin: 'auto', mt: 4 }}>
      <Typography variant='h5' mb={2}>
        Edit Product
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
      {error && (
        <Typography color='error' mt={1}>
          {error}
        </Typography>
      )}
      <Button variant='contained' fullWidth sx={{ mt: 2 }} onClick={handleUpdate}>
        Save Changes
      </Button>
    </Box>
  )
}
